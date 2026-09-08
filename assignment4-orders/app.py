"""
app.py
Flask routes for the Orders service. Every route here must match
openapi.yaml exactly (C3).
"""

from flask import Flask, request, jsonify

import store
from errors import (
    ApiError,
    problem,
    validate_order_create,
    validate_status_update,
    validate_cancellation,
)

app = Flask(__name__)


@app.errorhandler(ApiError)
def handle_api_error(err: ApiError):
    return jsonify(problem(err.status, err.title, err.detail, err.type)), err.status


@app.errorhandler(404)
def handle_404(_e):
    body = problem(404, "Not found", "The requested resource does not exist.")
    return jsonify(body), 404


def _get_json_body() -> dict:
    """Every write endpoint calls this before touching the body (C4)."""
    body = request.get_json(silent=True)
    if body is None:
        raise ApiError(400, "Malformed body", "Request body must be valid JSON.")
    return body


# ---------------------------------------------------------------------------
# POST /orders , GET /orders?customerId=...
# ---------------------------------------------------------------------------

@app.route("/orders", methods=["POST"])
def create_order():
    body = _get_json_body()
    validate_order_create(body)  # raises ApiError(400/422) on bad input

    idempotency_key = request.headers.get("Idempotency-Key")
    order = store.create_order(
        customer_id=body["customerId"],
        items=body["items"],
        notes=body.get("notes", ""),
        idempotency_key=idempotency_key,
    )

    response = jsonify(order.as_json())
    response.status_code = 201
    response.headers["Location"] = f"/orders/{order.order_id}"
    return response


@app.route("/orders", methods=["GET"])
def list_orders():
    customer_id = request.args.get("customerId")
    if not customer_id:
        raise ApiError(400, "Malformed request", "'customerId' query parameter is required.")

    orders = store.list_orders_by_customer(customer_id)
    return jsonify([o.as_json() for o in orders]), 200


# ---------------------------------------------------------------------------
# GET /orders/{orderId} , PATCH /orders/{orderId}
# ---------------------------------------------------------------------------

@app.route("/orders/<order_id>", methods=["GET"])
def get_order(order_id):
    try:
        order = store.get_order(order_id)
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))
    return jsonify(order.as_json()), 200


@app.route("/orders/<order_id>", methods=["PATCH"])
def update_order_status(order_id):
    body = _get_json_body()
    validate_status_update(body)  # raises ApiError(400/422) on bad input

    try:
        order = store.update_status(order_id, body["status"])
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))
    except store.ConflictError as e:
        raise ApiError(409, "Invalid status transition", str(e))

    return jsonify(order.as_json()), 200


# ---------------------------------------------------------------------------
# POST /orders/{orderId}/cancellation
# ---------------------------------------------------------------------------

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
        )
    except store.NotFoundError as e:
        raise ApiError(404, "Order not found", str(e))
    except store.ConflictError as e:
        raise ApiError(409, "Cannot cancel order", str(e))

    return jsonify(cancellation.as_json()), 201


if __name__ == "__main__":
    app.run(debug=True, port=5050)