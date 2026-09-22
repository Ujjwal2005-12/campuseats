"""
tests/test_orders.py
Comprehensive test suite for Assignment 5: HTTP Methods & Headers.
Validates all requirements: A1-A6, B1-B7, C1-C4.
"""

import sys
import os
import gzip
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app as app_module
import store

AUTH_HEADER = {"Authorization": "Bearer test-student-token-1"}


@pytest.fixture(autouse=True)
def clean_state():
    """Reset store and rate limits before each test for test isolation."""
    store.reset_store()
    app_module.reset_rate_limits()
    app_module.app.config["RATE_LIMIT"] = 60
    yield
    store.reset_store()
    app_module.reset_rate_limits()


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as c:
        yield c


def _sample_order_body(cust_id="cust_001"):
    return {
        "customerId": cust_id,
        "items": [{"itemId": "item_pizza", "quantity": 2, "unitPrice": 9.5}],
    }


# ===========================================================================
# A1 & B2 & C3: Create Order (POST /orders), Status, Location, Idempotency
# ===========================================================================

def test_create_order_success(client):
    resp = client.post("/orders", json=_sample_order_body(), headers=AUTH_HEADER)

    assert resp.status_code == 201
    assert "Location" in resp.headers
    assert resp.headers["Location"].startswith("/orders/ord_")
    assert "ETag" in resp.headers
    body = resp.get_json()
    assert body["customerId"] == "cust_001"
    assert body["status"] == "created"
    assert body["totalAmount"] == 19.0


def test_create_order_idempotent_repeat(client):
    headers = {**AUTH_HEADER, "Idempotency-Key": "key-123"}

    first = client.post("/orders", json=_sample_order_body(), headers=headers)
    second = client.post("/orders", json=_sample_order_body(), headers=headers)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.get_json()["orderId"] == second.get_json()["orderId"]
    assert first.headers["ETag"] == second.headers["ETag"]


def test_create_order_idempotent_conflict_with_different_body(client):
    headers = {**AUTH_HEADER, "Idempotency-Key": "key-conflict-1"}

    # First request
    first = client.post("/orders", json=_sample_order_body(), headers=headers)
    assert first.status_code == 201

    # Second request with SAME key but DIFFERENT body
    different_body = {
        "customerId": "cust_different",
        "items": [{"itemId": "item_burger", "quantity": 5, "unitPrice": 5.0}],
    }
    second = client.post("/orders", json=different_body, headers=headers)

    assert second.status_code == 409
    body = second.get_json()
    assert body["status"] == 409
    assert "Idempotency-Key" in body["detail"] or "previously used" in body["detail"]


# ===========================================================================
# B2: 400 Bad Request vs 422 Unprocessable Content
# ===========================================================================

def test_create_order_malformed_syntax_returns_400(client):
    # Non-JSON content or malformed missing customerId
    resp = client.post(
        "/orders",
        json={"items": [{"itemId": "item_pizza", "quantity": 2}]},
        headers=AUTH_HEADER,
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["status"] == 400
    assert "customerId" in body["detail"]


def test_create_order_invalid_domain_returns_422(client):
    # Syntactically valid JSON, but violates domain rules (quantity <= 0 or empty items)
    resp = client.post(
        "/orders",
        json={"customerId": "cust_001", "items": []},
        headers=AUTH_HEADER,
    )
    assert resp.status_code == 422
    body = resp.get_json()
    assert body["status"] == 422
    assert "non-empty array" in body["detail"]


def test_get_unknown_order_returns_404(client):
    resp = client.get("/orders/ord_does_not_exist", headers=AUTH_HEADER)
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["status"] == 404


# ===========================================================================
# A4: Query Parameters for Reads (Filtering, Sorting, Pagination)
# ===========================================================================

def test_list_orders_filtering_and_pagination(client):
    # Create 3 orders
    client.post("/orders", json=_sample_order_body("cust_001"), headers=AUTH_HEADER)
    client.post("/orders", json=_sample_order_body("cust_001"), headers=AUTH_HEADER)
    client.post("/orders", json=_sample_order_body("cust_002"), headers=AUTH_HEADER)

    # 1. Filter by customerId
    resp = client.get("/orders?customerId=cust_001", headers=AUTH_HEADER)
    assert resp.status_code == 200
    orders = resp.get_json()
    assert len(orders) == 2
    assert all(o["customerId"] == "cust_001" for o in orders)

    # 2. Filter by status
    resp = client.get("/orders?status=created", headers=AUTH_HEADER)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 3

    # 3. Pagination: page=1, pageSize=2
    resp = client.get("/orders?page=1&pageSize=2", headers=AUTH_HEADER)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 2
    assert resp.headers.get("X-Total-Count") == "3"

    # 4. Pagination: page=2, pageSize=2
    resp = client.get("/orders?page=2&pageSize=2", headers=AUTH_HEADER)
    assert resp.status_code == 200
    assert len(resp.get_json()) == 1


def test_list_orders_invalid_query_params_returns_400(client):
    # Invalid status
    resp = client.get("/orders?status=invalid_status", headers=AUTH_HEADER)
    assert resp.status_code == 400
    assert "status" in resp.get_json()["detail"].lower()

    # Invalid page number
    resp = client.get("/orders?page=0", headers=AUTH_HEADER)
    assert resp.status_code == 400

    # Invalid sort order
    resp = client.get("/orders?order=sideways", headers=AUTH_HEADER)
    assert resp.status_code == 400


# ===========================================================================
# B4 & C1: Caching, Deterministic ETag & Conditional GET (304 Not Modified)
# ===========================================================================

def test_get_order_caching_and_etag(client):
    create_resp = client.post("/orders", json=_sample_order_body(), headers=AUTH_HEADER)
    order_id = create_resp.get_json()["orderId"]

    # First GET
    resp = client.get(f"/orders/{order_id}", headers=AUTH_HEADER)
    assert resp.status_code == 200
    etag = resp.headers.get("ETag")
    assert etag is not None
    assert "Cache-Control" in resp.headers
    assert "private" in resp.headers["Cache-Control"]

    # Repeat GET with matching If-None-Match -> 304 Not Modified
    cond_resp = client.get(
        f"/orders/{order_id}",
        headers={**AUTH_HEADER, "If-None-Match": etag},
    )
    assert cond_resp.status_code == 304
    assert cond_resp.data == b""
    assert cond_resp.headers["ETag"] == etag
    assert "Cache-Control" in cond_resp.headers

    # GET with mismatched ETag -> 200 OK
    mismatch_resp = client.get(
        f"/orders/{order_id}",
        headers={**AUTH_HEADER, "If-None-Match": '"stale-etag-999"'},
    )
    assert mismatch_resp.status_code == 200
    assert mismatch_resp.get_json()["orderId"] == order_id


# ===========================================================================
# C2: Conditional Write (PATCH /orders/{id} with If-Match -> 412)
# ===========================================================================

def test_conditional_write_precondition_failed_412(client):
    create_resp = client.post("/orders", json=_sample_order_body(), headers=AUTH_HEADER)
    order_id = create_resp.get_json()["orderId"]
    current_etag = create_resp.headers["ETag"]

    # Attempt write with stale If-Match -> 412 Precondition Failed
    stale_headers = {**AUTH_HEADER, "If-Match": '"outdated-etag-111"'}
    patch_resp = client.patch(
        f"/orders/{order_id}",
        json={"status": "confirmed"},
        headers=stale_headers,
    )
    assert patch_resp.status_code == 412
    assert patch_resp.get_json()["status"] == 412

    # Verify resource was NOT modified
    verify_resp = client.get(f"/orders/{order_id}", headers=AUTH_HEADER)
    assert verify_resp.get_json()["status"] == "created"

    # Attempt write with correct matching If-Match -> 200 OK
    correct_headers = {**AUTH_HEADER, "If-Match": current_etag}
    patch_ok = client.patch(
        f"/orders/{order_id}",
        json={"status": "confirmed"},
        headers=correct_headers,
    )
    assert patch_ok.status_code == 200
    assert patch_ok.get_json()["status"] == "confirmed"
    new_etag = patch_ok.headers["ETag"]
    assert new_etag != current_etag


# ===========================================================================
# A2: Non-CRUD Sub-Resource: Cancel Order (POST /orders/{id}/cancel)
# ===========================================================================

def test_cancel_order_subresource(client):
    create_resp = client.post("/orders", json=_sample_order_body(), headers=AUTH_HEADER)
    order_id = create_resp.get_json()["orderId"]

    # Cancel via POST /orders/{id}/cancel
    cancel_resp = client.post(
        f"/orders/{order_id}/cancel",
        json={"reason": "Customer cancelled order"},
        headers=AUTH_HEADER,
    )
    assert cancel_resp.status_code == 201
    cancel_body = cancel_resp.get_json()
    assert cancel_body["status"] == "cancelled"
    assert cancel_body["reason"] == "Customer cancelled order"

    # Verify order status in store is now cancelled
    get_resp = client.get(f"/orders/{order_id}", headers=AUTH_HEADER)
    assert get_resp.get_json()["status"] == "cancelled"

    # Attempting to cancel an already cancelled order returns 409 Conflict
    conflict_resp = client.post(
        f"/orders/{order_id}/cancel",
        json={"reason": "Duplicate cancel attempt"},
        headers=AUTH_HEADER,
    )
    assert conflict_resp.status_code == 409


# ===========================================================================
# A5: OPTIONS, Allow Header & X-HTTP-Method-Override
# ===========================================================================

def test_options_and_allow_header(client):
    # OPTIONS /orders
    resp1 = client.options("/orders")
    assert resp1.status_code == 204
    assert resp1.headers.get("Allow") == "GET, POST, OPTIONS"

    # OPTIONS /orders/{id}
    resp2 = client.options("/orders/ord_123")
    assert resp2.status_code == 204
    assert resp2.headers.get("Allow") == "GET, PATCH, OPTIONS"

    # OPTIONS /orders/{id}/cancel
    resp3 = client.options("/orders/ord_123/cancel")
    assert resp3.status_code == 204
    assert resp3.headers.get("Allow") == "POST, OPTIONS"


def test_method_override_post_to_patch(client):
    create_resp = client.post("/orders", json=_sample_order_body(), headers=AUTH_HEADER)
    order_id = create_resp.get_json()["orderId"]

    # Send POST to /orders/{order_id} with X-HTTP-Method-Override: PATCH
    headers = {
        **AUTH_HEADER,
        "X-HTTP-Method-Override": "PATCH",
    }
    resp = client.post(
        f"/orders/{order_id}",
        json={"status": "confirmed"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.get_json()["status"] == "confirmed"


# ===========================================================================
# B1: Content-Type, Content Negotiation (Accept -> 406), Compression
# ===========================================================================

def test_accept_header_content_negotiation_406(client):
    # Client requests text/html which server does not provide
    headers = {**AUTH_HEADER, "Accept": "text/html"}
    resp = client.get("/orders", headers=headers)
    assert resp.status_code == 406
    assert resp.headers["Content-Type"].startswith("application/json")
    body = resp.get_json()
    assert body["status"] == 406
    assert "application/json" in body["detail"]


def test_gzip_compression_when_requested(client):
    # Create order with multiple items so body size is sufficiently large
    items = [
        {"itemId": f"item_pizza_{i}", "quantity": i, "unitPrice": 12.5}
        for i in range(1, 6)
    ]
    create_resp = client.post(
        "/orders",
        json={"customerId": "cust_001", "items": items},
        headers={**AUTH_HEADER, "Accept-Encoding": "gzip"},
    )
    assert create_resp.status_code == 201
    assert create_resp.headers.get("Content-Encoding") == "gzip"
    decompressed = gzip.decompress(create_resp.data).decode("utf-8")
    assert "cust_001" in decompressed


# ===========================================================================
# B3: Authorization Header (Bearer scheme, missing/empty -> 401)
# ===========================================================================

def test_missing_authorization_returns_401(client):
    resp = client.get("/orders")
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"
    assert resp.get_json()["status"] == 401


def test_empty_bearer_token_returns_401(client):
    resp = client.get("/orders", headers={"Authorization": "Bearer  "})
    assert resp.status_code == 401
    assert resp.headers.get("WWW-Authenticate") == "Bearer"


# ===========================================================================
# B5: Per-Client Rate Limiting & 429 Too Many Requests
# ===========================================================================

def test_rate_limiting_per_client_and_429(client):
    app_module.app.config["RATE_LIMIT"] = 3

    client_a_headers = {"Authorization": "Bearer client-A-token"}
    client_b_headers = {"Authorization": "Bearer client-B-token"}

    # Client A exhausts quota (3 requests)
    r1 = client.get("/orders", headers=client_a_headers)
    assert r1.status_code == 200
    assert r1.headers["X-RateLimit-Limit"] == "3"
    assert r1.headers["X-RateLimit-Remaining"] == "2"

    r2 = client.get("/orders", headers=client_a_headers)
    assert r2.status_code == 200
    assert r2.headers["X-RateLimit-Remaining"] == "1"

    r3 = client.get("/orders", headers=client_a_headers)
    assert r3.status_code == 200
    assert r3.headers["X-RateLimit-Remaining"] == "0"

    # Client A 4th request -> 429 Too Many Requests
    r4 = client.get("/orders", headers=client_a_headers)
    assert r4.status_code == 429
    assert "Retry-After" in r4.headers
    assert r4.headers["X-RateLimit-Remaining"] == "0"
    assert r4.get_json()["status"] == 429

    # Client B should NOT be affected (proves rate limiting is per-client)
    rb = client.get("/orders", headers=client_b_headers)
    assert rb.status_code == 200
    assert rb.headers["X-RateLimit-Remaining"] == "2"


# ===========================================================================
# B6 & B7: CORS Preflight & Security Headers
# ===========================================================================

def test_cors_preflight_and_security_headers(client):
    # OPTIONS preflight
    resp = client.options(
        "/orders",
        headers={"Origin": "https://campuseats.example.com"},
    )
    assert resp.status_code == 204
    assert resp.headers.get("Access-Control-Allow-Origin") == "https://campuseats.example.com"
    assert "POST" in resp.headers.get("Access-Control-Allow-Methods", "")
    assert "Authorization" in resp.headers.get("Access-Control-Allow-Headers", "")

    # Security headers on GET response
    get_resp = client.get("/orders", headers=AUTH_HEADER)
    assert get_resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert "Strict-Transport-Security" in get_resp.headers
    assert "max-age=31536000" in get_resp.headers["Strict-Transport-Security"]