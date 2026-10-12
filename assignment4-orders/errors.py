"""
errors.py
One error shape for the whole service (RFC 9457 Problem Details, the successor
of RFC 7807), plus request validation.

A6 changes:
  * problem() now returns a real Flask response with
    Content-Type: application/problem+json; charset=utf-8   (B1, C4)
  * stable `type` catalogue (PROBLEM_TYPES)                    (B2)
  * every validate_*() collects ALL bad fields and raises ONE 422 whose body
    carries an errors[] list                                    (B3, C1, C2)
"""

import json

from flask import has_request_context, make_response, request

from models import VALID_STATUSES

ALLOWED_SORT_FIELDS = ["createdAt", "totalAmount", "orderId", "status", "customerId"]
ALLOWED_SORT_ORDERS = ["asc", "desc"]

# ---------------------------------------------------------------------------
# B2: type catalogue. These slugs are STABLE: never rename them once published.
# type URL = PROBLEM_BASE + slug
# ---------------------------------------------------------------------------

PROBLEM_BASE = "https://campuseats.example.com/problems/"
PROBLEM_CONTENT_TYPE = "application/problem+json; charset=utf-8"

PROBLEM_TYPES = {
    # slug:                  (status, what triggers it)
    "empty-cart":            (422, "POST /orders with items missing/empty and no other bad field"),
    "validation-error":      (422, "Any body or query parameter that fails validation (errors[] lists each field)"),
    "item-unavailable":      (409, "POST /orders contains an itemId that is currently unavailable"),
    "payment-declined":      (402, "RESERVED: a payment provider declined the charge (Orders does not charge yet)"),
    "order-not-found":       (404, "GET/PATCH/cancel on an orderId that does not exist"),
    "illegal-transition":    (409, "PATCH to a status not allowed from the current one, or cancelling a cancelled/delivered order"),
    "idempotency-conflict":  (409, "Idempotency-Key reused with a different payload"),
    "precondition-failed":   (412, "If-Match ETag does not match the current order"),
    "malformed-json":        (400, "Body is missing or is not parseable JSON"),
    "unauthorized":          (401, "Missing or invalid Bearer token"),
    "unsupported-media-type": (415, "Write request whose Content-Type is not application/json"),
    "not-acceptable":        (406, "Accept header lists nothing we can produce (JSON or XML)"),
    "not-found":             (404, "Route does not exist"),
    "method-not-allowed":    (405, "Route exists but not for this HTTP method"),
    "rate-limited":          (429, "Per-client rate limit exceeded (Retry-After is sent)"),
    "service-unavailable":   (503, "Storage layer failed; transient (Retry-After is sent)"),
    "internal-error":        (500, "Any unexpected server bug; details are logged, never sent"),
}

# Fallback slug when raise ApiError(status, ...) is called without one.
DEFAULT_SLUG_BY_STATUS = {
    400: "malformed-json",
    401: "unauthorized",
    404: "not-found",
    405: "method-not-allowed",
    406: "not-acceptable",
    409: "illegal-transition",
    412: "precondition-failed",
    415: "unsupported-media-type",
    422: "validation-error",
    429: "rate-limited",
    500: "internal-error",
    503: "service-unavailable",
}


class ApiError(Exception):
    """Raised anywhere; caught in app.py and turned into a Problem Details response."""

    def __init__(
        self,
        status: int,
        title: str,
        detail: str,
        slug: str = None,
        errors: list = None,
        headers: dict = None,
    ):
        super().__init__(detail)
        self.status = status
        self.title = title
        self.detail = detail
        self.slug = slug or DEFAULT_SLUG_BY_STATUS.get(status, "error")
        self.type = PROBLEM_BASE + self.slug
        self.errors = errors
        self.headers = headers or {}


def problem(
    status: int,
    title: str,
    detail: str,
    slug: str = None,
    errors: list = None,
    headers: dict = None,
):
    """
    The single RFC 9457 error response used by every failure in the service.
    Returns a Flask Response (status + body + problem+json Content-Type).
    """
    slug = slug or DEFAULT_SLUG_BY_STATUS.get(status, "error")
    body = {
        "type": PROBLEM_BASE + slug,
        "title": title,
        "status": status,
        "detail": detail,
    }
    if has_request_context():
        body["instance"] = request.path
    if errors:
        body["errors"] = errors

    resp = make_response(json.dumps(body, ensure_ascii=False), status)
    resp.headers["Content-Type"] = PROBLEM_CONTENT_TYPE
    for name, value in (headers or {}).items():
        resp.headers[name] = str(value)
    return resp


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def _err(field: str, message: str) -> dict:
    return {"field": field, "message": message}


def _raise_validation(errors: list, empty_cart: bool = False) -> None:
    """Raise ONE 422 for the whole list of errors (nothing to do if the list is empty)."""
    if not errors:
        return
    if empty_cart and len(errors) == 1:
        raise ApiError(
            422,
            "Cart is empty",
           "items must be a non-empty array; an order must contain at least one item.",
            slug="empty-cart",
            errors=errors,
        )
    n = len(errors)
    raise ApiError(
        422,
        "Validation failed",
        f"{n} field{'s' if n != 1 else ''} failed validation.",
        slug="validation-error",
        errors=errors,
    )


def _is_positive_int(value) -> bool:
    # bool is a subclass of int in Python; True must not count as quantity 1
    return isinstance(value, int) and not isinstance(value, bool) and value >= 1


# ---------------------------------------------------------------------------
# Validation functions (each collects all errors, then raises once)
# ---------------------------------------------------------------------------

def validate_order_create(body: dict) -> None:
    if not isinstance(body, dict):
        _raise_validation([_err("body", "must be a JSON object")])

    errors = []
    empty_cart = False

    customer_id = body.get("customerId")
    if not customer_id or not isinstance(customer_id, str):
        errors.append(_err("customerId", "is required and must be a non-empty string"))

    items = body.get("items")
    if items is None:
        errors.append(_err("items", "is required and must be a non-empty array"))
    elif not isinstance(items, list):
        errors.append(_err("items", "must be an array"))
    elif len(items) == 0:
        empty_cart = True
        errors.append(_err("items", "must contain at least one item"))
    else:
        for i, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append(_err(f"items[{i}]", "must be an object"))
                continue
            item_id = item.get("itemId")
            if not item_id or not isinstance(item_id, str):
                errors.append(_err(f"items[{i}].itemId", "is required and must be a string"))
            if not _is_positive_int(item.get("quantity")):
                errors.append(_err(f"items[{i}].quantity", "must be an integer >= 1"))

    _raise_validation(errors, empty_cart=empty_cart)


def validate_status_update(body: dict) -> None:
    if not isinstance(body, dict):
        _raise_validation([_err("body", "must be a JSON object")])

    errors = []
    status = body.get("status")
    if not status or not isinstance(status, str):
        errors.append(_err("status", "is required and must be a string"))
    elif status not in VALID_STATUSES:
        errors.append(_err("status", f"'{status}' is not a recognised status; allowed: {sorted(VALID_STATUSES)}"))

    _raise_validation(errors)


def validate_cancellation(body: dict) -> None:
    if not isinstance(body, dict):
        _raise_validation([_err("body", "must be a JSON object")])

    errors = []
    reason = body.get("reason")
    if not reason or not isinstance(reason, str) or not reason.strip():
        errors.append(_err("reason", "is required and must be a non-empty string"))

    _raise_validation(errors)


def validate_order_list_params(args: dict) -> None:
    """Validate query parameters for list/search endpoints."""
    errors = []

    status = args.get("status")
    if status and status not in VALID_STATUSES:
        errors.append(
            _err("status", f"'{status}' is invalid; allowed: {sorted(VALID_STATUSES)}")
        )

    sort_by = args.get("sort")
    if sort_by and sort_by not in ALLOWED_SORT_FIELDS:
        errors.append(
            _err("sort", f"'{sort_by}' is invalid; allowed: {ALLOWED_SORT_FIELDS}")
        )

    order = args.get("order")
    if order and order.lower() not in ALLOWED_SORT_ORDERS:
        errors.append(
            _err("order", f"'{order}' is invalid; allowed: {ALLOWED_SORT_ORDERS}")
        )

    for name in ("page", "pageSize"):
        raw = args.get(name)
        if raw is None:
            continue

        try:
            ok = int(raw) >= 1
        except (TypeError, ValueError):
            ok = False

        if not ok:
            errors.append(_err(name, "must be an integer >= 1"))

    if errors:
        raise ApiError(
            400,
            "Invalid query parameters",
            "Invalid query parameters: "
            + "; ".join(
                f"{error['field']}: {error['message']}"
                for error in errors
            ),
            slug="invalid-query-parameters",
            errors=errors,
        )