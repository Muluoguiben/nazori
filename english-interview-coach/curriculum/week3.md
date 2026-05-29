# Week 3 Seed Vocabulary: Backend + API

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — HTTP & REST (12 terms)

### 1. HTTP method
**Definition:** The verb on a request: GET, POST, PUT, PATCH, DELETE.
**Collocations:** HTTP method · use GET for reads · use POST for creates
**Example:** I used PATCH because we only updated some fields, not the whole record.
**Difficulty:** 1 · **Interview use:** Basic — used in any API answer.

### 2. status code
**Definition:** The number a server returns to say how the request went, like 200 or 404.
**Collocations:** status code · 200 OK · 401 Unauthorized · 5xx error
**Example:** I returned 409 because the email was already taken.
**Difficulty:** 1 · **Interview use:** "Which status code would you use?" — common.

### 3. idempotent
**Definition:** Doing it twice has the same effect as doing it once.
**Collocations:** idempotent endpoint · make X idempotent · idempotency
**Example:** We made the payment endpoint idempotent so retries do not double-charge.
**Difficulty:** 2 · **Interview use:** Reliability and retry questions.

### 4. REST
**Definition:** A style of API where each URL stands for a resource and HTTP methods act on it.
**Collocations:** REST API · RESTful · break REST
**Example:** Our REST API uses `/users/:id` for both GET and PATCH.
**Difficulty:** 1 · **Interview use:** "What is REST?" — basic warm-up.

### 5. resource
**Definition:** A noun the API exposes, like `user` or `order`, addressable by URL.
**Collocations:** resource URL · nested resource · resource collection
**Example:** Each order is a resource at `/orders/:id`.
**Difficulty:** 1 · **Interview use:** Setup for REST questions.

### 6. endpoint
**Definition:** One URL + HTTP method that the API responds to.
**Collocations:** API endpoint · public endpoint · expose an endpoint
**Example:** I added a new endpoint at POST `/auth/login`.
**Difficulty:** 1 · **Interview use:** Used in every API answer.

### 7. route
**Definition:** The mapping from a URL pattern to a handler in the server code.
**Collocations:** route handler · define a route · route param
**Example:** I added a route for `/users/:id` that calls `getUser`.
**Difficulty:** 1 · **Interview use:** Routing questions.

### 8. query parameter
**Definition:** A key-value pair after `?` in the URL, used for filters and options.
**Collocations:** query param · parse query string · `?limit=10`
**Example:** The list endpoint takes `?page=2&limit=20` as query parameters.
**Difficulty:** 1 · **Interview use:** API design questions.

### 9. request body
**Definition:** The data sent in the body of a POST, PUT, or PATCH request, usually JSON.
**Collocations:** request body · JSON body · parse the body
**Example:** The signup endpoint takes name and email in the request body.
**Difficulty:** 1 · **Interview use:** Setup for API design.

### 10. response headers
**Definition:** Extra info the server sends with the response, like content type or cache rules.
**Collocations:** response headers · set a header · cache header
**Example:** I set `Cache-Control: max-age=3600` in the response headers.
**Difficulty:** 1 · **Interview use:** Caching and CORS questions.

### 11. content type
**Definition:** A header that says what kind of data is in the body, like `application/json`.
**Collocations:** content type · `application/json` · multipart form data
**Example:** I set the content type to `application/json` so the client parses it.
**Difficulty:** 1 · **Interview use:** Basic — used in any API debugging story.

### 12. CORS
**Definition:** A browser rule that blocks requests to other origins unless the server allows them.
**Collocations:** CORS error · enable CORS · CORS headers · preflight
**Example:** We hit a CORS error because the API origin was not in the allowed list.
**Difficulty:** 2 · **Interview use:** Common debugging story.

---

## Group 2 — Auth (10 terms)

### 13. authentication
**Definition:** Proving who you are, usually with a password or token.
**Collocations:** authenticate the user · auth flow · login
**Example:** We authenticate users with email and password, then issue a JWT.
**Difficulty:** 1 · **Interview use:** "Walk me through auth" — common.

### 14. authorization
**Definition:** Deciding what an authenticated user is allowed to do.
**Collocations:** authorize the action · role-based authorization · permission check
**Example:** Authentication checks who you are; authorization checks what you can do.
**Difficulty:** 1 · **Interview use:** "What's the difference between authn and authz?" — classic.

### 15. JWT
**Definition:** A signed token that carries user info, used in headers to prove identity.
**Collocations:** issue a JWT · decode the JWT · JWT expires · bearer JWT
**Example:** The login endpoint returns a JWT that the client sends in the `Authorization` header.
**Difficulty:** 2 · **Interview use:** "How does JWT work?" — common.

### 16. OAuth
**Definition:** A standard where a user lets one app access their data in another app without sharing the password.
**Collocations:** OAuth flow · OAuth provider · authorization code · access token
**Example:** We use OAuth so users can log in with Google.
**Difficulty:** 2 · **Interview use:** "Walk me through OAuth" — senior-leaning.

### 17. session
**Definition:** Server-side state that tracks a logged-in user across requests.
**Collocations:** session cookie · session store · invalidate the session
**Example:** I store sessions in Redis so they survive a server restart.
**Difficulty:** 2 · **Interview use:** "Sessions vs JWT?" — common.

### 18. cookie
**Definition:** A small piece of data the browser stores and sends with each request.
**Collocations:** set a cookie · HTTP-only cookie · secure cookie · same-site cookie
**Example:** I set the session cookie as HTTP-only so JavaScript can't read it.
**Difficulty:** 2 · **Interview use:** Security questions.

### 19. CSRF
**Definition:** An attack where a malicious site makes the browser send a request using the user's cookies.
**Collocations:** CSRF attack · CSRF token · same-site cookie blocks CSRF
**Example:** I added a CSRF token to the form to block cross-site requests.
**Difficulty:** 3 · **Interview use:** Security depth question.

### 20. refresh token
**Definition:** A long-lived token used to get a new short-lived access token.
**Collocations:** refresh token · rotate the refresh token · refresh flow
**Example:** The access token lasts 15 minutes; the refresh token lasts 30 days.
**Difficulty:** 2 · **Interview use:** "How do you handle token expiry?" — common.

### 21. bearer token
**Definition:** A token sent in the `Authorization: Bearer ...` header.
**Collocations:** bearer token · `Authorization: Bearer` · pass a bearer
**Example:** Every API request includes the JWT as a bearer token.
**Difficulty:** 1 · **Interview use:** Used in auth answers.

### 22. scope
**Definition:** A label on a token that says what actions it is allowed to do.
**Collocations:** OAuth scope · request scopes · scope-limited token
**Example:** The token has `read:user` scope, so it cannot write to the profile.
**Difficulty:** 2 · **Interview use:** OAuth questions.

---

## Group 3 — API Design (12 terms)

### 23. API contract
**Definition:** The agreed shape of an API — endpoints, inputs, outputs.
**Collocations:** API contract · break the contract · contract test
**Example:** Changing the field name from `userId` to `user_id` broke the API contract.
**Difficulty:** 2 · **Interview use:** Versioning questions.

### 24. versioning
**Definition:** A way to ship new API behavior without breaking old clients.
**Collocations:** version the API · `/v1` prefix · API versioning · breaking change
**Example:** We added `/v2/users` because the response shape had to change.
**Difficulty:** 2 · **Interview use:** "How do you handle a breaking change?" — common.

### 25. pagination
**Definition:** Splitting a long list of results into smaller pages.
**Collocations:** paginate the list · page-based pagination · cursor pagination · next page
**Example:** I paginated the endpoint so the client gets 20 items at a time.
**Difficulty:** 2 · **Interview use:** "How would you paginate this?" — common.

### 26. cursor pagination
**Definition:** Pagination that uses a pointer to the last seen item instead of a page number.
**Collocations:** cursor-based pagination · next cursor · opaque cursor
**Example:** We switched to cursor pagination because items were inserted while paging.
**Difficulty:** 3 · **Interview use:** "Cursor vs offset?" — depth question.

### 27. rate limiting
**Definition:** Capping how many requests a client can send in a time window.
**Collocations:** rate limit · 429 Too Many Requests · per-user rate limit
**Example:** I added a 100 requests-per-minute rate limit to stop scrapers.
**Difficulty:** 2 · **Interview use:** Security and abuse questions.

### 28. throttling
**Definition:** Slowing down a client that is sending too many requests, instead of blocking.
**Collocations:** throttle the client · throttle to N rps · soft throttling
**Example:** We throttle big senders by adding a delay instead of returning errors.
**Difficulty:** 2 · **Interview use:** Paired with rate limiting.

### 29. retry
**Definition:** Sending the same request again after a failure.
**Collocations:** retry the request · retry policy · retry on 5xx
**Example:** The client retries network errors but not 400s.
**Difficulty:** 1 · **Interview use:** Reliability questions.

### 30. exponential backoff
**Definition:** Waiting longer between each retry — 1s, 2s, 4s, 8s — to avoid overloading the server.
**Collocations:** exponential backoff · with jitter · backoff strategy
**Example:** I added exponential backoff with jitter so retries don't all hit at once.
**Difficulty:** 2 · **Interview use:** "How do you handle retries?" — common.

### 31. idempotency key
**Definition:** A unique id the client sends so the server can dedupe retries.
**Collocations:** idempotency key · `Idempotency-Key` header · dedupe key
**Example:** The payment API requires an idempotency key so retries do not double-charge.
**Difficulty:** 2 · **Interview use:** Stripe-style integration questions.

### 32. webhook
**Definition:** An HTTP callback the server sends to the client when something happens.
**Collocations:** webhook URL · receive a webhook · verify webhook signature
**Example:** Stripe sends a webhook when a payment succeeds.
**Difficulty:** 2 · **Interview use:** Async API design questions.

### 33. polling
**Definition:** The client calls the server repeatedly to check for new data.
**Collocations:** poll the endpoint · poll every N seconds · stop polling
**Example:** Polling every 5 seconds was wasting bandwidth, so we switched to WebSockets.
**Difficulty:** 1 · **Interview use:** "Polling vs WebSockets?" — common.

### 34. long polling
**Definition:** A request that the server holds open until new data is ready, then returns it.
**Collocations:** long poll · hold the connection · long-polling timeout
**Example:** Long polling kept the connection open until the chat had a new message.
**Difficulty:** 2 · **Interview use:** Real-time data questions.

---

## Group 4 — Data Layer (12 terms)

### 35. database
**Definition:** A system that stores and queries structured data.
**Collocations:** the database · query the database · database row
**Example:** We store users in a Postgres database.
**Difficulty:** 1 · **Interview use:** Setup — used in every backend answer.

### 36. SQL vs NoSQL
**Definition:** SQL uses tables and a strict schema; NoSQL uses flexible documents or key-value stores.
**Collocations:** SQL database · NoSQL store · pick SQL or NoSQL
**Example:** We use SQL for orders and Redis (NoSQL) for sessions.
**Difficulty:** 2 · **Interview use:** "SQL or NoSQL and why?" — common.

### 37. ORM
**Definition:** A library that lets you query the database using objects instead of raw SQL.
**Collocations:** use an ORM · ORM model · `User.findOne(...)` · escape the ORM
**Example:** We use Prisma as the ORM but drop to raw SQL for the heavy reports.
**Difficulty:** 2 · **Interview use:** "Pros and cons of an ORM?" — common.

### 38. migration
**Definition:** A versioned script that changes the database schema.
**Collocations:** run a migration · write a migration · rollback the migration
**Example:** I wrote a migration to add the `email_verified_at` column.
**Difficulty:** 2 · **Interview use:** "How do you ship a schema change?" — common.

### 39. index
**Definition:** A side data structure that lets the database find rows by a column quickly.
**Collocations:** add an index · composite index · index scan
**Example:** Adding an index on `email` made the lookup 100x faster.
**Difficulty:** 2 · **Interview use:** "Why is this query slow?" — perf question.

### 40. transaction
**Definition:** A group of database operations that either all succeed or all roll back.
**Collocations:** start a transaction · commit · roll back · within a transaction
**Example:** I wrapped the transfer in a transaction so both updates happen together.
**Difficulty:** 2 · **Interview use:** Always asked at least once.

### 41. ACID
**Definition:** Atomicity, Consistency, Isolation, Durability — the four guarantees of a SQL transaction.
**Collocations:** ACID-compliant · isolation level · ACID guarantees
**Example:** ACID guarantees mean the bank transfer cannot leave money in the wrong place.
**Difficulty:** 3 · **Interview use:** "Explain ACID" — classic.

### 42. query
**Definition:** A request to the database for data.
**Collocations:** run a query · slow query · query plan
**Example:** I rewrote the query to use an index and it dropped from 2s to 20ms.
**Difficulty:** 1 · **Interview use:** Used in every DB answer.

### 43. join
**Definition:** A SQL operation that combines rows from two tables based on a shared key.
**Collocations:** inner join · left join · join on user_id
**Example:** I used an inner join to get users together with their orders.
**Difficulty:** 2 · **Interview use:** Coding rounds with SQL.

### 44. schema
**Definition:** The shape of the data — which tables, which columns, which types.
**Collocations:** database schema · schema change · schema design
**Example:** The schema has `users`, `orders`, and `products` tables.
**Difficulty:** 1 · **Interview use:** Setup for design questions.

### 45. primary key
**Definition:** A column whose value is unique for each row, used to identify it.
**Collocations:** primary key · composite key · auto-incrementing key
**Example:** The user table uses `id` (a UUID) as the primary key.
**Difficulty:** 1 · **Interview use:** Basic — used in any schema answer.

### 46. foreign key
**Definition:** A column that points to a primary key in another table.
**Collocations:** foreign key · references X(id) · enforce a foreign key
**Example:** The `order.user_id` is a foreign key that references `user.id`.
**Difficulty:** 1 · **Interview use:** Schema design questions.

---

## Group 5 — Networking & Protocols (10 terms)

### 47. TCP / UDP
**Definition:** TCP is reliable and ordered; UDP is fast but may lose packets.
**Collocations:** TCP connection · UDP packet · TCP handshake
**Example:** Video calls use UDP because losing a frame is OK; file transfer uses TCP.
**Difficulty:** 2 · **Interview use:** Networking depth question.

### 48. WebSocket
**Definition:** A protocol that keeps a TCP connection open for two-way real-time messages.
**Collocations:** open a WebSocket · WebSocket message · upgrade to WebSocket
**Example:** The chat uses WebSockets so messages arrive without polling.
**Difficulty:** 2 · **Interview use:** Real-time feature questions.

### 49. SSE
**Definition:** Server-Sent Events — a one-way stream of messages from server to browser over HTTP.
**Collocations:** SSE stream · `text/event-stream` · server-sent events
**Example:** I used SSE to stream the LLM response token by token.
**Difficulty:** 2 · **Interview use:** Streaming and LLM questions.

### 50. gRPC
**Definition:** A high-performance RPC framework using HTTP/2 and Protocol Buffers.
**Collocations:** gRPC service · proto file · gRPC stream
**Example:** Our internal services talk gRPC; the public API is REST.
**Difficulty:** 3 · **Interview use:** Microservices questions.

### 51. GraphQL
**Definition:** A query language where the client asks for exactly the fields it needs.
**Collocations:** GraphQL query · GraphQL schema · resolver · over-fetching
**Example:** We picked GraphQL so each client could pull only the fields it uses.
**Difficulty:** 2 · **Interview use:** "REST vs GraphQL?" — common.

### 52. HTTPS / TLS
**Definition:** HTTP encrypted with TLS so traffic cannot be read or modified in transit.
**Collocations:** HTTPS · TLS certificate · TLS handshake · cert renewal
**Example:** We terminate TLS at the load balancer so internal hops are plain HTTP.
**Difficulty:** 2 · **Interview use:** Security questions.

### 53. DNS
**Definition:** The system that turns a domain name like `api.example.com` into an IP address.
**Collocations:** DNS lookup · DNS cache · DNS record · TTL on DNS
**Example:** The DNS TTL is 60 seconds so failover happens fast.
**Difficulty:** 2 · **Interview use:** Outage debugging stories.

### 54. latency
**Definition:** The time it takes for one request to get a response.
**Collocations:** request latency · p99 latency · cut latency
**Example:** Moving the API to the same region as the DB cut latency from 200ms to 30ms.
**Difficulty:** 1 · **Interview use:** Performance questions.

### 55. request/response cycle
**Definition:** The full path a request takes from client to server and back.
**Collocations:** request/response cycle · round trip · trace the cycle
**Example:** I traced the request/response cycle and found the slow step.
**Difficulty:** 1 · **Interview use:** Setup for debugging stories.

### 56. payload
**Definition:** The data sent in the body of a request or response.
**Collocations:** request payload · payload size · large payload · trim the payload
**Example:** The payload was 2MB because the server returned every field — I trimmed it.
**Difficulty:** 1 · **Interview use:** Performance and design questions.

---

## Group 6 — Production Concerns (9 terms)

### 57. logging
**Definition:** Writing records of what the server did, so you can read them later.
**Collocations:** structured logging · log level · log line · log spam
**Example:** I added structured logging so we can search by request id.
**Difficulty:** 1 · **Interview use:** "How do you debug in production?" — common.

### 58. monitoring
**Definition:** Watching system metrics like error rate, latency, and traffic.
**Collocations:** monitor the service · monitoring dashboard · alert on X
**Example:** Monitoring caught the spike in 500s within a minute.
**Difficulty:** 1 · **Interview use:** Setup for incident stories.

### 59. observability
**Definition:** Being able to understand what the system is doing from outside, using logs, metrics, and traces.
**Collocations:** observability stack · improve observability · observable system
**Example:** We added traces to improve observability of the slow endpoints.
**Difficulty:** 2 · **Interview use:** "Monitoring vs observability?" — depth question.

### 60. error tracking
**Definition:** A tool that captures and groups exceptions from production, like Sentry.
**Collocations:** error tracking · error report · error rate · Sentry
**Example:** Error tracking caught the new bug within 30 seconds of the deploy.
**Difficulty:** 1 · **Interview use:** Operations questions.

### 61. health check
**Definition:** A simple endpoint that says whether the service is alive and ready.
**Collocations:** health check endpoint · liveness · readiness · `/healthz`
**Example:** The load balancer pulls a host out of rotation if its health check fails.
**Difficulty:** 1 · **Interview use:** Deployment questions.

### 62. graceful shutdown
**Definition:** Letting in-flight requests finish before the server exits.
**Collocations:** graceful shutdown · SIGTERM · drain connections
**Example:** On SIGTERM, the server stops accepting new requests but finishes the open ones.
**Difficulty:** 2 · **Interview use:** Deployment and reliability questions.

### 63. connection pool
**Definition:** A reused set of open database connections, so each request does not open a new one.
**Collocations:** connection pool · pool size · pool exhausted
**Example:** Bumping the connection pool size from 10 to 50 fixed the timeouts.
**Difficulty:** 2 · **Interview use:** "Why is the DB slow under load?" — debugging.

### 64. timeout
**Definition:** A limit on how long to wait for a response before giving up.
**Collocations:** request timeout · connection timeout · set a timeout
**Example:** I set a 5-second timeout so slow downstreams do not block the worker.
**Difficulty:** 1 · **Interview use:** Reliability questions.

### 65. circuit breaker
**Definition:** A pattern that stops calling a failing downstream service for a while, to let it recover.
**Collocations:** circuit breaker · open the circuit · half-open · trip the breaker
**Example:** The circuit breaker opened after 5 failures, so we stopped hammering the broken service.
**Difficulty:** 3 · **Interview use:** Reliability and microservices questions.
