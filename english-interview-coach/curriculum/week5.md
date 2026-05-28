# Week 5 Seed Vocabulary: LLM in Production

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — LLM Basics (10 terms)

### 1. token
**Definition:** A small piece of text the model reads or writes — usually a few characters.
**Collocations:** token count · input tokens · output tokens · tokens per second
**Example:** The prompt was 2000 tokens, and the reply was 500 tokens.
**Difficulty:** 1 · **Interview use:** Cost and latency questions.

### 2. tokenization
**Definition:** Splitting text into tokens before the model can read it.
**Collocations:** tokenization · tokenize the input · BPE tokenizer
**Example:** Different models tokenize differently, so the same text is more tokens in some.
**Difficulty:** 2 · **Interview use:** "Why does my Chinese cost more?" — common.

### 3. context window
**Definition:** The most tokens the model can read at once, input plus output.
**Collocations:** context window · 200k context · run out of context
**Example:** With a 1M context window, we can include the whole codebase.
**Difficulty:** 1 · **Interview use:** Used in every LLM design answer.

### 4. temperature
**Definition:** A knob that controls how random the model's output is.
**Collocations:** temperature 0 · low temperature · raise the temperature
**Example:** I set temperature to 0 for the eval and 0.7 for the creative writing task.
**Difficulty:** 2 · **Interview use:** "How do you tune outputs?" — common.

### 5. top_p
**Definition:** Another way to control randomness: keep only the top tokens that add up to p in probability.
**Collocations:** top_p · nucleus sampling · top_p 0.9
**Example:** I use top_p 0.9 instead of temperature when I want stable but varied output.
**Difficulty:** 3 · **Interview use:** Depth check on sampling.

### 6. max_tokens
**Definition:** A cap on how many tokens the model can produce in one reply.
**Collocations:** max_tokens · cap the output · truncated at max_tokens
**Example:** I lowered max_tokens to 500 because long replies were running over budget.
**Difficulty:** 1 · **Interview use:** Cost control questions.

### 7. stop sequence
**Definition:** A string that makes the model stop generating when it produces it.
**Collocations:** stop sequence · stop on `</answer>` · stop tokens
**Example:** I set `\n\nUser:` as a stop sequence to keep the model from playing both roles.
**Difficulty:** 2 · **Interview use:** Prompt design questions.

### 8. system prompt
**Definition:** The instructions sent to the model first, that shape its behavior.
**Collocations:** system prompt · the system message · cached system prompt
**Example:** The system prompt tells the model it is a coding assistant for Python.
**Difficulty:** 1 · **Interview use:** Foundation — used in every LLM answer.

### 9. completion
**Definition:** The text the model produces in response to a prompt.
**Collocations:** model completion · the completion · streamed completion
**Example:** We log the completion alongside the prompt for debugging.
**Difficulty:** 1 · **Interview use:** Setup term.

### 10. streaming response
**Definition:** Sending the model's tokens to the client as they are produced, instead of waiting for the end.
**Collocations:** stream the response · token streaming · server-sent stream
**Example:** Streaming the response made the UI feel 10x faster, even though total time was the same.
**Difficulty:** 2 · **Interview use:** UX and latency questions.

---

## Group 2 — Prompting (10 terms)

### 11. prompt engineering
**Definition:** Designing prompts so the model does the right thing.
**Collocations:** prompt engineering · iterate on the prompt · prompt design
**Example:** I spent two days on prompt engineering to fix the JSON format issue.
**Difficulty:** 1 · **Interview use:** Used in any LLM answer.

### 12. few-shot
**Definition:** Showing the model a few examples in the prompt before asking it to do the task.
**Collocations:** few-shot examples · two-shot · few-shot prompt
**Example:** I added three few-shot examples and accuracy jumped from 70 to 90 percent.
**Difficulty:** 2 · **Interview use:** "How would you improve this prompt?" — common.

### 13. zero-shot
**Definition:** Asking the model to do a task with no examples, just instructions.
**Collocations:** zero-shot · zero-shot accuracy · works zero-shot
**Example:** The task worked zero-shot on Sonnet but needed few-shot on the smaller model.
**Difficulty:** 1 · **Interview use:** Pairs with few-shot.

### 14. chain-of-thought
**Definition:** Asking the model to write out its reasoning step by step before the final answer.
**Collocations:** chain-of-thought · step-by-step reasoning · CoT prompt
**Example:** Chain-of-thought boosted the math accuracy from 40 to 80 percent.
**Difficulty:** 2 · **Interview use:** "How do you improve reasoning?" — common.

### 15. structured output
**Definition:** Telling the model to reply in a fixed shape, like JSON with named fields.
**Collocations:** structured output · JSON schema · constrained generation
**Example:** I used structured output so the reply parses as JSON every time.
**Difficulty:** 2 · **Interview use:** Production LLM questions.

### 16. JSON mode
**Definition:** A model feature that guarantees the reply is valid JSON.
**Collocations:** JSON mode · enable JSON mode · strict JSON
**Example:** Switching to JSON mode removed the broken-JSON parse errors.
**Difficulty:** 2 · **Interview use:** Pairs with structured output.

### 17. role
**Definition:** A label on a message: `system`, `user`, or `assistant`.
**Collocations:** message role · assistant role · system role
**Example:** I gave the model an `assistant` example to show the desired tone.
**Difficulty:** 1 · **Interview use:** Chat API basics.

### 18. prompt template
**Definition:** A reusable prompt with placeholders that get filled in at runtime.
**Collocations:** prompt template · fill in the variables · template engine
**Example:** The prompt template takes `{topic}` and `{tone}` as variables.
**Difficulty:** 1 · **Interview use:** Production design questions.

### 19. instruction tuning
**Definition:** Training a base model to follow instructions, by fine-tuning on instruction-response pairs.
**Collocations:** instruction-tuned model · instruction tuning · SFT
**Example:** An instruction-tuned model is what most apps use, not the raw base model.
**Difficulty:** 3 · **Interview use:** Training-side depth question.

### 20. context stuffing
**Definition:** Putting a lot of background information into the prompt so the model has what it needs.
**Collocations:** stuff the context · context stuffing · long-context prompt
**Example:** Instead of RAG, we just context-stuffed the docs into the 200k window.
**Difficulty:** 2 · **Interview use:** "RAG vs long context?" — common.

---

## Group 3 — Caching & Cost (10 terms)

### 21. prompt caching
**Definition:** Reusing the model's work on a stable prompt prefix to save cost and latency.
**Collocations:** prompt caching · cache the system prompt · cache hit
**Example:** Prompt caching cut our cost by 80 percent because the system prompt is stable.
**Difficulty:** 2 · **Interview use:** "How do you cut LLM cost?" — common.

### 22. cache hit rate
**Definition:** The share of requests that reuse a cached prefix.
**Collocations:** cache hit rate · raise the hit rate · low hit rate
**Example:** I reordered the prompt so the cache hit rate went from 30 to 85 percent.
**Difficulty:** 2 · **Interview use:** Cost optimization questions.

### 23. cost per token
**Definition:** The price the provider charges for one input or output token.
**Collocations:** cost per token · price per million tokens · token economics
**Example:** Sonnet costs ~$3 per million input tokens and $15 per million output tokens.
**Difficulty:** 1 · **Interview use:** Used in cost answers.

### 24. input / output pricing
**Definition:** Most providers charge less for tokens you send than for tokens the model produces.
**Collocations:** input price · output price · output is 5x input
**Example:** Output tokens cost 5x input tokens, so I shorten replies to save money.
**Difficulty:** 1 · **Interview use:** Cost design questions.

### 25. model size tradeoff
**Definition:** Big models are smarter but slower and more expensive than small models.
**Collocations:** model size tradeoff · big vs small model · pick the smallest that works
**Example:** I use Haiku for cheap tasks and Sonnet only when the small model fails.
**Difficulty:** 2 · **Interview use:** Design questions.

### 26. cheap-vs-smart routing
**Definition:** Sending easy requests to a small model and hard ones to a bigger model.
**Collocations:** cheap-vs-smart · model routing · escalate to a bigger model
**Example:** We route 80 percent of calls to Haiku and only escalate hard ones to Sonnet.
**Difficulty:** 3 · **Interview use:** Cost optimization design.

### 27. token budget
**Definition:** A cap on how many tokens a single call or task can use.
**Collocations:** token budget · stay under budget · budget per request
**Example:** We give the agent a 50k token budget per task to keep cost predictable.
**Difficulty:** 2 · **Interview use:** Agent design.

### 28. parallel calls
**Definition:** Running many independent LLM calls at the same time instead of one after another.
**Collocations:** parallel calls · concurrent requests · parallel inference
**Example:** Parallel calls cut total time from 20s (sequential) to 4s.
**Difficulty:** 2 · **Interview use:** Latency questions.

### 29. request batching
**Definition:** Sending many prompts in one API call for cheaper, slower processing.
**Collocations:** batch API · batch inference · batched requests
**Example:** We batch overnight eval runs because the batch API is half price.
**Difficulty:** 2 · **Interview use:** Cost optimization.

### 30. latency vs cost
**Definition:** Faster usually means more expensive — small model fast/cheap, big model slow/smart.
**Collocations:** latency vs cost · tradeoff · pick the right point
**Example:** For chat, we picked the fast model; for analysis, the smart one.
**Difficulty:** 2 · **Interview use:** Design questions.

---

## Group 4 — Reliability & Safety (10 terms)

### 31. hallucination
**Definition:** When the model says something that sounds confident but is not true.
**Collocations:** the model hallucinated · hallucination rate · reduce hallucinations
**Example:** The model hallucinated a function that does not exist in the library.
**Difficulty:** 2 · **Interview use:** "How do you handle hallucinations?" — very common.

### 32. refusal
**Definition:** When the model declines to answer a request, usually for safety reasons.
**Collocations:** model refusal · over-refusal · refusal rate
**Example:** Over-refusal hurt UX because the model declined safe medical questions.
**Difficulty:** 2 · **Interview use:** Safety questions.

### 33. guardrail
**Definition:** A check that filters or stops bad inputs or outputs around the model.
**Collocations:** add a guardrail · input guardrail · output guardrail
**Example:** A guardrail blocks the model from leaking the system prompt.
**Difficulty:** 2 · **Interview use:** "How do you keep it safe?" — common.

### 34. content filter
**Definition:** A check that scans text for unsafe content before sending or showing it.
**Collocations:** content filter · run through the filter · filter trigger
**Example:** The content filter blocks abusive replies before they reach the user.
**Difficulty:** 1 · **Interview use:** Safety design.

### 35. jailbreak
**Definition:** A prompt that tricks the model into ignoring its safety rules.
**Collocations:** jailbreak attempt · defend against jailbreaks · jailbreak prompt
**Example:** The famous DAN prompts were jailbreaks for early chat models.
**Difficulty:** 2 · **Interview use:** Safety depth question.

### 36. prompt injection
**Definition:** When attacker input changes the model's instructions, hijacking the behavior.
**Collocations:** prompt injection · indirect prompt injection · injection defense
**Example:** A web page told our agent to email its password — that is a prompt injection attack.
**Difficulty:** 3 · **Interview use:** Agent security question.

### 37. output validation
**Definition:** Checking the model's reply for the right shape and content before using it.
**Collocations:** validate the output · output schema · retry on bad output
**Example:** We validate the JSON and retry once with feedback if it fails.
**Difficulty:** 2 · **Interview use:** Reliability questions.

### 38. fallback model
**Definition:** A backup model the system uses when the main model fails or times out.
**Collocations:** fallback model · fall back to · model fallback chain
**Example:** If Sonnet times out, we fall back to Haiku to keep the feature alive.
**Difficulty:** 2 · **Interview use:** Reliability design.

### 39. safety classifier
**Definition:** A small model that decides whether text is safe or not.
**Collocations:** safety classifier · safety score · run the classifier
**Example:** The safety classifier scores each reply and blocks it if the score is too low.
**Difficulty:** 2 · **Interview use:** Safety architecture.

### 40. PII filtering
**Definition:** Removing personal data — names, emails, phone numbers — from prompts or logs.
**Collocations:** PII filter · scrub PII · redact PII
**Example:** We redact PII from logs before storing them, for privacy.
**Difficulty:** 2 · **Interview use:** Privacy and compliance questions.

---

## Group 5 — Evaluation (10 terms)

### 41. eval set
**Definition:** A fixed set of inputs and expected outputs, used to measure model quality.
**Collocations:** build an eval set · eval data · eval suite
**Example:** Our eval set has 200 hand-labeled examples we run before every release.
**Difficulty:** 2 · **Interview use:** "How do you measure quality?" — top question.

### 42. golden dataset
**Definition:** A trusted, high-quality dataset used as the gold standard for evaluation.
**Collocations:** golden dataset · golden answers · curated golden set
**Example:** The golden dataset is small (100 items) but every answer is hand-checked.
**Difficulty:** 2 · **Interview use:** Evaluation design.

### 43. automated eval
**Definition:** A program that scores model output without a human in the loop.
**Collocations:** automated eval · run the auto-eval · script the eval
**Example:** The automated eval runs after every prompt change and posts a score to Slack.
**Difficulty:** 2 · **Interview use:** "How do you catch regressions?" — common.

### 44. human eval
**Definition:** Asking real people to rate model outputs.
**Collocations:** human eval · annotator agreement · spot-check humans
**Example:** Automated evals miss tone, so we run a small human eval every week.
**Difficulty:** 2 · **Interview use:** Evaluation tradeoff questions.

### 45. regression test
**Definition:** A test that catches when a change makes a previously-working case worse.
**Collocations:** regression test · prompt regression · catch a regression
**Example:** The regression test caught a prompt change that broke 3 cases.
**Difficulty:** 2 · **Interview use:** Production engineering question.

### 46. A/B test
**Definition:** Sending some users to version A and others to version B, then comparing.
**Collocations:** A/B test · A/B prompt versions · winning variant
**Example:** The A/B test showed the new prompt had higher thumbs-up rate.
**Difficulty:** 2 · **Interview use:** "How do you decide which prompt to ship?" — common.

### 47. prompt regression
**Definition:** When a prompt change makes the model worse on some cases, even if it helps others.
**Collocations:** prompt regression · regression on edge cases · eval drop
**Example:** The new prompt fixed math but caused a prompt regression on creative writing.
**Difficulty:** 2 · **Interview use:** Eval design.

### 48. accuracy vs helpfulness
**Definition:** Accuracy is whether the answer is correct; helpfulness is whether it actually solves the user's need.
**Collocations:** accuracy vs helpfulness · be both · helpful but wrong
**Example:** A correct but unfriendly answer can score high on accuracy and low on helpfulness.
**Difficulty:** 2 · **Interview use:** "What do you measure?" — depth question.

### 49. side-by-side comparison
**Definition:** Showing two model outputs to a rater and asking which is better.
**Collocations:** side-by-side · pairwise comparison · blind side-by-side
**Example:** Side-by-side comparisons gave clearer signal than absolute scoring.
**Difficulty:** 2 · **Interview use:** Eval method questions.

### 50. LLM-as-judge
**Definition:** Using a strong model to score the output of another model.
**Collocations:** LLM as judge · model-as-judge · judge bias
**Example:** LLM-as-judge is cheap but can have biases, so we calibrate against human eval.
**Difficulty:** 3 · **Interview use:** Modern eval methods.

---

## Group 6 — Production Concerns (15 terms)

### 51. observability for LLMs
**Definition:** Logging prompts, outputs, and metadata so you can debug and improve over time.
**Collocations:** LLM observability · log the prompt · trace the call
**Example:** Our LLM observability stack stores every prompt, completion, latency, and cost.
**Difficulty:** 2 · **Interview use:** "How do you debug LLM bugs?" — common.

### 52. time to first token
**Definition:** How long from request until the first token streams back. Often called TTFT.
**Collocations:** time to first token · TTFT · TTFT under 1s
**Example:** Lowering TTFT was the single biggest UX win — users feel the speed.
**Difficulty:** 2 · **Interview use:** UX latency questions.

### 53. tokens per second
**Definition:** How fast the model streams tokens after the first one.
**Collocations:** tokens per second · TPS · output speed
**Example:** Haiku streams at ~120 tokens/sec; Sonnet at ~60.
**Difficulty:** 1 · **Interview use:** Performance questions.

### 54. p99 latency
**Definition:** The slowest 1% of requests — the long tail users complain about.
**Collocations:** p99 latency · tail latency · cut p99
**Example:** p50 was fine at 800ms, but p99 was 8s and ruined the experience.
**Difficulty:** 2 · **Interview use:** Reliability and UX.

### 55. retry with backoff
**Definition:** Retrying a failed call after waiting an increasing amount of time.
**Collocations:** retry with backoff · backoff and jitter · safe to retry
**Example:** I retry with backoff on 5xx and 429, but not on 4xx other than 429.
**Difficulty:** 2 · **Interview use:** Reliability design.

### 56. request cancellation
**Definition:** Stopping an in-flight LLM call when the user navigates away or no longer needs it.
**Collocations:** cancel the request · request cancellation · abort signal
**Example:** Request cancellation saved 30 percent of cost — half the chats were abandoned mid-reply.
**Difficulty:** 2 · **Interview use:** Cost and UX questions.

### 57. provider rate limiting
**Definition:** Caps the provider sets on how many requests or tokens you can send per minute.
**Collocations:** rate limit · 429 · per-minute token limit
**Example:** We hit the per-minute token limit at peak and had to spread the load.
**Difficulty:** 2 · **Interview use:** Scale planning.

### 58. cost monitoring
**Definition:** Tracking spend per feature, user, or request, in near real time.
**Collocations:** cost dashboard · cost per user · cost guardrail
**Example:** A cost monitoring alert caught the runaway agent loop before it cost real money.
**Difficulty:** 2 · **Interview use:** "How do you control LLM cost?" — common.

### 59. prompt versioning
**Definition:** Treating prompts like code — tracking changes, rolling out gradually, rolling back.
**Collocations:** prompt versioning · pin a prompt version · prompt diff
**Example:** Prompt versioning let us roll back the bad change in 10 seconds.
**Difficulty:** 2 · **Interview use:** Engineering process question.

### 60. model versioning
**Definition:** Pinning to a specific model version, since providers change models over time.
**Collocations:** model version · pin the version · model snapshot
**Example:** We pin the model version so behavior is stable across deploys.
**Difficulty:** 2 · **Interview use:** Stability questions.

### 61. model deprecation
**Definition:** A provider retires a model and you have to migrate before a deadline.
**Collocations:** model deprecation · sunset date · migrate off
**Example:** We migrated off the deprecated model six weeks before the sunset date.
**Difficulty:** 2 · **Interview use:** Operations questions.

### 62. canary deployment for prompts
**Definition:** Sending the new prompt to a small share of traffic first, then expanding.
**Collocations:** prompt canary · canary the prompt change · ramp the canary
**Example:** We canary new prompts at 5% for a day before going full.
**Difficulty:** 2 · **Interview use:** Safe rollout questions.

### 63. provider failover
**Definition:** Switching to another LLM provider when the main one is down or rate-limiting.
**Collocations:** provider failover · multi-provider · fall back to another provider
**Example:** Provider failover kept us up during a regional outage.
**Difficulty:** 3 · **Interview use:** Reliability depth.

### 64. usage cap
**Definition:** A hard limit on how much a user, tenant, or feature can spend in a window.
**Collocations:** usage cap · daily cap · per-tenant cap
**Example:** We added a per-user daily cap so one abuser cannot drain the credits.
**Difficulty:** 2 · **Interview use:** Cost and abuse questions.

### 65. log redaction
**Definition:** Removing sensitive info from logs before they are stored.
**Collocations:** log redaction · scrub the logs · redact secrets
**Example:** We redact emails and API keys from prompt logs before saving them.
**Difficulty:** 2 · **Interview use:** Privacy and compliance questions.
