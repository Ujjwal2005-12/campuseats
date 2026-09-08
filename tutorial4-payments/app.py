"""
app.py
Minimal Payments service (Tutorial 4). Exposes one endpoint the Orders
service calls in Assignment 4 Part D.

Randomly fails ~15% of charges and always fails instantly if 'amount' is
absurdly large (>= 100000) — useful for testing Orders' retry/backoff and
fallback behaviour on purpose.
"""

from flask import Flask, request, jsonify

import store
from errors import ApiError, problem, validate_charge_request

app = Flask(__name__)


@app.errorhandler(ApiError)
def handle_api_error(err: ApiError):
    return jsonify(problem(err.status, err.title, err.detail, err.type)), err.status


@app.route("/payments/charge", methods=["POST"])
def create_charge():
    body = request.get_json(silent=True)
    if body is None:
        raise ApiError(400, "Malformed body", "Request body must be valid JSON.")

    validate_charge_request(body)

    # Deliberate trigger for testing Orders' fallback: absurd amounts always fail.
    if body["amount"] >= 100000:
        raise ApiError(422, "Charge rejected", "Amount exceeds processing limit.")

    idempotency_key = request.headers.get("Idempotency-Key")
    result = store.charge(
        order_id=body["orderId"],
        amount=body["amount"],
        idempotency_key=idempotency_key,
    )

    if result.status == "failed":
        # Simulated processor failure -> 502, safe for Orders to retry.
        return jsonify(problem(502, "Charge failed", "Payment processor declined the charge.")), 502

    return jsonify(result.as_json()), 201


if __name__ == "__main__":
     app.run(debug=True, port=5001)