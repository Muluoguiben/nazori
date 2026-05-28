# Week 1 Seed Vocabulary: JavaScript / TypeScript / Async

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — TypeScript Types (15 terms)

### 1. type annotation
**Definition:** Writing the type of a value next to it, like `name: string`.
**Collocations:** add a type annotation · type-annotated parameter
**Example:** I added a type annotation so the editor could catch wrong inputs.
**Difficulty:** 1 · **Interview use:** Basic — used when explaining any TypeScript code.

### 2. interface
**Definition:** A named shape that an object must follow.
**Collocations:** define an interface · implement an interface · extend an interface
**Example:** The `User` interface has `id`, `name`, and `email` fields.
**Difficulty:** 1 · **Interview use:** Comes up when comparing with `type` aliases.

### 3. type alias
**Definition:** A name you give to a type so you can reuse it.
**Collocations:** create a type alias · type alias for X
**Example:** I made a type alias `UserId` for `string`.
**Difficulty:** 1 · **Interview use:** "What's the difference between interface and type?" — classic question.

### 4. union type
**Definition:** A type that can be one of several types, written with `|`.
**Collocations:** a union of X and Y · union type
**Example:** The function takes a union of `string | number`.
**Difficulty:** 2 · **Interview use:** Setup for talking about narrowing.

### 5. intersection type
**Definition:** A type that has all fields from several types, written with `&`.
**Collocations:** intersection of A and B · intersect two types
**Example:** `User & Admin` has fields from both.
**Difficulty:** 2 · **Interview use:** Pairs with union type questions.

### 6. literal type
**Definition:** A type that is one exact value, like `"GET"` or `42`.
**Collocations:** string literal type · literal value
**Example:** The status field uses a literal type: `"open" | "closed"`.
**Difficulty:** 2 · **Interview use:** Often shown in discriminated union examples.

### 7. generic
**Definition:** A type that takes a type parameter, so it works with many types.
**Collocations:** generic function · generic type · pass a type argument
**Example:** I wrote a generic `wrap<T>(value: T)` that works for any type.
**Difficulty:** 3 · **Interview use:** "Can you write a generic function?" — very common.

### 8. type guard
**Definition:** A small check that tells TypeScript what a value's type is.
**Collocations:** write a type guard · user-defined type guard
**Example:** I wrote a type guard `isError(x): x is Error`.
**Difficulty:** 3 · **Interview use:** Comes up with narrowing and runtime type checks.

### 9. narrowing
**Definition:** Making TypeScript see a value as a more exact type than before.
**Collocations:** narrow down the type · narrow X to Y · type narrowing
**Example:** After `typeof x === "string"`, the type was narrowed to `string`.
**Difficulty:** 2 · **Interview use:** Key word for explaining type guards.

### 10. discriminated union
**Definition:** A union where each option has a shared field that tells them apart.
**Collocations:** discriminated union · tag field · the discriminator
**Example:** Each shape has a `kind` field, so the union is discriminated.
**Difficulty:** 3 · **Interview use:** Shows you understand real-world TS patterns.

### 11. utility type
**Definition:** Built-in helper types like `Partial`, `Pick`, `Omit`.
**Collocations:** use a utility type · Partial of X · Pick from Y
**Example:** I used `Partial<User>` so all fields became optional.
**Difficulty:** 2 · **Interview use:** Quick way to show TS fluency.

### 12. readonly
**Definition:** A field or array that cannot be changed after it is set.
**Collocations:** readonly field · readonly array · mark X as readonly
**Example:** The config object is readonly to stop other code from changing it.
**Difficulty:** 1 · **Interview use:** Pairs with immutability talk.

### 13. type assertion
**Definition:** Telling TypeScript to trust you about a value's type, using `as`.
**Collocations:** type assertion · cast with `as` · assert as X
**Example:** I used `as HTMLInputElement` because I knew the element type.
**Difficulty:** 2 · **Interview use:** Often a follow-up: "When should you avoid `as`?"

### 14. unknown vs any
**Definition:** `unknown` is safe and must be checked; `any` turns off type checking.
**Collocations:** prefer unknown over any · avoid any
**Example:** I used `unknown` so the caller had to check the type first.
**Difficulty:** 2 · **Interview use:** "When would you use `unknown`?" — common.

### 15. never type
**Definition:** A type for values that can never happen.
**Collocations:** return never · exhaustive check with never
**Example:** The default branch returned `never` to prove all cases were handled.
**Difficulty:** 3 · **Interview use:** Shows depth — used in exhaustive switch checks.

---

## Group 2 — JavaScript Core (15 terms)

### 16. closure
**Definition:** A function that remembers variables from where it was made.
**Collocations:** create a closure · closure over X · captured variable
**Example:** The counter uses a closure to keep its count private.
**Difficulty:** 2 · **Interview use:** Top-3 most-asked JS question.

### 17. hoisting
**Definition:** Moving variable and function names to the top of their scope before code runs.
**Collocations:** variable hoisting · function hoisting · `let` is not hoisted (the same way)
**Example:** Function hoisting let me call `init()` before its declaration.
**Difficulty:** 2 · **Interview use:** Often paired with `var` vs `let` questions.

### 18. lexical scope
**Definition:** Scope decided by where code is written, not where it is called.
**Collocations:** lexical scope · lexically scoped · enclosing scope
**Example:** Arrow functions use the lexical scope of `this`.
**Difficulty:** 2 · **Interview use:** Setup for closure and `this` questions.

### 19. this binding
**Definition:** What `this` points to when a function runs.
**Collocations:** bind `this` · lose the `this` binding · explicit binding
**Example:** I used `bind(this)` so the callback kept the right `this`.
**Difficulty:** 3 · **Interview use:** Classic tricky question.

### 20. prototype chain
**Definition:** The list of objects JavaScript checks when looking up a property.
**Collocations:** walk the prototype chain · prototype-based inheritance
**Example:** `toString` is found by walking up the prototype chain.
**Difficulty:** 3 · **Interview use:** Less common now, but still asked.

### 21. destructuring
**Definition:** Taking values out of an object or array into new names.
**Collocations:** destructure the response · destructuring assignment
**Example:** I destructured `{ id, name }` from the user object.
**Difficulty:** 1 · **Interview use:** Used in almost every code sample.

### 22. spread operator
**Definition:** The `...` syntax that copies items out of an array or object.
**Collocations:** spread the array · spread into a new object
**Example:** I spread the old state into a new object to keep it immutable.
**Difficulty:** 1 · **Interview use:** Pairs with immutability questions.

### 23. rest parameter
**Definition:** The `...args` syntax that collects extra arguments into an array.
**Collocations:** rest parameter · rest args
**Example:** The function uses a rest parameter to take any number of inputs.
**Difficulty:** 1 · **Interview use:** Easy point to make about flexible APIs.

### 24. optional chaining
**Definition:** The `?.` operator that returns `undefined` instead of crashing on missing values.
**Collocations:** optional chaining · chain with `?.`
**Example:** I used optional chaining: `user?.profile?.name`.
**Difficulty:** 1 · **Interview use:** Comes up in safe-access patterns.

### 25. nullish coalescing
**Definition:** The `??` operator that picks a default only when the value is `null` or `undefined`.
**Collocations:** nullish coalescing · default with `??`
**Example:** I used `count ?? 0` to default only on null or undefined.
**Difficulty:** 2 · **Interview use:** "Why not just use `||`?" is a common follow-up.

### 26. truthy / falsy
**Definition:** Values that act like `true` or `false` in a condition.
**Collocations:** falsy value · truthy check · falsy bug
**Example:** `0` is falsy, so `if (count)` skipped zero by mistake.
**Difficulty:** 1 · **Interview use:** Common source of bugs in coding rounds.

### 27. reference vs value
**Definition:** Primitives are copied by value; objects are shared by reference.
**Collocations:** pass by reference · pass by value · reference equality
**Example:** Two objects with the same fields are not equal by reference.
**Difficulty:** 2 · **Interview use:** Comes up with `===` and React state.

### 28. shallow copy vs deep copy
**Definition:** Shallow copies the top level only; deep copies every nested level.
**Collocations:** shallow copy · deep copy · deep clone the object
**Example:** A shallow copy still shares the inner array, so changes leak.
**Difficulty:** 2 · **Interview use:** Important for state and Redux questions.

### 29. immutability
**Definition:** Never changing a value after it is made; always make a new one.
**Collocations:** keep state immutable · immutable update · mutation bug
**Example:** I returned a new array instead of mutating the old one.
**Difficulty:** 2 · **Interview use:** Central to React and functional style.

### 30. side effect
**Definition:** Anything a function does besides return a value, like network calls or writes.
**Collocations:** side effect · pure vs side-effectful · side effect inside a hook
**Example:** Logging is a side effect, so the function is not pure.
**Difficulty:** 2 · **Interview use:** Comes up in React `useEffect` and pure functions.

---

## Group 3 — Async & Concurrency (15 terms)

### 31. event loop
**Definition:** The system that runs your code and picks the next task to do.
**Collocations:** block the event loop · event loop tick · main thread
**Example:** Heavy work on the main thread blocks the event loop.
**Difficulty:** 3 · **Interview use:** Very common — be ready to draw it.

### 32. call stack
**Definition:** The list of functions that are running, each one inside the last.
**Collocations:** call stack · stack frame · stack overflow
**Example:** Deep recursion overflowed the call stack.
**Difficulty:** 2 · **Interview use:** Paired with event loop questions.

### 33. callback
**Definition:** A function you pass in, to be called later.
**Collocations:** pass a callback · callback function · callback fires
**Example:** I passed a callback to run after the file was read.
**Difficulty:** 1 · **Interview use:** Basic, but expected.

### 34. callback hell
**Definition:** Deeply nested callbacks that are hard to read.
**Collocations:** fall into callback hell · escape callback hell
**Example:** We refactored callback hell into async/await for clarity.
**Difficulty:** 1 · **Interview use:** Good story for "why Promises matter".

### 35. Promise
**Definition:** An object that stands for a value you will get later.
**Collocations:** return a Promise · chain Promises · resolved/rejected Promise
**Example:** `fetch` returns a Promise that resolves with the response.
**Difficulty:** 1 · **Interview use:** Foundation — must explain clearly.

### 36. resolve / reject
**Definition:** The two ways a Promise can finish: success or failure.
**Collocations:** resolve with X · reject with an error
**Example:** I resolved with the data, or rejected with a network error.
**Difficulty:** 1 · **Interview use:** Used when explaining how Promises work.

### 37. async / await
**Definition:** Keywords that let you write async code that reads like normal code.
**Collocations:** mark a function as async · await a Promise
**Example:** I used `await` to wait for the API response before continuing.
**Difficulty:** 1 · **Interview use:** Must use correctly in every coding round.

### 38. race condition
**Definition:** When two operations run at the same time and the result depends on which wins.
**Collocations:** hit a race condition · fix a race · race between X and Y
**Example:** We hit a race condition where two requests both created the same user.
**Difficulty:** 3 · **Interview use:** Common in debugging and system questions.

### 39. Promise.all
**Definition:** Runs many Promises at the same time and waits for all to finish.
**Collocations:** use Promise.all · all-settled · parallel requests
**Example:** I used `Promise.all` to fetch user and posts in parallel.
**Difficulty:** 2 · **Interview use:** "How would you speed this up?" — easy win.

### 40. Promise.race
**Definition:** Runs many Promises and returns the first one that finishes.
**Collocations:** Promise.race · race with a timeout
**Example:** I raced the fetch against a timeout Promise.
**Difficulty:** 2 · **Interview use:** Comes up with timeout patterns.

### 41. microtask vs macrotask
**Definition:** Two queues the event loop uses; microtasks run before the next macrotask.
**Collocations:** microtask queue · macrotask · `setTimeout` is a macrotask
**Example:** A Promise callback is a microtask, so it runs before `setTimeout(0)`.
**Difficulty:** 3 · **Interview use:** Deep-dive question — bonus points.

### 42. throttle
**Definition:** Letting a function run at most once every X milliseconds.
**Collocations:** throttle the handler · throttle to 200ms
**Example:** I throttled the scroll handler to once every 100ms.
**Difficulty:** 2 · **Interview use:** Performance and UX questions.

### 43. debounce
**Definition:** Waiting until calls stop for X milliseconds, then running once.
**Collocations:** debounce the input · debounce by 300ms
**Example:** I debounced the search input so it only fires after typing stops.
**Difficulty:** 2 · **Interview use:** "Throttle vs debounce?" — classic.

### 44. concurrency vs parallelism
**Definition:** Concurrency is many tasks in progress; parallelism is many running at the same instant.
**Collocations:** concurrent requests · parallel execution
**Example:** JavaScript has concurrency but not real parallelism on the main thread.
**Difficulty:** 3 · **Interview use:** Shows depth in async talk.

### 45. blocking vs non-blocking
**Definition:** Blocking code stops everything else; non-blocking lets other work continue.
**Collocations:** blocking call · non-blocking I/O
**Example:** `readFileSync` is blocking; `readFile` is non-blocking.
**Difficulty:** 2 · **Interview use:** Setup for Node.js questions.

---

## Group 4 — Functions & Patterns (10 terms)

### 46. pure function
**Definition:** A function that returns the same output for the same input and has no side effects.
**Collocations:** pure function · keep it pure · impure side effect
**Example:** `sum(a, b)` is pure because it only uses its inputs.
**Difficulty:** 1 · **Interview use:** Central to React and testing talk.

### 47. higher-order function
**Definition:** A function that takes or returns another function.
**Collocations:** higher-order function · returns a function · accepts a function
**Example:** `map` is a higher-order function because it takes a function.
**Difficulty:** 2 · **Interview use:** Common in functional-style questions.

### 48. arrow function
**Definition:** A short function syntax that does not bind its own `this`.
**Collocations:** arrow function · fat arrow · no own `this`
**Example:** I used an arrow function so `this` stayed the class instance.
**Difficulty:** 1 · **Interview use:** Pairs with `this` binding questions.

### 49. currying
**Definition:** Turning a function with many inputs into a chain of functions with one input each.
**Collocations:** curry a function · curried form
**Example:** `add(a)(b)` is the curried form of `add(a, b)`.
**Difficulty:** 3 · **Interview use:** FP-leaning teams may ask.

### 50. memoization
**Definition:** Saving the result of a function so the same input is fast next time.
**Collocations:** memoize the function · memoization cache
**Example:** I memoized the heavy calculation to avoid repeat work.
**Difficulty:** 2 · **Interview use:** Setup for React.memo and useMemo.

### 51. recursion
**Definition:** A function that calls itself to solve smaller pieces of a problem.
**Collocations:** recursive call · base case · recursion depth
**Example:** I walked the tree using recursion with a base case at leaves.
**Difficulty:** 2 · **Interview use:** Coding-round staple.

### 52. IIFE
**Definition:** A function that runs as soon as it is defined. Stands for "immediately invoked function expression".
**Collocations:** wrap in an IIFE · IIFE pattern
**Example:** Old code used an IIFE to keep variables private.
**Difficulty:** 2 · **Interview use:** History question — useful for module talk.

### 53. closure-over-loop bug
**Definition:** A common bug where all loop closures see the final value of a `var`.
**Collocations:** the classic `var` loop bug · use `let` to fix it
**Example:** Switching `var` to `let` fixed the closure-over-loop bug.
**Difficulty:** 3 · **Interview use:** Classic trick question.

### 54. bind / call / apply
**Definition:** Three ways to set `this` when calling a function.
**Collocations:** bind `this` · call with arguments · apply with an array
**Example:** I used `.bind(this)` to fix the event handler context.
**Difficulty:** 2 · **Interview use:** Older codebases still use these.

### 55. default parameter
**Definition:** A value used when an argument is `undefined`.
**Collocations:** default parameter · default to X
**Example:** The function uses a default parameter `limit = 10`.
**Difficulty:** 1 · **Interview use:** Simple but used often.

---

## Group 5 — Errors & Debugging (5 terms)

### 56. try / catch
**Definition:** A block that runs code and catches errors instead of crashing.
**Collocations:** wrap in try/catch · catch the error · re-throw
**Example:** I wrapped the parse in try/catch to handle bad JSON.
**Difficulty:** 1 · **Interview use:** Basic — used in every code sample.

### 57. throw an error
**Definition:** Stopping a function on purpose by raising an error.
**Collocations:** throw an error · throw a TypeError · throw if invalid
**Example:** I throw an error when the input is not a number.
**Difficulty:** 1 · **Interview use:** Pairs with try/catch talk.

### 58. stack trace
**Definition:** A list of function calls that shows where an error came from.
**Collocations:** read the stack trace · log the stack
**Example:** The stack trace pointed to the broken line in `parseUser`.
**Difficulty:** 1 · **Interview use:** Debugging story questions.

### 59. unhandled rejection
**Definition:** A Promise that fails but has no `.catch` to handle it.
**Collocations:** unhandled rejection · unhandledrejection event
**Example:** I added a handler for unhandled rejections to log them.
**Difficulty:** 2 · **Interview use:** Async error handling questions.

### 60. error boundary
**Definition:** A React component that catches errors from its children so the app does not crash.
**Collocations:** error boundary · wrap in an error boundary
**Example:** I added an error boundary around the chart so a render bug stays contained.
**Difficulty:** 2 · **Interview use:** Bridges into Week 2 (React). Preview only.

---

## Group 6 — Modules & Build (5 terms)

### 61. import / export
**Definition:** Syntax for sharing code between files.
**Collocations:** named import · re-export · import from
**Example:** I import `parse` from the helpers file.
**Difficulty:** 1 · **Interview use:** Used in every code sample.

### 62. default export vs named export
**Definition:** Default exports one main thing; named exports many things by name.
**Collocations:** default export · named export · star import
**Example:** I prefer named exports because they are easier to refactor.
**Difficulty:** 1 · **Interview use:** "Which do you prefer?" — common style question.

### 63. dynamic import
**Definition:** Loading a module at runtime with `import()`, returning a Promise.
**Collocations:** dynamic import · lazy load with import()
**Example:** I used a dynamic import to lazy-load the chart library.
**Difficulty:** 2 · **Interview use:** Comes up in performance questions.

### 64. tree shaking
**Definition:** A build step that removes code you never use, to make the bundle smaller.
**Collocations:** tree shaking · tree-shakeable · dead-code elimination
**Example:** Named exports help tree shaking remove unused functions.
**Difficulty:** 2 · **Interview use:** Bundle-size questions.

### 65. tsconfig (compile target)
**Definition:** The TypeScript settings file; `target` says which JS version to compile to.
**Collocations:** tsconfig · compile target · strict mode
**Example:** I set `target: es2020` so async/await is left as-is.
**Difficulty:** 2 · **Interview use:** Build/config questions.
