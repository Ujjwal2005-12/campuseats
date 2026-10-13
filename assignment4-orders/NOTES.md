# Assignment 4 — Orders Service

**Team**

| Name           | Roll No     |
| -------------- | ----------- |
| Krity Kumari   | 20252651030 |
| Ujjwal Sharma  | 20252651060 |
| Vinit Gaikwad  | 20252651019 |
| Shubhag Baluni | 20252651053 |

---

## Part A — Modelling

### A2. Operations (SOAP-style starting point)

- `createOrder(customerId, items, ...)`
- `getOrder(orderId)`
- `listOrdersByCustomer(customerId)`
- `cancelOrder(orderId, reason)`
- `updateOrderStatus(orderId, newStatus)`

### A4. Resource table

| Method | URL                              | Description                                             | Success Code | Failure Codes |
| ------ | -------------------------------- | ------------------------------------------------------- | -----------: | ------------: |
| POST   | `/orders`                        | Create a new order for a customer                       |          201 |      400, 422 |
| GET    | `/orders/{orderId}`              | Retrieve a single order by id                           |          200 |           404 |
| GET    | `/orders?customerId=...`         | List orders filtered by customer id                     |          200 |           400 |
| POST   | `/orders/{orderId}/cancellation` | Create a cancellation record without deleting the order |          201 | 404, 409, 422 |
| PATCH  | `/orders/{orderId}`              | Update order status                                     |          200 | 404, 409, 422 |

### A5. Justification — the hard case

`cancelOrder` maps least comfortably onto a plain resource. A first instinct was `DELETE /orders/{orderId}`, but a cancelled order still needs to exist for refunds, audits, and customer support, so deleting the resource was rejected. Instead, cancellation is modelled as its own sub-resource: `POST /orders/{orderId}/cancellation` creates a durable cancellation record without destroying the order itself. This also gives a natural place to record why an order was cancelled and to reject the action with `409` if the order is already shipped or delivered.

---

## Part D — Resilience

### D3. Fallback reasoning

When `createOrder` calls the Payments service and Payments is unreachable after all retries (`PaymentsUnavailableError`), the order should remain in `created` status rather than optimistically being marked `confirmed`. Silently treating an unconfirmed charge as successful could let food be prepared and delivered for an order nobody has actually paid for. The same applies if Payments explicitly rejects the charge (`PaymentsRejectedError`, a 4xx): that response should not be retried as if it were a transient network failure.

---

## Assignment 4 — Answers

### 1. WSDL vs OpenAPI line count

- Assignment 3 WSDL (`partner.wsdl`): **97 lines**
- `openapi.yaml`: **303 lines** (the count recorded for the earlier assignment version)

The difference is not simply extra content; it reflects what each contract spells out. OpenAPI documents HTTP operations, parameters, response codes, and schemas. The WSDL used a `types`/`message` layer and a SOAP binding/service structure for its operations.

Two things the WSDL declared that OpenAPI does not need in the same form:

1. The `<soap:binding style="document" transport="...soap/http"/>` block, which explicitly describes SOAP binding and transport.
2. The nested `<service>` / `<port>` / `<soap:address location="..."/>` structure. OpenAPI describes server URLs with a `servers:` list.

### 2. `soap:Fault` vs Problem Details

The earlier SOAP fault used `faultcode`, `faultstring`, and a `detail` element. In the REST service, failures are represented using an appropriate HTTP status and a structured Problem Details JSON body. For example, an invalid order-state transition returns `409 Conflict` with a stable `illegal-transition` type, title, status, and detail.

Returning a fault inside `200 OK` is problematic because intermediaries such as proxies, caches, load balancers, and monitoring tools can interpret the status line as success without understanding an application-specific error body.

### 3. UDDI's publish / find / bind

- **Publish:** an API contract can be committed to a shared repository or published in an internal API catalogue.
- **Find:** developers usually discover the service through documentation, configuration, or an API catalogue rather than querying a UDDI registry for every request.
- **Bind:** an HTTP client sends requests according to the OpenAPI contract; there is no separate SOAP-style binding phase required at runtime.

### 4. Who validates now

The explicit validators in `errors.py`—`validate_order_create`, `validate_status_update`, and `validate_cancellation`—carry out validation that an XML Schema might have enforced in a SOAP workflow. For example, the order validator must reject quantities that are not integers greater than or equal to one, rather than allowing invalid data into storage.

### 5. Where SOAP would still win

SOAP's WS-\* ecosystem includes specifications for reliable messaging and distributed transactions. Such mechanisms can be relevant when a system requires formal protocol-level coordination. A REST implementation commonly uses application-level idempotency keys and explicit retry/error handling instead; these are useful but depend on participating services implementing the same guarantees correctly.

---

# Assignment 6 — Honest Responses: Status Codes, Errors & Validation

This section extends the existing Assignment 4 notes. It records the Assignment 6 requirements and the behavior evidenced by the current implementation and `transcript.txt`. Claims that have not been verified are identified explicitly.

## Part A — Status codes

### A1. Map every outcome

The intended HTTP outcomes for the Orders Service are:

| Operation                             | Success response                                                 | Representative failure responses                                                                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /orders`                        | `201 Created` with `Location: /orders/{id}`                      | `400 Bad Request` for malformed input; `401 Unauthorized`; `406 Not Acceptable`; `409 Conflict` for idempotency conflict if applicable; `422 Unprocessable Entity`; `429 Too Many Requests`; `503 Service Unavailable` for transient service/storage failure                          |
| `GET /orders/{orderId}`               | `200 OK`                                                         | `401 Unauthorized`; `404 Not Found`; `406 Not Acceptable`; `429 Too Many Requests`; `503 Service Unavailable` for transient storage failure                                                                                                                                           |
| `GET /orders` and filters             | `200 OK`                                                         | `400 Bad Request` for invalid query parameters; `401 Unauthorized`; `406 Not Acceptable`; `429 Too Many Requests`; `503 Service Unavailable` for transient storage failure                                                                                                            |
| `PATCH /orders/{orderId}`             | `200 OK`                                                         | `400 Bad Request` for malformed input; `401 Unauthorized`; `404 Not Found`; `409 Conflict` for an illegal transition; `412 Precondition Failed` for a failed `If-Match`; `422 Unprocessable Entity`; `429 Too Many Requests`; `503 Service Unavailable` for transient storage failure |
| `POST /orders/{orderId}/cancellation` | `201 Created` when a cancellation resource is created            | `401 Unauthorized`; `404 Not Found`; `409 Conflict`; `422 Unprocessable Entity`; `429 Too Many Requests`; `503 Service Unavailable` for transient storage failure                                                                                                                     |
| `DELETE /orders/{orderId}`            | **Not established by the current resource table/route evidence** | Do not claim this endpoint is implemented without confirming the route and its behavior                                                                                                                                                                                               |

### A2. Correct failures that return 200

A failure must be represented by the HTTP status line, not by returning `200 OK` with a body such as `{"ok": false}`. The observed examples demonstrate this principle: empty-cart and quantity validation return `422`, an unknown order returns `404`, an illegal status transition returns `409`, rate limiting returns `429`, and the simulated storage failure returns `503`.

The existing test suite passes 19 tests, including tests for unknown resources, validation, conditional requests, content negotiation, authorization, and rate limiting. This test result alone does not prove that every possible failure path has been audited; the remaining routes should be checked for consistent status mapping.

### A3. Set `Location` on create

The successful `POST /orders` transcript returns `201 Created` and a `Location` header pointing to the created order, for example `/orders/ord_7df2bca9bd2d`. The response also includes the created order JSON.

### A4. Retry safety

- `GET` requests are generally safe to retry because they do not intentionally change state.
- `POST /orders` should only be retried safely when the client uses an `Idempotency-Key` and repeats the same request payload; the service should return the original result rather than create a duplicate.
- A repeated request with the same key but a different payload should be treated as an idempotency conflict, not silently accepted as the same operation.
- `PATCH` is safe to retry only when the operation is idempotent or guarded by a condition such as `If-Match`; a stale precondition can produce `412`.
- Cancellation is a `POST` sub-resource operation. Its retry behavior should be documented and tested according to the implementation's idempotency support.
- `429` and transient `503` responses include `Retry-After`; clients should wait for the indicated interval before retrying.
- Do not retry an unchanged `4xx` request blindly. Correct invalid input or resolve the conflict first.
- For payments, a transient timeout/outage may be retried only with a suitable idempotency strategy. An explicit payment rejection must not be treated as a transient failure.

## Part B — One error shape

### B1. Standardise on Problem Details

Failures are returned as structured Problem Details responses with fields such as `type`, `title`, `status`, `detail`, and `instance`. Validation responses also include an `errors` array with field-level messages. The observed error responses use `Content-Type: application/problem+json; charset=utf-8`.

Examples evidenced by `transcript.txt`:

- Empty cart: `422 Unprocessable Entity`, type ending in `/problems/empty-cart`.
- Invalid quantity: `422 Unprocessable Entity`, type ending in `/problems/validation-error`.
- Unknown order: `404 Not Found`, type ending in `/problems/order-not-found`.
- Illegal transition: `409 Conflict`, type ending in `/problems/illegal-transition`.
- Rate limit: `429 Too Many Requests`, type ending in `/problems/rate-limited`.
- Simulated storage failure: `503 Service Unavailable`, type ending in `/problems/service-unavailable`.

### B2. Stable type catalogue

The Assignment 6 brief asks for stable type identifiers for:

| Error type           | Intended meaning                                               | Evidence/status                                                           |
| -------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `empty-cart`         | The request contains no items                                  | Observed in transcript                                                    |
| `item-unavailable`   | A requested item cannot be supplied                            | **Must be confirmed in implementation/tests before claiming implemented** |
| `payment-declined`   | The payment service explicitly rejected the payment            | **Must be confirmed in implementation/tests before claiming implemented** |
| `order-not-found`    | The requested order ID does not exist                          | Observed in transcript                                                    |
| `illegal-transition` | Requested status change is not allowed from the current status | Observed in transcript                                                    |

The service also uses types for general validation errors, rate limiting, and service unavailability. Keep these identifiers stable so clients can distinguish errors without parsing human-readable details.

### B3. Field-level validation errors

Validation failures use `422` and an `errors` array that names each invalid field and explains why it is invalid. The transcript shows:

- `items` must contain at least one item.
- `items[0].quantity` must be an integer greater than or equal to one.

The Assignment 6 requirement is to collect all detected validation errors before responding, so a single invalid request can report multiple bad fields together rather than returning only the first one. Verify this with a request containing multiple independent validation errors.

### B4. Do not leak internals

Risky storage work is wrapped by `_guarded()`. Known business/API errors are allowed through for route-level mapping. Unexpected exceptions are logged server-side and converted to a generic `503 Service Unavailable` response with `Retry-After: 5`.

The actual fault-demo transcript confirms that the client receives a clean Problem Details body rather than the simulated exception message containing database-host and credential-like details. Internal stack traces and secrets must remain in server logs, not client responses.

## Part C — Request validation and formats

### C1. Describe the POST body

The order creation request must include a non-empty `items` array, each item's quantity must be an integer greater than or equal to one, and `address` is required. Validation should reject malformed or incomplete bodies before creating an order or invoking dependent services.

### C2. Validate, then act

The service should run all applicable validation checks before performing the order-creation work and collect all field errors into one `422` response. The transcript verifies the empty-cart and zero-quantity cases individually. **A multi-error request still needs to be tested to establish that all detected errors are returned together.**

### C3. Content negotiation

The service returns JSON by default and can return XML when the client sends `Accept: application/xml`. The transcript captures a `200 OK` XML response with `Content-Type: application/xml; charset=utf-8`. The automated test suite also includes a test for `406 Not Acceptable` when the requested representation cannot be produced.

### C4. Label every body

Observed success and error responses include explicit content types and UTF-8 charset labels, including JSON, XML, and Problem Details responses. Confirm all response paths, including body-bearing errors and framework-generated errors, set the required content type consistently.

## Part D — Prove it with curl

The actual request/response evidence is in `transcript.txt`.

- **D1 — Success:** `POST /orders` returns `201 Created`, a `Location` header, and the created order JSON.
- **D2 — Failures:** transcript includes empty cart (`422`), quantity zero (`422`), unknown order (`404`), illegal status transition (`409`), and rate limit (`429` with `Retry-After`).
- **D3 — Negotiation:** `GET /orders` with `Accept: application/xml` returns XML with the XML content type.
- **D4.1 — Idempotency repeat:** the repeated request returns the same order ID and `Location`, consistent with the idempotency requirement. Keep the actual repeat command alongside the response in the transcript.
- **D4.2 — Simulated storage failure:** the fault-demo route returns `503 Service Unavailable`, `Retry-After: 5`, and a clean Problem Details response. This demonstrates generic storage-failure handling, **not by itself a real Payments timeout regression test**.

### Automated tests

The test suite was run after the current changes:

```text
19 passed in 0.08s
```

The passing tests cover order creation and idempotency, validation, unknown-order handling, filtering and pagination, ETags and conditional updates, cancellation, OPTIONS/Allow, method override, `406` content negotiation, gzip compression, authentication failures, rate limiting, CORS, and security headers.

### OpenAPI validation

Run the validator against the current Assignment 6 file before recording a success:

```bash
openapi-spec-validator assignment4-orders/openapi.yaml
```

Record the output only after it has actually been run on the current specification. The earlier Assignment 4 validator output should not be presented as proof that the updated Assignment 6 specification has been validated.

### Remaining verification before submission

1. Remove the duplicate `D2.5` rate-limit section from `transcript.txt`.
2. Include the actual repeat `curl` command for D4.1, using the same idempotency key and request body as the original request.
3. Verify that `item-unavailable` and `payment-declined` are implemented and tested; otherwise mark them as not implemented rather than claiming success.
4. Add a real Assignment 5 payment-timeout/dependency-failure regression check if required by the brief. The current storage fault demo is not equivalent to a payment timeout.
5. Run the OpenAPI validator on the current `openapi.yaml`.
6. Package the source, updated `openapi.yaml`, `transcript.txt`, and this `NOTES.md` into one ZIP for submission.
