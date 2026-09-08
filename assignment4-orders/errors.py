"""
errors.py
One error shape for the whole service (C6), plus request validation (C4).

This is the hand-written equivalent of what the Assignment 3 XML Schema did
automatically: reject a malformed body before any handler code touches it.
"""

from models import VALID_STATUSES


class ApiError(Exception):
    """Raised by validate()/handlers; caught once in app.py to build a response."""

    def __init__(self, status: int, title: str, detail: str, error_type: str = None):
        super().__init__(detail)
        self.status = status
        self.title = title
        self.detail = detail
        self.type = error_type or f"https://campuseats.example.com/errors/{status}"


def problem(status: int, title: str, detail: str, error_type: str = None) -> dict:
    """The single error body shape used by every endpoint."""
    return {
        "type": error_type or f"https://campuseats.example.com/errors/{status}",
        "title": title,
        "status": status,
        "detail": detail,
    }


# ---------------------------------------------------------------------------
# Validation functions — one per request body shape in openapi.yaml
# ---------------------------------------------------------------------------

def validate_order_create(body: dict) -> None:
    if not isinstance(body, dict):
        raise ApiError(400, "Malformed body", "Request body must be a JSON object.")

    customer_id = body.get("customerId")
    if not customer_id or not isinstance(customer_id, str):
        raise ApiError(400, "Malformed body", "'customerId' is required and must be a string.")

    items = body.get("items")
    if not isinstance(items, list) or len(items) == 0:
        raise ApiError(422, "Invalid order", "'items' must be a non-empty array.")

    for i, item in enumerate(items):
        if not isinstance(item, dict):
            raise ApiError(400, "Malformed body", f"items[{i}] must be an object.")
        if not item.get("itemId") or not isinstance(item.get("itemId"), str):
            raise ApiError(400, "Malformed body", f"items[{i}].itemId is required.")
        qty = item.get("quantity")
        if not isinstance(qty, int) or qty < 1:
            raise ApiError(422, "Invalid order", f"items[{i}].quantity must be a positive integer.")


def validate_status_update(body: dict) -> None:
    if not isinstance(body, dict):
        raise ApiError(400, "Malformed body", "Request body must be a JSON object.")

    status = body.get("status")
    if not status or not isinstance(status, str):
        raise ApiError(400, "Malformed body", "'status' is required and must be a string.")

    if status not in VALID_STATUSES:
        raise ApiError(422, "Invalid status", f"'{status}' is not a recognised order status.")


def validate_cancellation(body: dict) -> None:
    if not isinstance(body, dict):
        raise ApiError(400, "Malformed body", "Request body must be a JSON object.")

    reason = body.get("reason")
    if not reason or not isinstance(reason, str):
        raise ApiError(422, "Invalid cancellation", "'reason' is required and must be a non-empty string.")