"""
store.py
In-memory storage for the Orders service.

No other service or module should import this file directly — only app.py
talks to the store. This keeps Orders' data ownership self-contained, per
the Assignment 2 boundary.
"""

import hashlib
import json
from models import Order, OrderItem, Cancellation, ALLOWED_TRANSITIONS

# orders: order_id -> Order
_orders: dict = {}

# idempotency_key -> (order_id, payload_hash)   (for POST /orders)
_create_idempotency: dict = {}

# (order_id, idempotency_key) -> (Cancellation, payload_hash)   (for POST /orders/{id}/cancellation or /cancel)
_cancel_idempotency: dict = {}

# cancellations: order_id -> Cancellation
_cancellations: dict = {}


class ConflictError(Exception):
    """Raised for illegal state transitions, duplicate conflicts, or idempotency mismatch (-> 409)."""
    pass


class NotFoundError(Exception):
    """Raised when an order id does not exist (-> 404)."""
    pass


def reset_store() -> None:
    """Clear all in-memory store data (useful for test isolation)."""
    _orders.clear()
    _create_idempotency.clear()
    _cancel_idempotency.clear()
    _cancellations.clear()


def _hash_payload(payload: dict) -> str:
    """Compute a deterministic hash for an incoming JSON payload."""
    if payload is None:
        return ""
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# ETag calculation
# ---------------------------------------------------------------------------

def calculate_etag(order: Order) -> str:
    """
    Generate a deterministic strong ETag based on the canonical representation
    of the order. Whenever order state or fields change, this ETag changes.
    """
    serialized = json.dumps(order.as_json(), sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
    return f'"{digest}"'


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create_order(
    customer_id: str,
    items: list,
    notes: str = "",
    idempotency_key: str = None,
    payload: dict = None,
) -> Order:
    if idempotency_key:
        payload_hash = _hash_payload(payload) if payload is not None else ""
        if idempotency_key in _create_idempotency:
            existing_id, existing_hash = _create_idempotency[idempotency_key]
            if payload is not None and existing_hash and payload_hash != existing_hash:
                raise ConflictError(
                    f"Idempotency-Key '{idempotency_key}' was previously used with a different request payload."
                )
            return _orders[existing_id]

    order_items = [OrderItem.from_dict(i) for i in items]
    order = Order(customer_id=customer_id, items=order_items, notes=notes)
    order.idempotency_key = idempotency_key

    _orders[order.order_id] = order
    if idempotency_key:
        payload_hash = _hash_payload(payload) if payload is not None else ""
        _create_idempotency[idempotency_key] = (order.order_id, payload_hash)

    return order


# ---------------------------------------------------------------------------
# Read
# ---------------------------------------------------------------------------

def get_order(order_id: str) -> Order:
    order = _orders.get(order_id)
    if order is None:
        raise NotFoundError(f"No order with id '{order_id}'.")
    return order


def list_orders_by_customer(customer_id: str) -> list:
    return [o for o in _orders.values() if o.customer_id == customer_id]


def list_orders(
    customer_id: str = None,
    status: str = None,
    sort_by: str = "createdAt",
    order: str = "desc",
    page: int = 1,
    page_size: int = 10,
) -> tuple[list, int]:
    """
    Query orders with filtering, sorting, and pagination.
    Returns (paginated_orders, total_count).
    """
    results = list(_orders.values())

    if customer_id:
        results = [o for o in results if o.customer_id == customer_id]

    if status:
        results = [o for o in results if o.status == status]

    # Sorting
    sort_keys = {
        "createdAt": lambda o: o.created_at,
        "totalAmount": lambda o: o.total_amount,
        "orderId": lambda o: o.order_id,
        "status": lambda o: o.status,
        "customerId": lambda o: o.customer_id,
    }
    key_func = sort_keys.get(sort_by, lambda o: o.created_at)
    reverse = (order.lower() == "desc")
    results.sort(key=key_func, reverse=reverse)

    total_count = len(results)

    # Pagination
    start = (page - 1) * page_size
    end = start + page_size
    paginated = results[start:end]

    return paginated, total_count


# ---------------------------------------------------------------------------
# Update status
# ---------------------------------------------------------------------------

def update_status(order_id: str, new_status: str) -> Order:
    order = get_order(order_id)

    if new_status not in ALLOWED_TRANSITIONS.get(order.status, set()):
        raise ConflictError(
            f"Cannot move order '{order_id}' from '{order.status}' to '{new_status}'."
        )

    order.status = new_status
    return order


# ---------------------------------------------------------------------------
# Cancellation (sub-resource)
# ---------------------------------------------------------------------------

def cancel_order(
    order_id: str,
    reason: str,
    idempotency_key: str = None,
    payload: dict = None,
) -> Cancellation:
    order = get_order(order_id)  # raises NotFoundError if missing

    cache_key = (order_id, idempotency_key)
    payload_hash = _hash_payload(payload) if payload is not None else ""

    if idempotency_key and cache_key in _cancel_idempotency:
        cached_cancel, existing_hash = _cancel_idempotency[cache_key]
        if payload is not None and existing_hash and payload_hash != existing_hash:
            raise ConflictError(
                f"Idempotency-Key '{idempotency_key}' was previously used for order '{order_id}' with a different request payload."
            )
        return cached_cancel

    if order.status in ("cancelled", "delivered"):
        raise ConflictError(
            f"Order '{order_id}' is '{order.status}' and cannot be cancelled."
        )

    order.status = "cancelled"
    order.cancellation_reason = reason

    cancellation = Cancellation(order_id=order_id, reason=reason)
    cancellation.idempotency_key = idempotency_key
    order.cancelled_at = cancellation.cancelled_at

    _cancellations[order_id] = cancellation
    if idempotency_key:
        _cancel_idempotency[cache_key] = (cancellation, payload_hash)

    return cancellation