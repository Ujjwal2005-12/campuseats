"""
errors.py
Single error shape for the Payments service, same pattern as Orders.
"""


class ApiError(Exception):
    def __init__(self, status: int, title: str, detail: str, error_type: str = None):
        super().__init__(detail)
        self.status = status
        self.title = title
        self.detail = detail
        self.type = error_type or f"https://campuseats.example.com/errors/{status}"


def problem(status: int, title: str, detail: str, error_type: str = None) -> dict:
    return {
        "type": error_type or f"https://campuseats.example.com/errors/{status}",
        "title": title,
        "status": status,
        "detail": detail,
    }


def validate_charge_request(body: dict) -> None:
    if not isinstance(body, dict):
        raise ApiError(400, "Malformed body", "Request body must be a JSON object.")

    order_id = body.get("orderId")
    if not order_id or not isinstance(order_id, str):
        raise ApiError(400, "Malformed body", "'orderId' is required and must be a string.")

    amount = body.get("amount")
    if not isinstance(amount, (int, float)) or amount <= 0:
        raise ApiError(422, "Invalid charge", "'amount' must be a positive number.")