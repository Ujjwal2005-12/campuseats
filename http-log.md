\# HTTP Request and Response Log



\## API Used



The requests below were made using `curl.exe -i` against the public JSONPlaceholder API.



The `-i` option includes the HTTP response headers together with the response body.



\---



\## 1. GET /posts/1



\### Command



```text

curl.exe -i https://jsonplaceholder.typicode.com/posts/1

```



\### Request



```http

GET /posts/1 HTTP/1.1

Host: jsonplaceholder.typicode.com

```



\### Response



```http

HTTP/1.1 200 OK

Date: Sat, 15 Aug 2026 15:46:36 GMT

Content-Type: application/json; charset=utf-8

Content-Length: 292

Connection: keep-alive

access-control-allow-credentials: true

Cache-Control: max-age=43200

etag: W/"124-yiKdLzqO5gfBrJFrcdJ8Yq0LGnU"

expires: -1

Server: cloudflare

vary: Origin, Accept-Encoding

via: 2.0 heroku-router

x-content-type-options: nosniff

x-powered-by: Express

x-ratelimit-limit: 1000

x-ratelimit-remaining: 999

x-ratelimit-reset: 1785194663

Age: 14945

Accept-Ranges: bytes

cf-cache-status: HIT

CF-RAY: a2b955431c0a3bf4-BOM

alt-svc: h3=":443"; ma=86400

```



\### Response Body



```json

{

&#x20; "userId": 1,

&#x20; "id": 1,

&#x20; "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",

&#x20; "body": "quia et suscipit\\nsuscipit recusandae consequuntur expedita et cum\\nreprehenderit molestiae ut ut quas totam\\nnostrum rerum est autem sunt rem eveniet architecto"

}

```



\### Annotation



\*\*Status:\*\* `200 OK` means the server successfully processed the request and returned the requested post.



\*\*Content-Type:\*\* `application/json; charset=utf-8` means the response body contains JSON data encoded using UTF-8.



\---



\## 2. GET /users/1



\### Command



```text

curl.exe -i https://jsonplaceholder.typicode.com/users/1

```



\### Request



```http

GET /users/1 HTTP/1.1

Host: jsonplaceholder.typicode.com

```



\### Response



```http

HTTP/1.1 200 OK

Date: Sat, 15 Aug 2026 15:48:23 GMT

Content-Type: application/json; charset=utf-8

Content-Length: 509

Connection: keep-alive

access-control-allow-credentials: true

Cache-Control: max-age=43200

etag: W/"1fd-+2Y3G3w049iSZtw5t1mzSnunngE"

expires: -1

Server: cloudflare

vary: Origin, Accept-Encoding

via: 2.0 heroku-router

x-content-type-options: nosniff

x-powered-by: Express

x-ratelimit-limit: 1000

x-ratelimit-remaining: 999

x-ratelimit-reset: 1786717390

Age: 4571

Accept-Ranges: bytes

cf-cache-status: HIT

CF-RAY: a2b957df1eca48ec-BOM

alt-svc: h3=":443"; ma=86400

```



\### Response Body



```json

{

&#x20; "id": 1,

&#x20; "name": "Leanne Graham",

&#x20; "username": "Bret",

&#x20; "email": "Sincere@april.biz",

&#x20; "address": {

&#x20;   "street": "Kulas Light",

&#x20;   "suite": "Apt. 556",

&#x20;   "city": "Gwenborough",

&#x20;   "zipcode": "92998-3874",

&#x20;   "geo": {

&#x20;     "lat": "-37.3159",

&#x20;     "lng": "81.1496"

&#x20;   }

&#x20; },

&#x20; "phone": "1-770-736-8031 x56442",

&#x20; "website": "hildegard.org",

&#x20; "company": {

&#x20;   "name": "Romaguera-Crona",

&#x20;   "catchPhrase": "Multi-layered client-server neural-net",

&#x20;   "bs": "harness real-time e-markets"

&#x20; }

}

```



\### Annotation



\*\*Status:\*\* `200 OK` means the requested user resource was successfully found and returned.



\*\*Content-Type:\*\* `application/json; charset=utf-8` means the response contains JSON encoded using UTF-8.



\---



\## 3. GET /comments/1



\### Command



```text

curl.exe -i https://jsonplaceholder.typicode.com/comments/1

```



\### Request



```http

GET /comments/1 HTTP/1.1

Host: jsonplaceholder.typicode.com

```



\### Response



```http

HTTP/1.1 200 OK

Date: Sat, 15 Aug 2026 15:49:36 GMT

Content-Type: application/json; charset=utf-8

Content-Length: 268

Connection: keep-alive

access-control-allow-credentials: true

Cache-Control: max-age=43200

etag: W/"10c-KJ4I9RM/+33TKdV8CFsIvqsDSP0"

expires: -1

Server: cloudflare

vary: Origin, Accept-Encoding

via: 2.0 heroku-router

x-content-type-options: nosniff

x-powered-by: Express

x-ratelimit-limit: 1000

x-ratelimit-remaining: 999

x-ratelimit-reset: 1786781023

Age: 28004

Accept-Ranges: bytes

cf-cache-status: HIT

CF-RAY: a2b959aa0d7f37a5-BOM

alt-svc: h3=":443"; ma=86400

```



\### Response Body



```json

{

&#x20; "postId": 1,

&#x20; "id": 1,

&#x20; "name": "id labore ex et quam laborum",

&#x20; "email": "Eliseo@gardner.biz",

&#x20; "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\\ntempora quo necessitatibus\\ndolor quam autem quasi\\nreiciendis et nam sapiente accusantium"

}

```



\### Annotation



\*\*Status:\*\* `200 OK` means the server successfully found and returned comment 1.



\*\*Content-Type:\*\* `application/json; charset=utf-8` means the response contains JSON encoded using UTF-8.



\---



\## 4. GET /posts/1/comments



\### Command



```text

curl.exe -i https://jsonplaceholder.typicode.com/posts/1/comments

```



\### Request



```http

GET /posts/1/comments HTTP/1.1

Host: jsonplaceholder.typicode.com

```



\### Response



```http

HTTP/1.1 200 OK

Date: Sat, 15 Aug 2026 15:51:06 GMT

Content-Type: application/json; charset=utf-8

Transfer-Encoding: chunked

Connection: keep-alive

access-control-allow-credentials: true

Cache-Control: max-age=43200

etag: W/"5e6-4bSPS5tq8F8ZDeFJULWh6upjp7U"

expires: -1

Server: cloudflare

vary: Origin, Accept-Encoding

via: 2.0 heroku-router

x-content-type-options: nosniff

x-powered-by: Express

x-ratelimit-limit: 1000

x-ratelimit-remaining: 999

x-ratelimit-reset: 1786356774

cf-cache-status: REVALIDATED

CF-RAY: a2b95bd63ba2edf5-BOM

alt-svc: h3=":443"; ma=86400

```



\### Response Body



```json

\[

&#x20; {

&#x20;   "postId": 1,

&#x20;   "id": 1,

&#x20;   "name": "id labore ex et quam laborum",

&#x20;   "email": "Eliseo@gardner.biz",

&#x20;   "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos\\ntempora quo necessitatibus\\ndolor quam autem quasi\\nreiciendis et nam sapiente accusantium"

&#x20; },

&#x20; {

&#x20;   "postId": 1,

&#x20;   "id": 2,

&#x20;   "name": "quo vero reiciendis velit similique earum",

&#x20;   "email": "Jayne\_Kuhic@sydney.com",

&#x20;   "body": "est natus enim nihil est dolore omnis voluptatem numquam\\net omnis occaecati quod ullam at\\nvoluptatem error expedita pariatur\\nnihil sint nostrum voluptatem reiciendis et"

&#x20; },

&#x20; {

&#x20;   "postId": 1,

&#x20;   "id": 3,

&#x20;   "name": "odio adipisci rerum aut animi",

&#x20;   "email": "Nikita@garfield.biz",

&#x20;   "body": "quia molestiae reprehenderit quasi aspernatur\\naut expedita occaecati aliquam eveniet laudantium\\nomnis quibusdam delectus saepe quia accusamus maiores nam est\\ncum et ducimus et vero voluptates excepturi deleniti ratione"

&#x20; },

&#x20; {

&#x20;   "postId": 1,

&#x20;   "id": 4,

&#x20;   "name": "alias odio sit",

&#x20;   "email": "Lew@alysha.tv",

&#x20;   "body": "non et atque\\noccaecati deserunt quas accusantium unde odit nobis qui voluptatem\\nquia voluptas consequuntur itaque dolor\\net qui rerum deleniti ut occaecati"

&#x20; },

&#x20; {

&#x20;   "postId": 1,

&#x20;   "id": 5,

&#x20;   "name": "vero eaque aliquid doloribus et culpa",

&#x20;   "email": "Hayden@althea.biz",

&#x20;   "body": "harum non quasi et ratione\\ntempore iure ex voluptates in ratione\\nharum architecto fugit inventore cupiditate\\nvoluptates magni quo et"

&#x20; }

]

```



\### Annotation



\*\*Status:\*\* `200 OK` means the server successfully returned the comments belonging to post 1.



\*\*Content-Type:\*\* `application/json; charset=utf-8` means the response contains JSON encoded using UTF-8.



\*\*Transfer-Encoding:\*\* `chunked` indicates that the response was transferred in chunks instead of using a `Content-Length` header.



\---



\## 5. GET /posts/999999 — Deliberate Failure



\### Command



```text

curl.exe -i https://jsonplaceholder.typicode.com/posts/999999

```



\### Request



```http

GET /posts/999999 HTTP/1.1

Host: jsonplaceholder.typicode.com

```



\### Response



```http

HTTP/1.1 404 Not Found

Date: Sat, 15 Aug 2026 15:52:41 GMT

Content-Type: application/json; charset=utf-8

Content-Length: 2

Connection: keep-alive

access-control-allow-credentials: true

Cache-Control: max-age=43200

etag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"

expires: -1

Server: cloudflare

vary: Origin, Accept-Encoding

via: 2.0 heroku-router

x-content-type-options: nosniff

x-powered-by: Express

x-ratelimit-limit: 1000

x-ratelimit-remaining: 999

x-ratelimit-reset: 1786791043

Age: 18152

cf-cache-status: HIT

CF-RAY: a2b95e2c7e933a31-BOM

alt-svc: h3=":443"; ma=86400

```



\### Response Body



```json

{}

```



\### Annotation



\*\*Status:\*\* `404 Not Found` means that the server was reached and processed the request, but the requested resource `/posts/999999` does not exist.



\*\*Content-Type:\*\* `application/json; charset=utf-8` means that even the error response is represented as JSON encoded using UTF-8.



This request deliberately asked for a non-existent post to satisfy the assignment requirement for a `404` response.



\---



\## Summary



| # | Endpoint            | Status          | Content-Type                      |

| - | ------------------- | --------------- | --------------------------------- |

| 1 | `/posts/1`          | `200 OK`        | `application/json; charset=utf-8` |

| 2 | `/users/1`          | `200 OK`        | `application/json; charset=utf-8` |

| 3 | `/comments/1`       | `200 OK`        | `application/json; charset=utf-8` |

| 4 | `/posts/1/comments` | `200 OK`        | `application/json; charset=utf-8` |

| 5 | `/posts/999999`     | `404 Not Found` | `application/json; charset=utf-8` |



All five requests were read-only `GET` requests. The fifth request deliberately targeted a non-existent resource and produced the required `404 Not Found` response.



