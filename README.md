# CampusEats

Submitted by:<br>
Krity Kumari - 2025265101930<br> 
Ujjwal Sharma- 20252651060<br>
Vinit Gaikwad - 20252651019<br>
Shubhag Baluni - 2025265101953<br>
CampusEats is a campus food ordering system designed to make ordering food from campus canteens and food vendors easier for students. The system allows students to browse menus, select food items, place orders, make payments, and track order status.



This repository contains the work completed for the HTTP and project setup assignment.



## Assignment Objectives



This project demonstrates:



\* Making HTTP requests using `curl`.

\* Reading HTTP response status codes and headers.

\* Working with a public JSON API.

\* Handling a deliberate `404 Not Found` response.

\* Inspecting browser network requests using Chrome DevTools.

\* Understanding request types, status codes, sizes, and timings.

\* Setting up and maintaining a Git repository.

\* Defining the requirements and resources of the CampusEats system.



\## Repository Structure



```text

campuseats/

├── README.md

├── http-log.md

├── network-analysis.md

├── brief.md

└── docs/

```



### Files



\* \*\*`README.md`\*\* — Project overview and assignment information.

\* \*\*`http-log.md`\*\* — Five HTTP request/response pairs made using `curl`, including one deliberate `404`.

\* \*\*`network-analysis.md`\*\* — Browser DevTools Network analysis.

\* \*\*`brief.md`\*\* — CampusEats system brief containing what, who, nouns, and verbs.

\* \*\*`docs/`\*\* — Documentation directory for additional project documentation.



## HTTP API Testing



The HTTP requests were made against the public JSONPlaceholder API using `curl.exe -i`.



The tested endpoints included:



```text

GET /posts/1

GET /users/1

GET /comments/1

GET /posts/1/comments

GET /posts/999999

```



The last request intentionally requested a resource that does not exist and returned `404 Not Found`.



## Browser Network Analysis



The website was inspected using Google Chrome DevTools → Network.



The browser cache was disabled before reloading the page. The analysis recorded the number of requests, transferred data, resource sizes, request timings, and HTTP status codes.



## Git Workflow



The project was committed incrementally while the assignment was completed rather than being submitted as a single final commit.



Example commit stages include:



```text

Initial CampusEats project structure

Add browser network analysis

Add CampusEats system brief

```



## CampusEats Users



The main users of the proposed system are:



\* Students

\* Food vendors/canteen staff

\* Campus administrators



The system's main resources and operations are documented in `brief.md`.



## Status

This repository contains the completed documentation for the HTTP, browser Network, Git setup, and CampusEats system brief assignment.

---

## Assignment 7 — Build one CampusEats service in GraphQL

The GraphQL service implementation for Assignment 7 is located in [`assignment7-graphql/`](./assignment7-graphql/):
- **GraphQL Schema:** [`assignment7-graphql/schema.graphql`](./assignment7-graphql/schema.graphql)
- **Apollo Server & Resolvers:** [`assignment7-graphql/server.js`](./assignment7-graphql/server.js) + [`assignment7-graphql/db.js`](./assignment7-graphql/db.js)
- **MySQL Database & Seed:** [`assignment7-graphql/schema.sql`](./assignment7-graphql/schema.sql)
- **Frontend Dashboard:** [`assignment7-graphql/public/index.html`](./assignment7-graphql/public/index.html)
- **Documentation & Questions:** [`assignment7-graphql/README.md`](./assignment7-graphql/README.md)
- **Screenshots:** [`assignment7-graphql/screenshots/`](./assignment7-graphql/screenshots/)
- **Demo Script:** [`assignment7-graphql/DEMO.md`](./assignment7-graphql/DEMO.md)

To run the GraphQL service:
```bash
cd assignment7-graphql
npm install
npm start
```
Frontend runs at `http://localhost:4000/` and GraphQL endpoint is at `http://localhost:4000/graphql`.

## Assignment 09 – Securing the API

### 1. Authentication and Role-Based Authorization

The API uses JWT authentication to protect its REST endpoints.

| Method | Route | Access Requirement |
|---|---|---|
| GET | `/items` | Authentication only – any authenticated user |
| GET | `/items/:id` | Authentication only – any authenticated user |
| POST | `/items` | Authentication + `restaurant` role |
| DELETE | `/items/:id` | Authentication + `restaurant` role |
| POST | `/login` | Public route – credentials are verified to obtain a JWT |

Customers and restaurant users can log in and receive JWT tokens. However, only users with the `restaurant` role can add or delete menu items.

### 2. HTTP 401 and 403 Responses

- **401 Unauthorized:** When a user requests `GET /items` without providing a JWT, the server returns 401 because authentication is missing.
- **403 Forbidden:** When an authenticated customer attempts to add an item using `POST /items`, the server returns 403 because the customer does not have the required `restaurant` role.

**Difference:** 401 means the request is not successfully authenticated, whereas 403 means the user is authenticated but does not have permission to perform the requested action.

### 3. JWT Payload and Secret Security

The JWT payload contains:

- `id`: The user's unique ID.
- `role`: The user's role, such as `customer` or `restaurant`.

The JWT also contains standard claims such as `iat` (issued at) and `exp` (expiration time).

The role claim is safe to trust on the server because the JWT is digitally signed using a secret key. The server verifies the signature using `jwt.verify()` before accessing the payload. If someone modifies the role claim, the signature verification fails.

The JWT secret must remain outside the source code because exposing it could allow an attacker to generate forged tokens and impersonate privileged users. Therefore, the secret is stored in the `.env` file and accessed through `process.env.JWT_SECRET`. The `.env` file is excluded from Git using `.gitignore`.

## Assignment 09 – Securing the API

### 1. Authentication and Role-Based Authorization

The API uses JWT authentication to protect its REST endpoints.

| Method | Route | Access Requirement |
|---|---|---|
| GET | `/items` | Authentication only – any authenticated user |
| GET | `/items/:id` | Authentication only – any authenticated user |
| POST | `/items` | Authentication + `restaurant` role |
| DELETE | `/items/:id` | Authentication + `restaurant` role |
| POST | `/login` | Public route – credentials are verified to obtain a JWT |

Customers and restaurant users can log in and receive JWT tokens. However, only users with the `restaurant` role can add or delete menu items.

### 2. HTTP 401 and 403 Responses

- **401 Unauthorized:** When a user requests `GET /items` without providing a JWT, the server returns 401 because authentication is missing.
- **403 Forbidden:** When an authenticated customer attempts to add an item using `POST /items`, the server returns 403 because the customer does not have the required `restaurant` role.

**Difference:** 401 means the request is not successfully authenticated, whereas 403 means the user is authenticated but does not have permission to perform the requested action.

### 3. JWT Payload and Secret Security

The JWT payload contains:

- `id`: The user's unique ID.
- `role`: The user's role, such as `customer` or `restaurant`.

The JWT also contains standard claims such as `iat` (issued at) and `exp` (expiration time).

The role claim is safe to trust on the server because the JWT is digitally signed using a secret key. The server verifies the signature using `jwt.verify()` before accessing the payload. If someone modifies the role claim, the signature verification fails.

The JWT secret must remain outside the source code because exposing it could allow an attacker to generate forged tokens and impersonate privileged users. Therefore, the secret is stored in the `.env` file and accessed through `process.env.JWT_SECRET`. The `.env` file is excluded from Git using `.gitignore`.
