# Week 4 Seed Vocabulary: System Design

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — Architecture Patterns (10 terms)

### 1. monolith
**Definition:** One big app with all features in a single codebase and deploy.
**Collocations:** the monolith · split the monolith · modular monolith
**Example:** We started with a monolith and only split out two services when scaling hurt.
**Difficulty:** 1 · **Interview use:** "Monolith or microservices?" — classic.

### 2. microservices
**Definition:** An app split into many small services that talk over the network.
**Collocations:** microservices architecture · split into microservices · service boundary
**Example:** We moved auth into its own microservice so other teams could ship without us.
**Difficulty:** 2 · **Interview use:** Architecture questions.

### 3. serverless
**Definition:** Running code in functions that the cloud spins up on demand, with no server to manage.
**Collocations:** serverless function · cold start · serverless platform
**Example:** The webhook handler is serverless because traffic is bursty.
**Difficulty:** 2 · **Interview use:** "When to pick serverless?" — common.

### 4. edge computing
**Definition:** Running code in many small data centers close to users, for lower latency.
**Collocations:** edge function · edge runtime · run at the edge
**Example:** We moved auth checks to the edge so users in Asia get a faster response.
**Difficulty:** 2 · **Interview use:** Latency design questions.

### 5. BFF
**Definition:** Backend for Frontend — a thin server that shapes data for one specific client.
**Collocations:** BFF layer · mobile BFF · web BFF
**Example:** The mobile app talks to a BFF that joins three APIs into one response.
**Difficulty:** 3 · **Interview use:** "How do you serve mobile and web?" — common.

### 6. API gateway
**Definition:** One entry point that routes, authenticates, and rate-limits requests across many services.
**Collocations:** API gateway · route through the gateway · gateway auth
**Example:** The API gateway handles auth so each service doesn't have to.
**Difficulty:** 2 · **Interview use:** Microservices questions.

### 7. service mesh
**Definition:** A layer that handles service-to-service traffic — retries, mTLS, observability.
**Collocations:** service mesh · sidecar · mesh policy
**Example:** The service mesh adds mTLS between every internal service.
**Difficulty:** 3 · **Interview use:** Senior-leaning infra question.

### 8. event-driven architecture
**Definition:** Services react to events on a queue, instead of calling each other directly.
**Collocations:** event-driven · publish an event · subscribe to events
**Example:** When an order is paid, we publish a `paid` event and three services react to it.
**Difficulty:** 2 · **Interview use:** "How would you decouple these services?" — common.

### 9. CQRS
**Definition:** Command Query Responsibility Segregation — separate write path and read path, often with different stores.
**Collocations:** CQRS pattern · read model · write model
**Example:** We use CQRS so the read model is denormalized for fast queries.
**Difficulty:** 3 · **Interview use:** Senior-leaning architecture.

### 10. hexagonal architecture
**Definition:** A design where business logic sits in the center and adapters connect it to the outside world.
**Collocations:** hexagonal architecture · ports and adapters · clean architecture
**Example:** Hexagonal architecture made it easy to swap the SQL store for an in-memory test store.
**Difficulty:** 3 · **Interview use:** Clean-code-focused interviews.

---

## Group 2 — Caching (10 terms)

### 11. cache
**Definition:** A fast store of recently used results, so you do not recompute them.
**Collocations:** add a cache · cache layer · in-memory cache · cache key
**Example:** I added a cache so we do not hit the database for every product page.
**Difficulty:** 1 · **Interview use:** "How would you speed this up?" — answer involves cache.

### 12. cache hit / miss
**Definition:** A hit is when the cache has the value; a miss is when it does not and you fall back.
**Collocations:** cache hit rate · cache miss · cold cache
**Example:** The cache hit rate dropped from 90% to 60% after the deploy.
**Difficulty:** 1 · **Interview use:** Performance questions.

### 13. TTL
**Definition:** Time to live — how long a cached value stays valid before it is dropped.
**Collocations:** set a TTL · short TTL · expire on TTL
**Example:** I set a 60-second TTL so stale data doesn't show for too long.
**Difficulty:** 1 · **Interview use:** Caching tradeoff questions.

### 14. cache invalidation
**Definition:** Marking cached data as stale so the next read fetches fresh data.
**Collocations:** invalidate the cache · cache invalidation key · invalidate on write
**Example:** After updating the profile, I invalidate the user cache so the next read is fresh.
**Difficulty:** 2 · **Interview use:** "Two hard problems in CS" — common joke.

### 15. CDN
**Definition:** A network of edge servers that serves static files close to the user.
**Collocations:** put it behind a CDN · CDN edge · purge the CDN
**Example:** We put images behind a CDN so users in different regions get them fast.
**Difficulty:** 2 · **Interview use:** Performance questions.

### 16. in-memory cache
**Definition:** A cache stored in RAM, like Redis or Memcached, for fastest access.
**Collocations:** in-memory cache · Redis cache · cache in RAM
**Example:** We use Redis as an in-memory cache for session data.
**Difficulty:** 1 · **Interview use:** "What do you cache and where?" — common.

### 17. write-through cache
**Definition:** Every write goes to both the cache and the database at the same time.
**Collocations:** write-through cache · write-through policy
**Example:** Write-through keeps the cache and DB in sync, at the cost of slower writes.
**Difficulty:** 3 · **Interview use:** Caching strategy depth question.

### 18. write-behind cache
**Definition:** Writes go to the cache first and are flushed to the database later, asynchronously.
**Collocations:** write-behind · async flush · risk losing writes
**Example:** Write-behind is fast but can lose writes if the cache crashes before the flush.
**Difficulty:** 3 · **Interview use:** Caching tradeoff question.

### 19. stale-while-revalidate
**Definition:** Serve the cached value right away, then refresh it in the background.
**Collocations:** stale-while-revalidate · SWR · background refresh
**Example:** Stale-while-revalidate gave us instant page loads with eventually fresh data.
**Difficulty:** 2 · **Interview use:** Caching design questions.

### 20. cache stampede
**Definition:** When a cache key expires and many requests hit the database at once to refill it.
**Collocations:** cache stampede · thundering herd · single-flight protection
**Example:** We use single-flight to stop a cache stampede on popular keys.
**Difficulty:** 3 · **Interview use:** "What happens when the cache expires?" — depth.

---

## Group 3 — Databases at Scale (10 terms)

### 21. replication
**Definition:** Making copies of the database on other machines, for reads or failover.
**Collocations:** database replication · replica lag · async replication
**Example:** We replicate the primary to two read replicas in another region.
**Difficulty:** 2 · **Interview use:** "How do you scale reads?" — common.

### 22. sharding
**Definition:** Splitting one big database into many smaller ones, each holding part of the data.
**Collocations:** shard the table · shard key · resharding
**Example:** We shard by user id so all of one user's data lives on one shard.
**Difficulty:** 3 · **Interview use:** Scale design questions.

### 23. read replica
**Definition:** A copy of the database used only for reads, to take load off the primary.
**Collocations:** read replica · route reads to replica · replica lag
**Example:** I send analytics queries to a read replica so they don't slow down writes.
**Difficulty:** 2 · **Interview use:** "How do you scale reads?" — common.

### 24. primary / replica
**Definition:** Primary handles writes; replicas hold copies for reads.
**Collocations:** primary node · failover to replica · promote a replica
**Example:** When the primary failed, we promoted a replica in 30 seconds.
**Difficulty:** 2 · **Interview use:** Failover questions.

### 25. eventual consistency
**Definition:** Replicas catch up to the primary over time, so a read right after a write may be stale.
**Collocations:** eventually consistent · eventual consistency · read-after-write lag
**Example:** Eventually consistent reads are fine for the news feed but not for the balance.
**Difficulty:** 3 · **Interview use:** "Strong vs eventual consistency?" — common.

### 26. strong consistency
**Definition:** Every read returns the most recent write.
**Collocations:** strongly consistent · strong consistency · linearizable
**Example:** Bank balances need strong consistency; product likes do not.
**Difficulty:** 3 · **Interview use:** Pairs with eventual consistency.

### 27. partition
**Definition:** A subset of a table or topic, often used in distributed systems.
**Collocations:** partition key · partition by user · Kafka partition
**Example:** We partition the events topic by user id to keep order per user.
**Difficulty:** 2 · **Interview use:** Kafka and DB design questions.

### 28. denormalization
**Definition:** Copying data into multiple places to avoid joins, trading space for read speed.
**Collocations:** denormalize the table · denormalized view · join cost
**Example:** We denormalized the order table to include the user name, to avoid a join.
**Difficulty:** 2 · **Interview use:** "Why is this read slow?" — common.

### 29. hot key
**Definition:** A single key that gets way more traffic than the others, overloading one shard.
**Collocations:** hot key · hotspot · key skew
**Example:** The celebrity profile became a hot key and ran one shard at 100% CPU.
**Difficulty:** 3 · **Interview use:** Scaling story questions.

### 30. materialized view
**Definition:** A precomputed view of data, stored as a table, refreshed on a schedule.
**Collocations:** materialized view · refresh the view · stale view
**Example:** We use a materialized view for the daily metrics so the dashboard is fast.
**Difficulty:** 3 · **Interview use:** Reporting design questions.

---

## Group 4 — Async & Queues (10 terms)

### 31. message queue
**Definition:** A buffer between producers and consumers, holding messages until a worker can process them.
**Collocations:** push to the queue · consume from the queue · queue depth
**Example:** We push image jobs onto a queue and a worker pool processes them.
**Difficulty:** 2 · **Interview use:** Async architecture questions.

### 32. pub/sub
**Definition:** A pattern where publishers send messages to topics and many subscribers receive them.
**Collocations:** publish/subscribe · publish to a topic · subscribe to a topic
**Example:** When an order is paid, we publish to `order.paid` and three services subscribe.
**Difficulty:** 2 · **Interview use:** Event-driven design questions.

### 33. event bus
**Definition:** Shared infrastructure that carries events between many services.
**Collocations:** central event bus · publish to the bus · event bus schema
**Example:** All teams publish their domain events to a shared event bus.
**Difficulty:** 2 · **Interview use:** Architecture questions.

### 34. dead letter queue
**Definition:** A queue that holds messages that failed to process, for later inspection.
**Collocations:** dead letter queue · DLQ · move to DLQ · drain the DLQ
**Example:** Bad messages go to a DLQ so a good message does not block the queue.
**Difficulty:** 2 · **Interview use:** Reliability questions.

### 35. idempotent consumer
**Definition:** A worker that produces the same result no matter how many times a message is delivered.
**Collocations:** idempotent consumer · dedupe by id · idempotent processing
**Example:** The consumer is idempotent because it checks the message id before processing.
**Difficulty:** 3 · **Interview use:** "What about duplicate messages?" — common.

### 36. at-least-once delivery
**Definition:** The queue guarantees every message is delivered, but may deliver duplicates.
**Collocations:** at-least-once delivery · expect duplicates · at-least-once semantics
**Example:** Our queue is at-least-once, so consumers must be idempotent.
**Difficulty:** 3 · **Interview use:** Delivery guarantee questions.

### 37. exactly-once delivery
**Definition:** Each message is delivered and processed exactly one time.
**Collocations:** exactly-once · exactly-once semantics
**Example:** True exactly-once is rare; most systems pair at-least-once with idempotency.
**Difficulty:** 3 · **Interview use:** Senior-leaning depth question.

### 38. ordering guarantee
**Definition:** Whether messages on a topic are delivered in the order they were sent.
**Collocations:** ordering guarantee · ordered per partition · out-of-order delivery
**Example:** Kafka guarantees ordering only within a partition, not across the topic.
**Difficulty:** 3 · **Interview use:** Kafka and event-streaming questions.

### 39. fan-out
**Definition:** Sending one input to many consumers or workers.
**Collocations:** fan out the request · fan-out write · fan-out / fan-in
**Example:** A new follow triggers a fan-out write to every follower's feed.
**Difficulty:** 2 · **Interview use:** Social-graph design questions.

### 40. back-pressure
**Definition:** A signal from a slow consumer to slow down the producer, so nothing gets overwhelmed.
**Collocations:** back-pressure · apply back-pressure · queue grows unbounded
**Example:** Without back-pressure, a slow worker let the queue grow until memory died.
**Difficulty:** 3 · **Interview use:** Streaming and reliability questions.

---

## Group 5 — Reliability (10 terms)

### 41. fault tolerance
**Definition:** The system keeps working when some parts fail.
**Collocations:** fault-tolerant · tolerate a node failure · graceful failure
**Example:** Adding a replica made the database fault tolerant to a single node loss.
**Difficulty:** 2 · **Interview use:** Reliability design questions.

### 42. redundancy
**Definition:** Having more than one copy of a critical part so one can fail without taking down the system.
**Collocations:** redundant servers · redundancy across zones · N+1 redundancy
**Example:** We run two instances in each zone for redundancy.
**Difficulty:** 1 · **Interview use:** Setup for reliability talk.

### 43. failover
**Definition:** Switching from a failed instance to a healthy one, automatically.
**Collocations:** failover to replica · automatic failover · manual failover
**Example:** Failover happens automatically when the health check fails for 30 seconds.
**Difficulty:** 2 · **Interview use:** DB and infra questions.

### 44. blast radius
**Definition:** How much of the system breaks when one part fails.
**Collocations:** blast radius · limit the blast radius · contained failure
**Example:** Putting each customer on a separate shard limits the blast radius of a bad query.
**Difficulty:** 2 · **Interview use:** "How would you limit the impact of X?" — common.

### 45. SLA / SLO / SLI
**Definition:** SLA is the promise to users, SLO is the internal target, SLI is the measured metric.
**Collocations:** 99.9% SLA · meet the SLO · SLI dashboard
**Example:** Our SLA is 99.9%, our SLO is 99.95%, and the SLI is 5xx rate.
**Difficulty:** 3 · **Interview use:** Reliability question — senior-leaning.

### 46. graceful degradation
**Definition:** When something breaks, the app still works with reduced features.
**Collocations:** degrade gracefully · fallback UI · soft failure
**Example:** When the recommendation service fails, the page still loads — just without recs.
**Difficulty:** 2 · **Interview use:** "What if X fails?" — common.

### 47. retry storm
**Definition:** Many clients retrying at the same time, making an outage worse.
**Collocations:** retry storm · thundering herd · jitter the retries
**Example:** Adding jitter to retries stopped the retry storm from killing the service.
**Difficulty:** 3 · **Interview use:** "What's wrong with retries?" — common.

### 48. bulkhead pattern
**Definition:** Isolating parts of the system so one failing part cannot drag down others.
**Collocations:** bulkhead pattern · isolate the pool · per-tenant pool
**Example:** A separate connection pool per tenant acts as a bulkhead.
**Difficulty:** 3 · **Interview use:** Reliability depth question.

### 49. chaos engineering
**Definition:** Deliberately breaking parts of production to find weaknesses before they happen for real.
**Collocations:** chaos engineering · chaos experiment · inject failure
**Example:** Our chaos experiments kill a random pod every Wednesday.
**Difficulty:** 3 · **Interview use:** Mature-infra question.

### 50. canary deployment
**Definition:** Rolling out a new version to a small percent of traffic first, then expanding.
**Collocations:** canary deploy · canary group · roll back the canary
**Example:** We canary to 1%, watch errors, then ramp to 100%.
**Difficulty:** 2 · **Interview use:** Deploy strategy questions.

---

## Group 6 — Scaling & Performance (15 terms)

### 51. horizontal scaling
**Definition:** Adding more machines to handle more load.
**Collocations:** scale horizontally · scale out · add more instances
**Example:** Horizontal scaling means adding more workers; vertical means a bigger one.
**Difficulty:** 1 · **Interview use:** "How would you scale this?" — common.

### 52. vertical scaling
**Definition:** Making one machine bigger — more CPU, RAM, or disk.
**Collocations:** scale vertically · scale up · bigger instance
**Example:** Vertical scaling is faster but hits a hardware ceiling.
**Difficulty:** 1 · **Interview use:** Pairs with horizontal scaling.

### 53. load balancer
**Definition:** A proxy that spreads requests across many backend instances.
**Collocations:** load balancer · round-robin · LB health check
**Example:** The load balancer sends each request to whichever backend has the lowest load.
**Difficulty:** 1 · **Interview use:** Architecture questions.

### 54. autoscaling
**Definition:** Automatically adding or removing instances based on load.
**Collocations:** autoscaling group · scale on CPU · scale on queue depth
**Example:** Autoscaling adds workers when the queue depth crosses 1000.
**Difficulty:** 2 · **Interview use:** Cloud architecture questions.

### 55. throughput
**Definition:** How many requests per second the system can handle.
**Collocations:** throughput · requests per second · rps · bump throughput
**Example:** Caching the hot path bumped throughput from 200 to 2000 rps.
**Difficulty:** 1 · **Interview use:** Performance questions.

### 56. latency budget
**Definition:** A target for total time taken; each step has its own slice.
**Collocations:** latency budget · stay under the budget · spend the budget
**Example:** Our 200ms latency budget left only 80ms for the database call.
**Difficulty:** 3 · **Interview use:** "How would you hit a 100ms target?" — common.

### 57. p50 / p99
**Definition:** Median (p50) and 99th-percentile latency — most users vs the slowest 1%.
**Collocations:** p50 latency · p99 spike · tail latency
**Example:** p50 is 50ms but p99 is 2s — we need to fix the tail.
**Difficulty:** 2 · **Interview use:** Performance questions.

### 58. cold start
**Definition:** The slow first request to a serverless function or new instance, when nothing is warm.
**Collocations:** cold start · cold-start latency · warm up
**Example:** Cold starts hurt user-facing routes, so we keep warm instances.
**Difficulty:** 2 · **Interview use:** Serverless questions.

### 59. warm pool
**Definition:** A pool of already-started instances, ready to handle traffic with no cold start.
**Collocations:** warm pool · keep instances warm · provisioned concurrency
**Example:** We keep a warm pool of 5 instances for traffic spikes.
**Difficulty:** 2 · **Interview use:** Latency questions.

### 60. edge cache
**Definition:** A cache at the CDN edge, close to the user.
**Collocations:** edge cache · cache at the edge · purge the edge
**Example:** Edge caching the home page dropped first-byte time from 300ms to 30ms.
**Difficulty:** 2 · **Interview use:** Performance design.

### 61. request coalescing
**Definition:** Combining many identical concurrent requests into one upstream call.
**Collocations:** request coalescing · single-flight · dedupe in-flight
**Example:** Coalescing the popular-page requests stopped a cache stampede.
**Difficulty:** 3 · **Interview use:** Caching depth question.

### 62. compression
**Definition:** Shrinking the response with gzip or brotli to send less data.
**Collocations:** gzip compression · brotli · compress the response
**Example:** Enabling brotli compression cut payload size by 70%.
**Difficulty:** 1 · **Interview use:** Performance tuning.

### 63. batching
**Definition:** Grouping many small calls into one larger call to cut overhead.
**Collocations:** batch the requests · batch insert · batched API
**Example:** Batching the inserts dropped the write time from 5s to 200ms.
**Difficulty:** 2 · **Interview use:** Performance questions.

### 64. prefetching
**Definition:** Loading data or assets before the user asks for them.
**Collocations:** prefetch the next page · prefetch on hover · prefetch hint
**Example:** We prefetch the next page on hover, so the click feels instant.
**Difficulty:** 2 · **Interview use:** UX performance questions.

### 65. read amplification
**Definition:** When one logical read causes many physical reads under the hood.
**Collocations:** read amplification · amplified reads · N+1 query
**Example:** The N+1 query caused 100x read amplification on every list page.
**Difficulty:** 3 · **Interview use:** Database perf depth.
