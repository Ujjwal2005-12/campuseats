\# CampusEats



CampusEats is a campus food ordering system designed to make ordering food from campus canteens and food vendors easier for students. The system allows students to browse menus, select food items, place orders, make payments, and track order status.



This repository contains the work completed for the HTTP and project setup assignment.



\## Assignment Objectives



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



\### Files



\* \*\*`README.md`\*\* — Project overview and assignment information.

\* \*\*`http-log.md`\*\* — Five HTTP request/response pairs made using `curl`, including one deliberate `404`.

\* \*\*`network-analysis.md`\*\* — Browser DevTools Network analysis.

\* \*\*`brief.md`\*\* — CampusEats system brief containing what, who, nouns, and verbs.

\* \*\*`docs/`\*\* — Documentation directory for additional project documentation.



\## HTTP API Testing



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



\## Browser Network Analysis



The website was inspected using Google Chrome DevTools → Network.



The browser cache was disabled before reloading the page. The analysis recorded the number of requests, transferred data, resource sizes, request timings, and HTTP status codes.



\## Git Workflow



The project was committed incrementally while the assignment was completed rather than being submitted as a single final commit.



Example commit stages include:



```text

Initial CampusEats project structure

Add browser network analysis

Add CampusEats system brief

```



\## CampusEats Users



The main users of the proposed system are:



\* Students

\* Food vendors/canteen staff

\* Campus administrators



The system's main resources and operations are documented in `brief.md`.



\## Status



This repository contains the completed documentation for the HTTP, browser Network, Git setup, and CampusEats system brief assignment.



