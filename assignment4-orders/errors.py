"""
errors.py
One error shape for the whole service (RFC 7807 Problem Details), plus request validation.

Rejects malformed bodies and invalid parameters before handler code touches them.
"""

from models import VALID_STATUSES

ALLOWED_SORT_FIELDS = ["createdAt", "totalAmount", "orderId", "status", "customerId"]
ALLOWED_SORT_ORDERS = ["asc", "desc"]


class ApiError(Exception):
    """Raised by validate()/handlers; caught in app.py to build a RFC 7807 response."""

    def __init__(self, status: int, title: str, detail: str, error_type: str = None):
        super().__init__(detail)
        self.status = status
        self.title = title
        self.detail = detail
        self.type = error_type or f"https://campuseats.example.com/errors/{status}"


def problem(status: int, title: str, detail: str, error_type: str = None) -> dict:
    """The single RFC 7807 error body shape used by every endpoint."""
    return {
        "type": error_type or f"https://campuseats.example.com/errors/{status}",
        "title": title,
        "status": status,
        "detail": detail,
    }


# ---------------------------------------------------------------------------
# Validation functions
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


def validate_order_list_params(args: dict) -> None:
    """Validate query parameters for list/search endpoints."""
    status = args.get("status")
    if status and status not in VALID_STATUSES:
        raise ApiError(
            400,
            "Invalid query parameter",
            f"Status '{status}' is invalid. Allowed values: {VALID_STATUSES}",
        )

    sort_by = args.get("sort")
    if sort_by and sort_by not in ALLOWED_SORT_FIELDS:
        raise ApiError(
            400,
            "Invalid query parameter",
            f"Sort field '{sort_by}' is invalid. Allowed values: {ALLOWED_SORT_FIELDS}",
        )

    order = args.get("order")
    if order and order.lower() not in ALLOWED_SORT_ORDERS:
        raise ApiError(
            400,
            "Invalid query parameter",
            f"Sort order '{order}' is invalid. Allowed values: {ALLOWED_SORT_ORDERS}",
        )

    page_str = args.get("page")
    if page_str is not None:
        try:
            page = int(page_str)
            if page < 1:
                raise ValueError
        except ValueError:
            raise ApiError(400, "Invalid query parameter", "'page' must be a positive integer >= 1.")

    page_size_str = args.get("pageSize")
    if page_size_str is not None:
        try:
            page_size = int(page_size_str)
            if page_size < 1:
                raise ValueError
        except ValueError:
            raise ApiError(400, "Invalid query parameter", "'pageSize' must be a positive integer >= 1.")