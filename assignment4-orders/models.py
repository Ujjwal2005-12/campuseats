"""
models.py
Internal record classes for the Orders service.

Each class holds everything the service needs to store. `as_json()` returns
only what should ever leave the service — internal bookkeeping fields such as
`idempotency_key` are deliberately left out.
"""

import uuid
from datetime import datetime, timezone

VALID_STATUSES = ["created", "confirmed", "preparing", "dispatched", "delivered", "cancelled"]

# Which status can move to which. Used to return 409 on illegal transitions.
ALLOWED_TRANSITIONS = {
    "created": {"confirmed", "cancelled"},
    "confirmed": {"preparing", "cancelled"},
    "preparing": {"dispatched", "cancelled"},
    "dispatched": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class OrderItem:
    def __init__(self, item_id: str, quantity: int, unit_price: float = 0.0):
        self.item_id = item_id
        self.quantity = quantity
        self.unit_price = unit_price

    def as_json(self):
        return {
            "itemId": self.item_id,
            "quantity": self.quantity,
            "unitPrice": self.unit_price,
        }

    @staticmethod
    def from_dict(d: dict) -> "OrderItem":
        return OrderItem(
            item_id=d["itemId"],
            quantity=d["quantity"],
            unit_price=d.get("unitPrice", 0.0),
        )


class Order:
    """
    The stored record. Includes internal fields (idempotency_key,
    payment_ref, cancellation_reason) that must never leak into as_json().
    """

    def __init__(self, customer_id: str, items: list, notes: str = ""):
        self.order_id = _new_id("ord")
        self.customer_id = customer_id
        self.items = items
        self.notes = notes
        self.status = "created"
        self.created_at = _now()

        # --- internal-only fields, never serialized ---
        self.idempotency_key = None
        self.payment_ref = None          # e.g. internal Payments transaction id
        self.cancellation_reason = None
        self.cancelled_at = None

    @property
    def total_amount(self) -> float:
        return round(sum(i.quantity * i.unit_price for i in self.items), 2)

    def as_json(self) -> dict:
        return {
            "orderId": self.order_id,
            "customerId": self.customer_id,
            "items": [i.as_json() for i in self.items],
            "status": self.status,
            "totalAmount": self.total_amount,
            "createdAt": self.created_at,
        }


class Cancellation:
    """Represents the sub-resource created by POST /orders/{id}/cancellation."""

    def __init__(self, order_id: str, reason: str):
        self.order_id = order_id
        self.reason = reason
        self.cancelled_at = _now()
        self.idempotency_key = None  # internal only

    def as_json(self) -> dict:
        return {
            "orderId": self.order_id,
            "status": "cancelled",
            "reason": self.reason,
            "cancelledAt": self.cancelled_at,
        }