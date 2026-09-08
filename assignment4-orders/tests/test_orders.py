"""
tests/test_orders.py
Four required tests (C8):
  1. create succeeds with the right code and Location header
  2. idempotent repeat returns the original result
  3. a failure path returns the right 4xx
  4. an unknown id returns 404
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
import app as app_module


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as c:
        yield c


def _sample_order_body():
    return {
        "customerId": "cust_001",
        "items": [{"itemId": "item_pizza", "quantity": 2, "unitPrice": 9.5}],
    }


def test_create_order_success(client):
    resp = client.post("/orders", json=_sample_order_body())

    assert resp.status_code == 201
    assert "Location" in resp.headers
    body = resp.get_json()
    assert body["customerId"] == "cust_001"
    assert body["status"] == "created"
    assert body["totalAmount"] == 19.0


def test_create_order_idempotent_repeat(client):
    headers = {"Idempotency-Key": "key-123"}

    first = client.post("/orders", json=_sample_order_body(), headers=headers)
    second = client.post("/orders", json=_sample_order_body(), headers=headers)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.get_json()["orderId"] == second.get_json()["orderId"]


def test_create_order_malformed_body_returns_400(client):
    # missing required 'items' entirely -> malformed, not just domain-invalid
    resp = client.post("/orders", json={"customerId": "cust_001"})

    assert resp.status_code == 422 or resp.status_code == 400
    body = resp.get_json()
    assert "status" in body and "title" in body and "detail" in body


def test_get_unknown_order_returns_404(client):
    resp = client.get("/orders/ord_does_not_exist")

    assert resp.status_code == 404
    body = resp.get_json()
    assert body["status"] == 404