"""
store.py
In-memory storage for the Payments service. Only app.py should import this.
"""

from models import Charge

# transaction_id -> Charge
_charges: dict = {}

# idempotency_key -> transaction_id
_idempotency: dict = {}


def charge(order_id: str, amount: float, idempotency_key: str = None) -> Charge:
    if idempotency_key and idempotency_key in _idempotency:
        existing_id = _idempotency[idempotency_key]
        return _charges[existing_id]

    c = Charge(order_id=order_id, amount=amount)
    c.idempotency_key = idempotency_key

    _charges[c.transaction_id] = c
    if idempotency_key:
        _idempotency[idempotency_key] = c.transaction_id

    return c