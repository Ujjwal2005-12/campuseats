# Assignment 4 — Orders Service

**Team:**
| Name | Roll No |
|---|---|
| Krity Kumari | 2025265101930 |
| Ujjwal Sharma | 20252651060 |
| Vinit Gaikwad | 20252651019 |
| Shubhag Baluni | 2025265101953 |

---

## Part A — Modelling

### A2. Operations (SOAP-style starting point)

- `createOrder(customerId, items, ...)`
- `getOrder(orderId)`
- `listOrdersByCustomer(customerId)`
- `cancelOrder(orderId, reason)`
- `updateOrderStatus(orderId, newStatus)`

### A4. Resource table

| Method | URL                              | Description                                                          | Success Code | Failure Codes |
| ------ | -------------------------------- | -------------------------------------------------------------------- | :----------: | :-----------: |
| POST   | `/orders`                        | Create a new order for a customer                                    |     201      |   400, 422    |
| GET    | `/orders/{orderId}`              | Retrieve a single order by id                                        |     200      |      404      |
| GET    | `/orders?customerId=...`         | List orders filtered by customer id (query string)                   |     200      |      400      |
| POST   | `/orders/{orderId}/cancellation` | Create a cancellation record for an order (sub-resource, not DELETE) |     201      | 404, 409, 422 |
| PATCH  | `/orders/{orderId}`              | Update order status (e.g. confirmed → preparing → dispatched)        |     200      | 404, 409, 422 |

### A5. Justification — the hard case

`cancelOrder` mapped least comfortably onto a plain resource. A first instinct was
`DELETE /orders/{orderId}`, but a cancelled order still needs to exist — it must remain
readable for refunds, audits, and customer support — so deleting the resource was
rejected. Instead, cancellation is modelled as its own sub-resource:
`POST /orders/{orderId}/cancellation` creates a durable cancellation record without
destroying the order itself. This also gives a natural place to record _why_ an order
was cancelled and to reject the action with `409` if the order is already
shipped/delivered.

---

## Part D — Resilience

### D3. Fallback reasoning

When `createOrder` calls the Payments service and Payments is unreachable after all
retries (`PaymentsUnavailableError`), the order is left in `created` status rather than
optimistically marked `confirmed`. We chose to fail honestly instead of degrading:
silently treating an unconfirmed charge as successful would let food be prepared and
delivered for an order nobody has actually paid for, which is a worse outcome than a
customer seeing their order stuck in `created` and retrying later. The same applies if
Payments explicitly rejects the charge (`PaymentsRejectedError`, a 4xx) — that response
is never retried, since a 4xx means the request itself was invalid, not the network.

---

## Answers

**1. WSDL vs OpenAPI line count**

- Assignment 3 WSDL (`partner.wsdl`): **97** lines
- `openapi.yaml`: **303** lines
- The difference is _not_ extra content — it is a difference in what has to be spelled
  out explicitly per operation. OpenAPI's YAML is longer here mainly because every
  operation documents multiple named failure responses in full (`400`, `404`, `409`,
  `422`, each with its own description and schema reference), where the WSDL's fault
  handling was left largely implicit outside a single generic `soap:Fault` shape.
  `openapi.yaml` also spells out five separate operations across five paths, each with
  its own parameters and response schemas, whereas the WSDL's `<types>`/`<message>`
  layer only had to describe one request/response pair for a single `charge` operation.
- Two things the WSDL declared that OpenAPI does not need:
  1. The `<soap:binding style="document" transport="...soap/http"/>` block — an
     explicit transport/encoding contract. REST simply assumes HTTP + JSON, so there is
     nothing equivalent to declare.
  2. An explicit `<service>`/`<port><soap:address location="..."/>` nested structure.
     OpenAPI's `servers:` block is a single flat list entry, not a per-operation address.

**2. soap:Fault vs problem body**

Quoted fault from Assignment 3 (`soap-fault.xml`):

```xml
<soap:Fault>
  <faultcode>soap:Client</faultcode>
  <faultstring>Payment declined</faultstring>
  <detail>
    <errorCode>card_declined</errorCode>
    <message>The payment method was declined by the payment gateway.</message>
  </detail>
</soap:Fault>
```

Replaced by, returned with a real HTTP `409 Conflict` status line instead of `200 OK`
(shown here for our closest equivalent state-conflict case, cancelling an
already-cancelled order):

```json
{
  "type": "https://campuseats.example.com/errors/409",
  "title": "Cannot cancel order",
  "status": 409,
  "detail": "Order 'ord_4868cdc29030' is 'cancelled' and cannot be cancelled."
}
```

Returning a fault inside a `200 OK` is a problem for the network in between because
intermediaries — proxies, caches, load balancers, monitoring dashboards — only inspect
the HTTP status line. A `200` tells every one of those layers "this succeeded," so a
genuine failure gets cached as a good response, retried as if it were safe, or never
flagged by uptime monitoring, all because the real outcome is buried in a body that only
the final application actually parses.

**3. UDDI's publish / find / bind**

- **Publish**: still exists, but informally — replaced by committing `openapi.yaml`
  itself to the shared repository (or, in a larger organisation, publishing it to an
  internal API catalogue/gateway) instead of registering with a dedicated UDDI registry.
- **Find**: mostly disappeared as a runtime concept — there is no registry a client
  queries at request time to discover Orders' address. It is replaced by a much simpler
  mechanism: an environment variable (`PAYMENTS_URL`) or a README pointing developers
  at the right host, resolved once at deploy time rather than looked up dynamically.
- **Bind**: disappeared entirely as a distinct step. SOAP's WSDL-driven client
  generation and runtime binding is replaced by an HTTP client (`requests`) constructing
  plain JSON requests directly from the OpenAPI contract — there is no separate binding
  phase, just an HTTP call.

**4. Who validates now**

The functions `validate_order_create`, `validate_status_update`, and
`validate_cancellation` in `errors.py` now carry the responsibility the Assignment 3 XML
Schema used to enforce automatically. Without them, a request such as
`{"customerId": "cust_001", "items": [{"itemId": "x", "quantity": -5}]}` would be
accepted and stored as-is — `quantity: -5` is syntactically valid JSON, so nothing would
reject it unless `validate_order_create` explicitly checks that `quantity` is a positive
integer, which it does.

**5. Where SOAP would still win**

The Payments call in Part D is the one place a stronger guarantee than "HTTP request
that might fail" would genuinely help: SOAP's WS-* stack (e.g. WS-ReliableMessaging /
WS-AtomicTransaction) can offer an exactly-once delivery and transactional-commit
guarantee across services at the protocol level. Our REST implementation approximates
this with an application-level idempotency key rather than a protocol-level guarantee —
which works, but relies on both services agreeing to honour that key correctly, rather
than the transport enforcing it. If a use case genuinely needed a coordinated
two-phase-commit across multiple services (e.g. charging a card *and* reserving
inventory *and\* notifying a courier, all-or-nothing), that is a case where SOAP's older
transactional tooling has a real, specific answer that idempotency keys alone do not
fully replace.

---

## Curl transcript

See `curl-transcript.txt`. Confirmed with `-i`:

- [x] successful create → status + `Location` header
- [x] same request repeated with same `Idempotency-Key` → original result returned
- [x] malformed body → 400/422
- [x] missing resource → 404
- [x] state conflict → 409

## Validator output

```
$ openapi-spec-validator openapi.yaml
openapi.yaml: OK
```

## Test output

```
tests/test_orders.py::test_create_order_success PASSED
tests/test_orders.py::test_create_order_idempotent_repeat PASSED
tests/test_orders.py::test_create_order_malformed_body_returns_400 PASSED
tests/test_orders.py::test_get_unknown_order_returns_404 PASSED

==================== 4 passed in 0.05s ====================
```
