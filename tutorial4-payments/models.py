"""
models.py
Internal record for the Payments service.
"""

import uuid
import random
from datetime import datetime, timezone


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Charge:
    """A single payment charge attempt against an order."""

    def __init__(self, order_id: str, amount: float):
        self.transaction_id = _new_id("txn")
        self.order_id = order_id
        self.amount = amount
        self.created_at = _now()

        # Simulated outcome — lets Orders service exercise its retry/fallback
        # logic without needing a real payment processor.
        self.status = "success" if random.random() > 0.15 else "failed"

        # --- internal-only fields, never serialized ---
        self.idempotency_key = None
        self.processor_ref = None  # pretend internal reference to a real gateway

    def as_json(self) -> dict:
        return {
            "transactionId": self.transaction_id,
            "orderId": self.order_id,
            "amount": self.amount,
            "status": self.status,
            "createdAt": self.created_at,
        }