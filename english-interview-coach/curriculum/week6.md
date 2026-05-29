# Week 6 Seed Vocabulary: Agents + RAG

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — Agent Architecture (10 terms)

### 1. agent
**Definition:** An LLM that can take actions in a loop, not just reply once.
**Collocations:** build an agent · agentic system · the agent decides
**Example:** The coding agent reads files, edits them, and runs tests — all on its own.
**Difficulty:** 1 · **Interview use:** Foundation — used in every agent answer.

### 2. agent loop
**Definition:** The repeated cycle of think → act → observe that an agent runs until done.
**Collocations:** agent loop · run the loop · loop until done · break the loop
**Example:** Each turn of the agent loop, the model picks a tool and reads the result.
**Difficulty:** 2 · **Interview use:** "How does your agent work?" — central question.

### 3. autonomy
**Definition:** How much the agent decides on its own versus asking the user.
**Collocations:** agent autonomy · high autonomy · low autonomy
**Example:** We start with low autonomy: every action needs a user confirmation.
**Difficulty:** 2 · **Interview use:** Design tradeoff questions.

### 4. action
**Definition:** One step the agent takes, usually a tool call.
**Collocations:** take an action · action space · valid actions
**Example:** The agent's next action was to read the file at `/etc/hosts`.
**Difficulty:** 1 · **Interview use:** Used in every agent answer.

### 5. observation
**Definition:** What the agent sees back after taking an action.
**Collocations:** observation · the tool result · observe and react
**Example:** The observation after `read_file` was the file's contents.
**Difficulty:** 1 · **Interview use:** Setup for loop talk.

### 6. plan
**Definition:** A list of steps the agent intends to take to reach the goal.
**Collocations:** make a plan · plan the steps · replan
**Example:** The agent first makes a plan, then executes each step.
**Difficulty:** 2 · **Interview use:** "How does the agent decide what to do?" — common.

### 7. reflection
**Definition:** The agent looking at its own past steps to spot mistakes and adjust.
**Collocations:** reflect on the result · self-reflection · reflection step
**Example:** A reflection step caught that the agent picked the wrong file.
**Difficulty:** 3 · **Interview use:** Improving agent quality.

### 8. termination condition
**Definition:** The rule that tells the agent to stop running the loop.
**Collocations:** termination condition · stop condition · done signal
**Example:** The termination condition is "tests pass and no errors in output."
**Difficulty:** 2 · **Interview use:** "When does your agent stop?" — common.

### 9. max steps
**Definition:** A hard cap on how many actions the agent can take before being stopped.
**Collocations:** max steps · step budget · cap at N steps
**Example:** We set max steps to 30 to stop runaway loops.
**Difficulty:** 2 · **Interview use:** Reliability and cost questions.

### 10. agent persona
**Definition:** The role and style we give the agent in the system prompt.
**Collocations:** agent persona · define the persona · persona prompt
**Example:** The agent persona is "a careful senior engineer who asks before destructive actions."
**Difficulty:** 2 · **Interview use:** Prompt design questions.

---

## Group 2 — Tools & Function Calling (10 terms)

### 11. tool
**Definition:** A function the agent can call to do something in the world — read a file, search the web.
**Collocations:** define a tool · tool list · the agent picks a tool
**Example:** I gave the agent three tools: `read_file`, `edit_file`, and `run_tests`.
**Difficulty:** 1 · **Interview use:** Foundation — used in every agent answer.

### 12. function calling
**Definition:** The API feature that lets the model output a structured "call this function with these args".
**Collocations:** function calling · structured tool call · tool schema
**Example:** Function calling lets the model say "call `read_file` with path=/x" instead of free text.
**Difficulty:** 2 · **Interview use:** "How does the model use tools?" — common.

### 13. tool schema
**Definition:** A description of a tool — its name, what it does, its parameters and types.
**Collocations:** tool schema · JSON schema for tools · describe the tool
**Example:** The tool schema lists each parameter with its type and an example.
**Difficulty:** 2 · **Interview use:** Tool design.

### 14. parameter
**Definition:** One input to a tool, like `path` for `read_file`.
**Collocations:** required parameter · optional parameter · default value
**Example:** The `path` parameter is required; `encoding` is optional with a default.
**Difficulty:** 1 · **Interview use:** Tool design basics.

### 15. tool selection
**Definition:** The model picking which tool to call next.
**Collocations:** tool selection · select the right tool · wrong tool chosen
**Example:** When tool selection is bad, the agent reads the wrong file and loops forever.
**Difficulty:** 2 · **Interview use:** "Why did the agent pick the wrong tool?" — debugging.

### 16. parallel tool calls
**Definition:** The model calls many tools at the same time in one turn.
**Collocations:** parallel tool calls · concurrent tools · batch the calls
**Example:** Parallel tool calls cut total time in half, because three reads happen at once.
**Difficulty:** 2 · **Interview use:** Latency design question.

### 17. tool error handling
**Definition:** What the agent does when a tool fails — retry, report, or give up.
**Collocations:** tool error · handle tool errors · retry the tool
**Example:** On a network error, the agent retries once; on a permission error, it reports.
**Difficulty:** 2 · **Interview use:** Reliability questions.

### 18. tool result
**Definition:** The output of a tool call that the agent reads next turn.
**Collocations:** tool result · feed back the result · large tool result
**Example:** A huge tool result can blow the context window — we truncate before feeding it back.
**Difficulty:** 2 · **Interview use:** Context management questions.

### 19. MCP
**Definition:** Model Context Protocol — a standard way to expose tools to many LLM clients.
**Collocations:** MCP server · MCP tool · plug in an MCP server
**Example:** Instead of writing tools per app, we expose them once via an MCP server.
**Difficulty:** 3 · **Interview use:** Modern agent stack question.

### 20. tool registry
**Definition:** A central list of tools available to the agent, with their schemas.
**Collocations:** tool registry · register a tool · dynamic tool list
**Example:** The tool registry loads from a config file at startup.
**Difficulty:** 2 · **Interview use:** Tool architecture.

---

## Group 3 — RAG (10 terms)

### 21. RAG
**Definition:** Retrieval-Augmented Generation — find relevant text, then put it in the prompt before generating.
**Collocations:** RAG pipeline · do RAG · RAG over the docs
**Example:** We use RAG so the model answers from our docs, not from its training data.
**Difficulty:** 1 · **Interview use:** "How do you ground answers in your data?" — top question.

### 22. embedding
**Definition:** A vector of numbers that represents the meaning of a piece of text.
**Collocations:** text embedding · embedding model · embed the chunks
**Example:** I embed every doc chunk so we can search by meaning, not by keyword.
**Difficulty:** 2 · **Interview use:** "How does semantic search work?" — common.

### 23. vector database
**Definition:** A database that stores embeddings and finds similar ones fast.
**Collocations:** vector DB · Pinecone / Weaviate · query the vector DB
**Example:** We store all chunk embeddings in a vector database for fast similarity search.
**Difficulty:** 2 · **Interview use:** RAG architecture questions.

### 24. semantic search
**Definition:** Search that uses meaning (via embeddings) instead of exact word match.
**Collocations:** semantic search · search by meaning · semantic results
**Example:** Semantic search finds "auto" results when you search for "car".
**Difficulty:** 2 · **Interview use:** "Semantic vs keyword search?" — common.

### 25. chunking
**Definition:** Splitting long documents into smaller pieces before embedding.
**Collocations:** chunk the doc · chunking strategy · chunk overlap
**Example:** I chunk docs at paragraph boundaries with 50-token overlap.
**Difficulty:** 2 · **Interview use:** RAG design questions.

### 26. chunk size
**Definition:** How big each chunk is — too small loses context, too big dilutes the match.
**Collocations:** chunk size · 500-token chunks · tune chunk size
**Example:** Chunk size of 500 tokens worked best in our eval.
**Difficulty:** 2 · **Interview use:** RAG tuning question.

### 27. retrieval
**Definition:** Finding the top relevant chunks from the vector DB given a query.
**Collocations:** retrieval step · retrieve top-k · retrieval quality
**Example:** Retrieval returned 5 chunks; we passed all of them to the model.
**Difficulty:** 2 · **Interview use:** RAG flow question.

### 28. reranking
**Definition:** A second model that re-orders the top retrieval results for better quality.
**Collocations:** reranker · rerank the results · cross-encoder rerank
**Example:** Adding a reranker bumped answer accuracy from 70 to 85 percent.
**Difficulty:** 3 · **Interview use:** Advanced RAG.

### 29. hybrid search
**Definition:** Combining keyword search and semantic search to get the best of both.
**Collocations:** hybrid search · BM25 + vectors · hybrid retrieval
**Example:** Hybrid search beat pure semantic for exact terms like product SKUs.
**Difficulty:** 3 · **Interview use:** Advanced retrieval question.

### 30. top-k
**Definition:** The k most similar chunks returned by the retrieval step.
**Collocations:** top-k · k=5 · raise k
**Example:** Raising top-k from 3 to 10 helped recall but used more context.
**Difficulty:** 1 · **Interview use:** RAG tuning.

---

## Group 4 — Memory (10 terms)

### 31. short-term memory
**Definition:** What the agent remembers within the current conversation or task.
**Collocations:** short-term memory · within-session memory · in-context memory
**Example:** Short-term memory is just the messages still in the context window.
**Difficulty:** 2 · **Interview use:** Memory design questions.

### 32. long-term memory
**Definition:** What the agent remembers across sessions, stored outside the context window.
**Collocations:** long-term memory · persistent memory · memory store
**Example:** Long-term memory lets the agent remember the user's name next time.
**Difficulty:** 2 · **Interview use:** Memory architecture.

### 33. conversation history
**Definition:** The list of past user and assistant messages.
**Collocations:** conversation history · trim the history · save the history
**Example:** We send the last 10 turns of conversation history each request.
**Difficulty:** 1 · **Interview use:** Chat design.

### 34. summarization
**Definition:** Compressing long history into a short summary that keeps the key facts.
**Collocations:** summarize the history · rolling summary · summary checkpoint
**Example:** When the conversation grows past 50 turns, we summarize the early part.
**Difficulty:** 2 · **Interview use:** Context management.

### 35. compaction
**Definition:** Shrinking a long conversation or trace by summarizing or dropping content.
**Collocations:** compact the context · auto-compaction · compaction step
**Example:** Compaction keeps the agent running on very long tasks by trimming old turns.
**Difficulty:** 3 · **Interview use:** Long-running agent design.

### 36. context window management
**Definition:** Deciding what to keep, drop, or summarize so the prompt fits in the window.
**Collocations:** context management · stay under the limit · prune the context
**Example:** Context window management is the hardest part of building a real agent.
**Difficulty:** 3 · **Interview use:** Agent depth question.

### 37. memory store
**Definition:** The database or file where long-term memory lives.
**Collocations:** memory store · write to memory · read from memory
**Example:** The memory store is a small Postgres table with one row per fact.
**Difficulty:** 2 · **Interview use:** Memory architecture.

### 38. recall
**Definition:** Bringing a relevant memory back into the prompt at the right time.
**Collocations:** recall the memory · poor recall · trigger recall
**Example:** The agent recalled an earlier note about the user's timezone.
**Difficulty:** 2 · **Interview use:** Memory questions.

### 39. episodic memory
**Definition:** Memory of specific events — "yesterday the user said X".
**Collocations:** episodic memory · remember the event · episode
**Example:** Episodic memory lets the agent say "you asked about this yesterday".
**Difficulty:** 3 · **Interview use:** Advanced memory.

### 40. semantic memory
**Definition:** Memory of general facts — "the user prefers TypeScript".
**Collocations:** semantic memory · stored fact · general knowledge memory
**Example:** Semantic memory holds preferences and stable facts, not events.
**Difficulty:** 3 · **Interview use:** Memory architecture.

---

## Group 5 — Multi-agent & Orchestration (10 terms)

### 41. orchestrator
**Definition:** The component that decides which agent or step runs next.
**Collocations:** orchestrator · orchestrate the agents · top-level orchestrator
**Example:** The orchestrator routes the user's question to either the search agent or the code agent.
**Difficulty:** 2 · **Interview use:** Multi-agent design.

### 42. sub-agent
**Definition:** A smaller, specialized agent that runs inside a bigger one.
**Collocations:** sub-agent · spawn a sub-agent · sub-agent for X
**Example:** The main agent spawns a sub-agent for the test-running task to keep its context clean.
**Difficulty:** 2 · **Interview use:** Architecture questions.

### 43. hand-off
**Definition:** Passing control from one agent to another, with context.
**Collocations:** hand off to · hand-off · clean hand-off
**Example:** The intake agent hands off to the billing agent once it knows the topic.
**Difficulty:** 2 · **Interview use:** Multi-agent flow questions.

### 44. agent-to-agent
**Definition:** Communication directly between two agents, often via messages.
**Collocations:** agent-to-agent · A2A communication · agent message
**Example:** Agent-to-agent messages let the planner ask the executor for an update.
**Difficulty:** 3 · **Interview use:** Advanced architecture.

### 45. delegation
**Definition:** One agent giving a subtask to another instead of doing it itself.
**Collocations:** delegate to · delegation step · delegate the task
**Example:** The senior agent delegates the file-reading to a cheaper junior agent.
**Difficulty:** 2 · **Interview use:** Multi-agent design.

### 46. supervisor pattern
**Definition:** One agent oversees others, checks their work, and intervenes when needed.
**Collocations:** supervisor pattern · supervisor agent · review step
**Example:** A supervisor agent reviews the code agent's diff before applying changes.
**Difficulty:** 3 · **Interview use:** Reliability and safety design.

### 47. planner-executor
**Definition:** A pattern with one agent that makes a plan and another that runs each step.
**Collocations:** planner-executor · planner agent · executor agent
**Example:** Planner-executor keeps planning costs low by using a small model for execution.
**Difficulty:** 3 · **Interview use:** Architecture question.

### 48. agent graph
**Definition:** A directed graph where nodes are agents or steps and edges are flows between them.
**Collocations:** agent graph · LangGraph · graph of agents
**Example:** The agent graph has a "search" node and an "answer" node connected by a condition.
**Difficulty:** 3 · **Interview use:** Modern agent frameworks.

### 49. multi-turn
**Definition:** A conversation that takes many rounds of user and assistant messages.
**Collocations:** multi-turn chat · multi-turn task · across turns
**Example:** Multi-turn tasks need careful memory management.
**Difficulty:** 1 · **Interview use:** Setup term.

### 50. conversation state
**Definition:** All the data carried across turns — history, variables, user info, scratchpad.
**Collocations:** conversation state · state object · persist the state
**Example:** We persist conversation state in Redis so a refresh does not lose it.
**Difficulty:** 2 · **Interview use:** Architecture questions.

---

## Group 6 — Eval & Observability for Agents (15 terms)

### 51. agent trace
**Definition:** A full record of what an agent did — every prompt, every tool call, every result.
**Collocations:** agent trace · capture the trace · replay the trace
**Example:** I opened the agent trace and saw it called the wrong tool at step 3.
**Difficulty:** 2 · **Interview use:** "How do you debug an agent?" — top question.

### 52. span
**Definition:** One step inside a trace — like a single tool call or model call.
**Collocations:** span · trace and span · root span · span duration
**Example:** Each tool call is a span; spans together make the trace.
**Difficulty:** 2 · **Interview use:** Observability questions.

### 53. tool call accuracy
**Definition:** How often the agent picks the right tool with the right arguments.
**Collocations:** tool call accuracy · arg accuracy · wrong tool rate
**Example:** Tool call accuracy is our top metric for agent quality.
**Difficulty:** 2 · **Interview use:** Eval question.

### 54. task completion rate
**Definition:** The share of tasks the agent finishes correctly end to end.
**Collocations:** task completion rate · success rate · solved rate
**Example:** Task completion rate went from 40 percent to 65 percent after we added reflection.
**Difficulty:** 2 · **Interview use:** Agent metrics question.

### 55. success rate
**Definition:** The percent of runs that hit the goal.
**Collocations:** success rate · raise success rate · baseline success
**Example:** Our baseline success rate on the eval set is 55 percent.
**Difficulty:** 1 · **Interview use:** General eval question.

### 56. hallucination in tools
**Definition:** The model invents a tool that doesn't exist or invents arguments.
**Collocations:** hallucinated tool · made-up parameter · invalid tool call
**Example:** A hallucinated tool call broke the agent — we now validate every call.
**Difficulty:** 2 · **Interview use:** Reliability question.

### 57. prompt leak
**Definition:** When the model accidentally reveals the system prompt or internal instructions.
**Collocations:** prompt leak · leak the system prompt · defend against leaks
**Example:** A user found a prompt leak by asking the agent to "repeat your instructions".
**Difficulty:** 2 · **Interview use:** Safety questions.

### 58. prompt regression test
**Definition:** A test that runs after every prompt change to catch new failures.
**Collocations:** prompt regression test · regression suite · CI for prompts
**Example:** A prompt regression test caught a wording change that broke the JSON output.
**Difficulty:** 2 · **Interview use:** Engineering process question.

### 59. golden tasks
**Definition:** A small, hand-picked set of tasks the agent should always solve.
**Collocations:** golden tasks · golden eval · core tasks
**Example:** We will not ship a change that fails any of the 30 golden tasks.
**Difficulty:** 2 · **Interview use:** Eval design.

### 60. agent eval framework
**Definition:** A tool that runs many agent tasks, scores them, and shows results over time.
**Collocations:** eval framework · run the eval framework · custom eval framework
**Example:** Our agent eval framework runs nightly on 200 tasks and posts a score.
**Difficulty:** 2 · **Interview use:** Production engineering question.

### 61. telemetry
**Definition:** All the metrics, logs, and traces a running system emits.
**Collocations:** telemetry · emit telemetry · telemetry pipeline
**Example:** Our agent telemetry covers tool calls, latency, cost, and outcome per task.
**Difficulty:** 2 · **Interview use:** Observability questions.

### 62. cost per task
**Definition:** How much LLM money one full agent run costs.
**Collocations:** cost per task · drive down cost · cost ceiling
**Example:** Cost per task dropped from $0.50 to $0.08 after we cached the system prompt.
**Difficulty:** 2 · **Interview use:** Cost optimization questions.

### 63. latency per task
**Definition:** End-to-end time for one full agent run.
**Collocations:** latency per task · end-to-end latency · task duration
**Example:** Latency per task is 12s — we want to get it under 5s.
**Difficulty:** 2 · **Interview use:** Performance questions.

### 64. replay a trace
**Definition:** Re-running an agent with the same inputs and the same tool results, to debug.
**Collocations:** replay the trace · trace replay · deterministic replay
**Example:** Trace replay let me reproduce the bug without spending more tokens.
**Difficulty:** 3 · **Interview use:** Debugging depth question.

### 65. debug an agent
**Definition:** Finding why an agent did the wrong thing — usually by reading the trace.
**Collocations:** debug the agent · debug session · trace-based debugging
**Example:** I debugged the agent by reading the trace and pinpointed step 7 as the error.
**Difficulty:** 2 · **Interview use:** Debugging stories.
