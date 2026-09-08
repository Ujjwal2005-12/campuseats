"""
store.py
In-memory storage for the Orders service.

No other service or module should import this file directly — only app.py
talks to the store. This keeps Orders' data ownership self-contained, per
the Assignment 2 boundary.
"""

from models import Order, OrderItem, Cancellation, ALLOWED_TRANSITIONS

# orders: order_id -> Order
_orders: dict = {}

# idempotency_key -> order_id   (for POST /orders)
_create_idempotency: dict = {}

# (order_id, idempotency_key) -> Cancellation   (for POST /orders/{id}/cancellation)
_cancel_idempotency: dict = {}

# cancellations: order_id -> Cancellation
_cancellations: dict = {}


class ConflictError(Exception):
    """Raised for illegal state transitions / already-cancelled orders (-> 409)."""
    pass


class NotFoundError(Exception):
    """Raised when an order id does not exist (-> 404)."""
    pass


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

def create_order(customer_id: str, items: list, notes: str = "", idempotency_key: str = None) -> Order:
    if idempotency_key and idempotency_key in _create_idempotency:
        existing_id = _create_idempotency[idempotency_key]
        return _orders[existing_id]

    order_items = [OrderItem.from_dict(i) for i in items]
    order = Order(customer_id=customer_id, items=order_items, notes=notes)
    order.idempotency_key = idempotency_key

    _orders[order.order_id] = order
    if idempotency_key:
        _create_idempotency[idempotency_key] = order.order_id

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

def cancel_order(order_id: str, reason: str, idempotency_key: str = None) -> Cancellation:
    order = get_order(order_id)  # raises NotFoundError if missing

    cache_key = (order_id, idempotency_key)
    if idempotency_key and cache_key in _cancel_idempotency:
        return _cancel_idempotency[cache_key]

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
        _cancel_idempotency[cache_key] = cancellation

    return cancellation