"""
app.py
Flask routes for the Orders service. Every route here matches openapi.yaml exactly.
Assignment 5: HTTP Methods & Headers implementation.
"""

import gzip
import os
import time
from flask import Flask, request, jsonify, g, make_response

import store
from errors import (
    ApiError,
    problem,
    validate_order_create,
    validate_status_update,
    validate_cancellation,
    validate_order_list_params,
)

app = Flask(__name__)

# Configurable CORS allowed origin
CORS_ALLOWED_ORIGIN = os.environ.get("CORS_ALLOWED_ORIGIN", "https://campuseats.example.com")

# Per-client rate limit storage: client_id -> list of timestamps
_rate_limits: dict[str, list[float]] = {}


def reset_rate_limits() -> None:
    """Helper to clear rate limit state during tests."""
    _rate_limits.clear()


# ---------------------------------------------------------------------------
# WSGI Middleware: X-HTTP-Method-Override (A5)
# ---------------------------------------------------------------------------

class MethodOverrideMiddleware:
    """
    Interprets X-HTTP-Method-Override header on POST requests as a fallback
    for constrained clients unable to natively transmit PUT, PATCH, or DELETE.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        if environ.get("REQUEST_METHOD") == "POST":
            override = environ.get("HTTP_X_HTTP_METHOD_OVERRIDE")
            if override:
                method = override.strip().upper()
                if method in ("PUT", "PATCH", "DELETE"):
                    environ["REQUEST_METHOD"] = method
        return self.wsgi_app(environ, start_response)


app.wsgi_app = MethodOverrideMiddleware(app.wsgi_app)


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------

@app.errorhandler(ApiError)
def handle_api_error(err: ApiError):
    resp = jsonify(problem(err.status, err.title, err.detail, err.type))
    resp.status_code = err.status
    if err.status == 401:
        resp.headers["WWW-Authenticate"] = "Bearer"
    return resp


@app.errorhandler(404)
def handle_404(_e):
    body = problem(404, "Not found", "The requested resource does not exist.")
    return jsonify(body), 404


@app.errorhandler(405)
def handle_405(_e):
    body = problem(405, "Method Not Allowed", "The HTTP method is not supported for this route.")
    return jsonify(body), 405


@app.errorhandler(400)
def handle_400(_e):
    body = problem(400, "Bad Request", "The request could not be understood or was missing required parameters.")
    return jsonify(body), 400


# ---------------------------------------------------------------------------
# Before Request Hook: Content Negotiation, Authorization, Rate Limiting
# ---------------------------------------------------------------------------

@app.before_request
def check_request_prerequisites():
    # 1. Handle CORS preflight directly for OPTIONS requests (B6)
    if request.method == "OPTIONS":
        return None

    # 2. Content Negotiation: check Accept header (B1)
    accept = request.headers.get("Accept")
    if accept:
        # Client must accept application/json or wildcard
        acceptable = [mime.strip().split(";")[0] for mime in accept.split(",")]
        has_json = any(
            mime in ("application/json", "application/*", "*/*")
            for mime in acceptable
        )
        if not has_json:
            raise ApiError(406, "Not Acceptable", "Client must accept application/json.")

    # 3. Content-Type check for write requests with a payload (B1)
    if request.method in ("POST", "PATCH", "PUT") and request.data:
        content_type = request.headers.get("Content-Type", "")
        if not content_type.startswith("application/json"):
            raise ApiError(400, "Malformed body", "Content-Type must be application/json.")

    # 4. Authorization check on protected endpoints (B3)
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise ApiError(401, "Unauthorized", "Missing Authorization header with Bearer token.")

    if not auth_header.startswith("Bearer "):
        raise ApiError(401, "Unauthorized", "Authorization header must use Bearer scheme.")

    token = auth_header[7:].strip()
    if not token:
        raise ApiError(401, "Unauthorized", "Bearer token cannot be empty.")

    # 5. Per-client Rate Limiting (B5)
    # Identify client by Bearer token
    client_id = token
    now = time.time()
    window = 60.0
    limit = app.config.get("RATE_LIMIT", 60)

    timestamps = _rate_limits.setdefault(client_id, [])
    # Prune old timestamps
    _rate_limits[client_id] = [t for t in timestamps if now - t < window]
    timestamps = _rate_limits[client_id]

    g.rate_limit_limit = limit
    g.rate_limit_remaining = max(0, limit - len(timestamps))

    if len(timestamps) >= limit:
        oldest = timestamps[0]
        retry_after = max(1, int(window - (now - oldest)))
        g.rate_limit_remaining = 0
        resp = jsonify(
            problem(
                429,
                "Too Many Requests",
                f"Rate limit of {limit} requests per minute exceeded. Try again in {retry_after}s.",
            )
        )
        resp.status_code = 429
        resp.headers["Retry-After"] = str(retry_after)
        resp.headers["X-RateLimit-Limit"] = str(limit)
        resp.headers["X-RateLimit-Remaining"] = "0"
        return resp

    # Record this request timestamp
    timestamps.append(now)
    g.rate_limit_remaining = max(0, limit - len(timestamps))


# ---------------------------------------------------------------------------
# After Request Hook: Security, CORS, Rate Limit, Compression
# ---------------------------------------------------------------------------

@app.after_request
def apply_response_headers(response):
    # Security Headers (B7)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # CORS Headers (B6)
    origin = request.headers.get("Origin")
    allowed_origin = origin if origin else CORS_ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Origin"] = allowed_origin
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = (
        "Content-Type, Authorization, Idempotency-Key, If-Match, If-None-Match, X-HTTP-Method-Override"
    )

    # Rate Limiting Headers (B5)
    if hasattr(g, "rate_limit_limit"):
        response.headers["X-RateLimit-Limit"] = str(g.rate_limit_limit)
        response.headers["X-RateLimit-Remaining"] = str(g.rate_limit_remaining)

    # Gzip Compression if client accepts and body size warrants it (B1)
    accept_encoding = request.headers.get("Accept-Encoding", "")
    if "gzip" in accept_encoding and response.status_code in (200, 201) and not response.direct_passthrough:
        data = response.get_data()
        if len(data) >= 150:
            compressed = gzip.compress(data)
            response.set_data(compressed)
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Content-Length"] = str(len(compressed))

    return response


def _get_json_body() -> dict:
    """Parses JSON body; raises ApiError(400) if malformed or missing."""
    body = request.get_json(silent=True)
    if body is None:
        raise ApiError(400, "Malformed body", "Request body must be valid JSON.")
    return body


# ---------------------------------------------------------------------------
# POST /orders , GET /orders , OPTIONS /orders
# ---------------------------------------------------------------------------

@app.route("/orders", methods=["OPTIONS"])
def options_orders():
    resp = make_response("", 204)
    resp.headers["Allow"] = "GET, POST, OPTIONS"
    return resp


@app.route("/orders", methods=["POST"])
def create_order():
    body = _get_json_body()
    validate_order_create(body)  # raises ApiError(400/422) on bad input

    idempotency_key = request.headers.get("Idempotency-Key")
    try:
        order = store.create_order(
            customer_id=body["customerId"],
            items=body["items"],
            notes=body.get("notes", ""),
            idempotency_key=idempotency_key,
            payload=body,
        )
    except store.ConflictError as e:
        raise ApiError(409, "Idempotency conflict", str(e))

    etag = store.calculate_etag(order)
    response = jsonify(order.as_json())
    response.status_code = 201
    response.headers["Location"] = f"/orders/{order.order_id}"
    response.headers["ETag"] = etag
    return response


@app.route("/orders", methods=["GET"])
def list_orders():
    # Validate query parameters (A4)
    validate_order_list_params(request.args)

    customer_id = request.args.get("customerId")
    status = request.args.get("status")
    sort_by = request.args.get("sort", "createdAt")
    order_dir = request.args.get("order", "desc")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 10))

    orders, total_count = store.list_orders(
        customer_id=customer_id,
        status=status,
        sort_by=sort_by,
        order=order_dir,
        page=page,
        page_size=page_size,
    )

    resp = jsonify([o.as_json() for o in orders])
    resp.headers["X-Total-Count"] = str(total_count)
    return resp, 200


# ---------------------------------------------------------------------------
# GET /orders/{orderId} , PATCH /orders/{orderId} , OPTIONS /orders/{orderId}
# ---------------------------------------------------------------------------

@app.route("/orders/<order_id>", methods=["OPTIONS"])
def options_order_item(order_id):
    resp = make_response("", 204)
    resp.headers["Allow"] = "GET, PATCH, OPTIONS"
    return resp


@app.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    try:
        order = store.get_order(order_id)
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))

    etag = store.calculate_etag(order)

    # Conditional GET (C1): If-None-Match
    if_none_match = request.headers.get("If-None-Match")
    if if_none_match:
        # Match against quoted or unquoted ETag
        clean_if_none_match = if_none_match.strip()
        if clean_if_none_match in (etag, etag.strip('"'), f"W/{etag}"):
            resp = make_response("", 304)
            resp.headers["ETag"] = etag
            resp.headers["Cache-Control"] = "private, no-cache"
            return resp

    resp = jsonify(order.as_json())
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "private, no-cache"
    return resp, 200


@app.route("/orders/<order_id>", methods=["PATCH"])
def update_order_status(order_id):
    try:
        order = store.get_order(order_id)
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))

    current_etag = store.calculate_etag(order)

    # Conditional write (C2): If-Match
    if_match = request.headers.get("If-Match")
    if if_match:
        clean_if_match = if_match.strip()
        if clean_if_match not in (current_etag, current_etag.strip('"')):
            raise ApiError(
                412,
                "Precondition Failed",
                f"Supplied If-Match '{clean_if_match}' does not match current resource ETag {current_etag}.",
            )

    body = _get_json_body()
    validate_status_update(body)  # raises ApiError(400/422) on bad input

    try:
        order = store.update_status(order_id, body["status"])
    except store.ConflictError as e:
        raise ApiError(409, "Invalid status transition", str(e))

    new_etag = store.calculate_etag(order)
    resp = jsonify(order.as_json())
    resp.headers["ETag"] = new_etag
    return resp, 200


# ---------------------------------------------------------------------------
# POST /orders/{orderId}/cancel & /cancellation (Non-CRUD sub-resources, A2)
# ---------------------------------------------------------------------------

@app.route("/orders/<order_id>/cancel", methods=["OPTIONS"])
@app.route("/orders/<order_id>/cancellation", methods=["OPTIONS"])
def options_cancel_order(order_id):
    resp = make_response("", 204)
    resp.headers["Allow"] = "POST, OPTIONS"
    return resp


@app.route("/orders/<order_id>/cancel", methods=["POST"])
@app.route("/orders/<order_id>/cancellation", methods=["POST"])
def cancel_order(order_id):
    body = _get_json_body()
    validate_cancellation(body)  # raises ApiError(400/422) on bad input

    idempotency_key = request.headers.get("Idempotency-Key")
    try:
        cancellation = store.cancel_order(
            order_id=order_id,
            reason=body["reason"],
            idempotency_key=idempotency_key,
            payload=body,
        )
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))
    except store.ConflictError as e:
        raise ApiError(409, "Cannot cancel order", str(e))

    return jsonify(cancellation.as_json()), 201


if __name__ == "__main__":
    app.run(debug=True, port=5050)