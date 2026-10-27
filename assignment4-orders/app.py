"""
app.py
Flask routes for the Orders service. Every route here matches openapi.yaml exactly.
Assignment 5: HTTP Methods & Headers implementation.
Assignment 6: Honest responses (status codes, Problem Details, validation, negotiation).
"""

import gzip
import os
import time
import xml.etree.ElementTree as ET

from flask import Flask, request, jsonify, g, make_response
from werkzeug.exceptions import HTTPException

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

JSON = "application/json"
XML = "application/xml"

# Configurable CORS allowed origin
CORS_ALLOWED_ORIGIN = os.environ.get("CORS_ALLOWED_ORIGIN", "https://campuseats.example.com")

# Demo hook for the `item-unavailable` problem type: itemIds listed here are
# treated as out of stock. Override with UNAVAILABLE_ITEMS="a,b,c".
UNAVAILABLE_ITEMS = {
    s.strip() for s in os.environ.get("UNAVAILABLE_ITEMS", "sold-out").split(",") if s.strip()
}

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
# A6 (C3): content negotiation helpers: JSON by default, XML on request
# ---------------------------------------------------------------------------

def _fill_xml(el: ET.Element, value, item_tag: str) -> None:
    if isinstance(value, dict):
        for key, val in value.items():
            _fill_xml(ET.SubElement(el, str(key)), val, "item")
    elif isinstance(value, list):
        for val in value:
            _fill_xml(ET.SubElement(el, item_tag), val, "item")
    elif value is None:
        pass
    elif isinstance(value, bool):
        el.text = "true" if value else "false"
    else:
        el.text = str(value)


def respond(data, status: int = 200, root: str = "order", item_tag: str = "item"):
    """Build a success response in the format chosen by the Accept header (g.fmt)."""
    if getattr(g, "fmt", JSON) == XML:
        el = ET.Element(root)
        _fill_xml(el, data, item_tag)
        body = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(el, encoding="unicode")
        resp = make_response(body, status)
        resp.headers["Content-Type"] = "application/xml; charset=utf-8"
    else:
        resp = jsonify(data)
        resp.status_code = status
        resp.headers["Content-Type"] = "application/json; charset=utf-8"
    resp.headers["Vary"] = "Accept"
    return resp


# ---------------------------------------------------------------------------
# A6 (B4): wrap risky storage work; log the real error, return a clean one
# ---------------------------------------------------------------------------

def _guarded(fn, *args, **kwargs):
    """
    Call a store function. Known business errors pass through untouched so each
    route can map them (404/409). ANY other exception is logged in full on the
    server and replaced with a clean, transient 503 + Retry-After.
    """
    try:
        return fn(*args, **kwargs)
    except (store.ConflictError, store.NotFoundError, ApiError):
        raise
    except Exception:
        app.logger.exception("Storage failure in %s", getattr(fn, "__name__", repr(fn)))  # full detail stays here
        raise ApiError(
            503,
            "Service temporarily unavailable",
            "The orders store is temporarily unavailable. Please retry shortly.",
            slug="service-unavailable",
            headers={"Retry-After": "5"},
        )


# ---------------------------------------------------------------------------
# Error handlers: every failure goes through problem() (B1)
# ---------------------------------------------------------------------------

@app.errorhandler(ApiError)
def handle_api_error(err: ApiError):
    headers = dict(err.headers)
    if err.status == 401:
        headers["WWW-Authenticate"] = "Bearer"
    return problem(err.status, err.title, err.detail, err.slug, err.errors, headers)


@app.errorhandler(HTTPException)
def handle_http_exception(e: HTTPException):
    """404 / 405 / 400 / 413 ... raised by Flask/Werkzeug itself."""
    code = e.code or 500
    if code == 404:
        detail = "The requested resource does not exist."
    elif code == 405:
        detail = "The HTTP method is not supported for this route."
    else:
        detail = e.description or "The request could not be processed."
    headers = {}
    if code == 405 and getattr(e, "valid_methods", None):
        headers["Allow"] = ", ".join(e.valid_methods)
    return problem(code, e.name, detail, headers=headers)



@app.before_request
def check_request_prerequisites():
    g.fmt = JSON

    # 1. Handle CORS preflight
    if request.method == "OPTIONS":
        return None

    # 2. Content negotiation
    if request.headers.get("Accept"):
        best = request.accept_mimetypes.best_match([JSON, XML])

        if best is None:
            raise ApiError(
                406,
                "Not Acceptable",
                "This API can produce: application/json, application/xml.",
                slug="not-acceptable",
            )

        g.fmt = XML if best == XML else JSON

    # 3. Content-Type check
    if request.method in ("POST", "PATCH", "PUT") and request.data:
        if request.mimetype != JSON:
            raise ApiError(
                415,
                "Unsupported Media Type",
                "Content-Type must be application/json.",
                slug="unsupported-media-type",
            )

    # 4. Authorization check
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise ApiError(
            401, "Unauthorized",
            "Missing Authorization header with Bearer token."
        )

    if not auth_header.startswith("Bearer "):
        raise ApiError(
            401, "Unauthorized",
            "Authorization header must use Bearer scheme."
        )

    token = auth_header[7:].strip()

    if not token:
        raise ApiError(
            401, "Unauthorized",
            "Bearer token cannot be empty."
        )

    # 5. Per-client rate limiting
    client_id = token
    now = time.time()
    window = 60.0
    limit = app.config.get("RATE_LIMIT", 60)

    timestamps = _rate_limits.setdefault(client_id, [])
    timestamps = [t for t in timestamps if now - t < window]
    _rate_limits[client_id] = timestamps

    g.rate_limit_limit = limit
    g.rate_limit_remaining = max(0, limit - len(timestamps))

    if len(timestamps) >= limit:
        oldest = timestamps[0]
        retry_after = max(1, int(window - (now - oldest)))
        g.rate_limit_remaining = 0

        return problem(
            429,
            "Too Many Requests",
            f"Rate limit of {limit} requests per minute exceeded. Try again in {retry_after}s.",
            slug="rate-limited",
            headers={
                "Retry-After": retry_after,
                "X-RateLimit-Limit": limit,
                "X-RateLimit-Remaining": 0,
            },
        )

    timestamps.append(now)
    g.rate_limit_remaining = max(0, limit - len(timestamps))


# ---------------------------------------------------------------------------
# After Request Hook: Security, CORS, Rate Limit, Content-Type, Compression
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

    # A6 (C4): label every body with a Content-Type + charset; no label for empty bodies
    if response.status_code in (204, 304):
        response.headers.pop("Content-Type", None)
    else:
        mimetype = response.mimetype or ""
        content_type = response.headers.get("Content-Type", "")
        if (
            mimetype
            and "charset" not in content_type.lower()
            and (mimetype.endswith("json") or mimetype.endswith("xml") or mimetype.startswith("text/"))
        ):
            response.headers["Content-Type"] = f"{mimetype}; charset=utf-8"

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


def _get_json_body():
    """Parses JSON body; raises ApiError(400) if missing or not parseable JSON."""
    body = request.get_json(silent=True)
    if body is None:
        raise ApiError(
            400,
            "Malformed body",
            "Request body must be valid JSON.",
            slug="malformed-json",
        )
    return body


def _check_availability(items: list) -> None:
    """`item-unavailable` (409): any requested item is out of stock."""
    missing = sorted({i["itemId"] for i in items if i["itemId"] in UNAVAILABLE_ITEMS})
    if missing:
        raise ApiError(
            409,
            "Item unavailable",
            f"These items are currently unavailable: {', '.join(missing)}.",
            slug="item-unavailable",
        )


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
    validate_order_create(body)  # A6: collects ALL errors -> one 422
    _check_availability(body["items"])  # A6: 409 item-unavailable

    idempotency_key = request.headers.get("Idempotency-Key")
    try:
        order = _guarded(
            store.create_order,
            customer_id=body["customerId"],
            items=body["items"],
            notes=body.get("notes", ""),
            idempotency_key=idempotency_key,
            payload=body,
        )
    except store.ConflictError as e:
        raise ApiError(409, "Idempotency conflict", str(e), slug="idempotency-conflict")

    etag = store.calculate_etag(order)
    response = respond(order.as_json(), 201, root="order")
    response.headers["Location"] = f"/orders/{order.order_id}"  # A3
    response.headers["ETag"] = etag
    return response


@app.route("/orders", methods=["GET"])
def list_orders():
    validate_order_list_params(request.args)

    customer_id = request.args.get("customerId")
    status = request.args.get("status")
    sort_by = request.args.get("sort", "createdAt")
    order_dir = request.args.get("order", "desc")
    page = int(request.args.get("page", 1))
    page_size = int(request.args.get("pageSize", 10))

    orders, total_count = _guarded(
        store.list_orders,
        customer_id=customer_id,
        status=status,
        sort_by=sort_by,
        order=order_dir,
        page=page,
        page_size=page_size,
    )

    resp = respond([o.as_json() for o in orders], 200, root="orders", item_tag="order")
    resp.headers["X-Total-Count"] = str(total_count)
    return resp


# ---------------------------------------------------------------------------
# GET /orders/{orderId} , PATCH /orders/{orderId} , OPTIONS /orders/{orderId}
# ---------------------------------------------------------------------------

@app.route("/orders/<order_id>", methods=["OPTIONS"])
def options_order_item(order_id):
    resp = make_response("", 204)
    resp.headers["Allow"] = "GET, PATCH, OPTIONS"
    return resp


def _order_or_404(order_id: str):
    try:
        return _guarded(store.get_order, order_id)
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e), slug="order-not-found")


# Optional demo for Q6: only exists when FAULT_DEMO=1 is set when starting the server.
if os.environ.get("FAULT_DEMO") == "1":
    @app.route("/orders/_fault", methods=["GET"])
    def fault_demo():
        def simulate_storage_failure():
            raise RuntimeError(
                "connection to db-host:5432 refused "
                "(user=orders_rw, password=s3cret)"
            )

        return _guarded(simulate_storage_failure)


@app.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    order = _order_or_404(order_id)
    etag = store.calculate_etag(order)

    # Conditional GET (C1): If-None-Match
    if_none_match = request.headers.get("If-None-Match")
    if if_none_match:
        clean_if_none_match = if_none_match.strip()
        if clean_if_none_match in (etag, etag.strip('"'), f"W/{etag}"):
            resp = make_response("", 304)
            resp.headers["ETag"] = etag
            resp.headers["Cache-Control"] = "private, no-cache"
            return resp

    resp = respond(order.as_json(), 200, root="order")
    resp.headers["ETag"] = etag
    resp.headers["Cache-Control"] = "private, no-cache"
    return resp


@app.route("/orders/<order_id>", methods=["PATCH"])
def update_order_status(order_id):
    order = _order_or_404(order_id)
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
                slug="precondition-failed",
            )

    body = _get_json_body()
    validate_status_update(body)  # A6: 422 with errors[]

    try:
        order = _guarded(store.update_status, order_id, body["status"])
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e), slug="order-not-found")
    except store.ConflictError as e:
        raise ApiError(409, "Invalid status transition", str(e), slug="illegal-transition")

    resp = respond(order.as_json(), 200, root="order")
    resp.headers["ETag"] = store.calculate_etag(order)
    return resp


# ---------------------------------------------------------------------------
# POST /orders/{orderId}/cancel & /cancellation (Non-CRUD sub-resources, A2)
# This service's equivalent of DELETE /orders/{id}: cancelling, not erasing.
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
    validate_cancellation(body)  # A6: 422 with errors[]

    idempotency_key = request.headers.get("Idempotency-Key")
    try:
        cancellation = _guarded(
            store.cancel_order,
            order_id=order_id,
            reason=body["reason"],
            idempotency_key=idempotency_key,
            payload=body,
        )
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e), slug="order-not-found")
    except store.ConflictError as e:
        # store.ConflictError covers both "already cancelled/delivered" and idempotency mismatch
        slug = "idempotency-conflict" if "Idempotency-Key" in str(e) else "illegal-transition"
        raise ApiError(409, "Cannot cancel order", str(e), slug=slug)

    return respond(cancellation.as_json(), 201, root="cancellation")


if __name__ == "__main__":
    app.run(debug=True, port=5050)