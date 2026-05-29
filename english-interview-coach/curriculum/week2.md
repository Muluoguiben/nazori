# Week 2 Seed Vocabulary: React + State

65 terms in 6 groups. Each one shows: simple meaning, common word pairings, example sentence, difficulty (1 = easy, 3 = hard), and when it comes up in interviews.

---

## Group 1 — React Fundamentals (12 terms)

### 1. component
**Definition:** A small piece of UI that you can reuse, written as a function or a class.
**Collocations:** functional component · component tree · reusable component
**Example:** I split the page into a `Header` and a `Sidebar` component.
**Difficulty:** 1 · **Interview use:** Basic — used in every React answer.

### 2. JSX
**Definition:** A syntax that lets you write HTML-like code inside JavaScript.
**Collocations:** JSX expression · return JSX · JSX is compiled to `React.createElement`
**Example:** The `return` block uses JSX to describe the markup.
**Difficulty:** 1 · **Interview use:** "What is JSX?" — basic warm-up question.

### 3. props
**Definition:** Inputs passed from a parent component to a child component.
**Collocations:** pass props · destructure props · prop drilling · default props
**Example:** I passed the `user` object as a prop to the `Avatar` component.
**Difficulty:** 1 · **Interview use:** Foundation — talked about constantly.

### 4. children
**Definition:** Whatever you put between the opening and closing tags of a component.
**Collocations:** render children · children prop · pass children
**Example:** The `Card` component renders `{children}` inside a box.
**Difficulty:** 1 · **Interview use:** Comes up in component composition questions.

### 5. fragment
**Definition:** A wrapper that groups elements without adding extra HTML.
**Collocations:** React fragment · short syntax `<>...</>`  · return a fragment
**Example:** I used a fragment to return two sibling elements.
**Difficulty:** 1 · **Interview use:** Easy point — shows you avoid div soup.

### 6. conditional rendering
**Definition:** Showing different UI based on a condition.
**Collocations:** conditional rendering · render if · short-circuit `&&` · ternary
**Example:** I used conditional rendering to show a spinner while loading.
**Difficulty:** 1 · **Interview use:** Basic but expected in coding rounds.

### 7. list rendering
**Definition:** Turning an array into a list of elements with `.map()`.
**Collocations:** map over the list · render a list · list of items
**Example:** I rendered the user list by mapping over the array.
**Difficulty:** 1 · **Interview use:** Always shown in code samples.

### 8. key prop
**Definition:** A unique value React uses to track each item in a list.
**Collocations:** stable key · unique key · key warning · don't use index as key
**Example:** I used the user's id as the key, not the array index.
**Difficulty:** 2 · **Interview use:** "Why does key matter?" — classic question.

### 9. ref
**Definition:** A way to point to a real DOM element or hold a value that does not cause re-renders.
**Collocations:** create a ref · attach a ref · forward a ref · ref callback
**Example:** I used a ref to focus the input after the page loaded.
**Difficulty:** 2 · **Interview use:** Comes up with focus, scroll, and animation questions.

### 10. portal
**Definition:** A way to render a child into a different part of the DOM tree.
**Collocations:** React portal · render into a portal · modal portal
**Example:** I used a portal so the modal renders outside the parent's overflow.
**Difficulty:** 2 · **Interview use:** Modal and tooltip questions.

### 11. error boundary
**Definition:** A component that catches errors from its children so the app does not crash.
**Collocations:** error boundary · wrap in an error boundary · fallback UI
**Example:** I wrapped the chart in an error boundary so a render bug stays contained.
**Difficulty:** 2 · **Interview use:** "How do you handle render errors?" — common.

### 12. strict mode
**Definition:** A dev-only wrapper that double-invokes some functions to surface bugs early.
**Collocations:** strict mode · wrap in StrictMode · strict mode double-render
**Example:** Strict mode helped me find an effect that ran twice on mount.
**Difficulty:** 2 · **Interview use:** "Why does my effect run twice?" — debugging question.

---

## Group 2 — Hooks (14 terms)

### 13. useState
**Definition:** A hook that gives a component its own piece of state.
**Collocations:** call useState · setter function · initial state
**Example:** I called `useState(0)` to hold the counter value.
**Difficulty:** 1 · **Interview use:** Basic — used in every React code sample.

### 14. useEffect
**Definition:** A hook that runs side effects after render, with optional cleanup.
**Collocations:** useEffect runs after render · effect with cleanup · effect dependencies
**Example:** I used `useEffect` to fetch data after the component mounted.
**Difficulty:** 2 · **Interview use:** Top-3 most-asked hook question.

### 15. useReducer
**Definition:** A hook for state that has many actions or complex updates.
**Collocations:** useReducer · dispatch an action · reducer function
**Example:** I switched from `useState` to `useReducer` once the form had 8 fields.
**Difficulty:** 2 · **Interview use:** "When useReducer over useState?" — common.

### 16. useContext
**Definition:** A hook that reads a value shared by all components under a provider.
**Collocations:** read context · provide context · context value
**Example:** I used `useContext` to read the current theme without passing props.
**Difficulty:** 2 · **Interview use:** Pairs with "prop drilling" questions.

### 17. useRef
**Definition:** A hook that holds a value or a DOM ref across renders without causing re-renders.
**Collocations:** useRef for DOM · useRef for a mutable value · ref.current
**Example:** I used `useRef` to keep the timer id across renders.
**Difficulty:** 2 · **Interview use:** "Why does my variable reset every render?" — debugging.

### 18. useMemo
**Definition:** A hook that remembers a calculated value between renders.
**Collocations:** memoize a value · useMemo for expensive calc · dependency array
**Example:** I used `useMemo` to skip the sort when the data hadn't changed.
**Difficulty:** 2 · **Interview use:** "When to useMemo vs useCallback?" — common.

### 19. useCallback
**Definition:** A hook that remembers a function between renders, so child props stay stable.
**Collocations:** useCallback · stable callback · referential equality
**Example:** I wrapped the onClick handler in `useCallback` so the memoized child didn't re-render.
**Difficulty:** 3 · **Interview use:** Often misused — interviewers probe on this.

### 20. useId
**Definition:** A hook that gives a unique id, safe for server-side rendering.
**Collocations:** useId · accessible label id · SSR-safe id
**Example:** I used `useId` to link the label and input by id.
**Difficulty:** 2 · **Interview use:** Accessibility + SSR questions.

### 21. useLayoutEffect
**Definition:** Like `useEffect` but runs before the browser paints, so the user does not see a flash.
**Collocations:** useLayoutEffect · blocks paint · measure layout
**Example:** I used `useLayoutEffect` to measure the element before painting.
**Difficulty:** 3 · **Interview use:** "useEffect vs useLayoutEffect?" — depth check.

### 22. useTransition
**Definition:** A hook that marks state updates as low-priority so the UI stays responsive.
**Collocations:** useTransition · `startTransition` · pending state
**Example:** I wrapped the filter update in `useTransition` so typing stayed smooth.
**Difficulty:** 3 · **Interview use:** Concurrent rendering question.

### 23. useDeferredValue
**Definition:** A hook that returns a slightly stale value, used to delay expensive work.
**Collocations:** useDeferredValue · stale value · defer the render
**Example:** I used `useDeferredValue` so the heavy chart did not re-render on every keystroke.
**Difficulty:** 3 · **Interview use:** Less common, but shows depth.

### 24. custom hook
**Definition:** A function that uses other hooks and starts with `use`, so you can share logic.
**Collocations:** write a custom hook · `useX` naming · share logic with a hook
**Example:** I wrote a `useDebounce` custom hook to reuse the debounce logic.
**Difficulty:** 2 · **Interview use:** "How do you share logic between components?" — common.

### 25. rules of hooks
**Definition:** Two rules: call hooks only at the top level, and only from React functions.
**Collocations:** rules of hooks · break the rules · conditional hook call
**Example:** I had to refactor — calling a hook inside an `if` broke the rules of hooks.
**Difficulty:** 2 · **Interview use:** "Why can't you call hooks inside an if?" — classic.

### 26. dependency array
**Definition:** The list passed as the second argument to hooks like `useEffect` and `useMemo`.
**Collocations:** dependency array · empty deps · missing dependency warning
**Example:** I added `count` to the dependency array so the effect re-ran when it changed.
**Difficulty:** 2 · **Interview use:** Common source of bugs — interviewers test this.

---

## Group 3 — Rendering & Performance (11 terms)

### 27. reconciliation
**Definition:** React's process of comparing the new tree to the old one to decide what to update.
**Collocations:** reconciliation · diff the tree · reconcile changes
**Example:** Bad keys hurt reconciliation by making React re-create items.
**Difficulty:** 3 · **Interview use:** Senior-leaning deep-dive question.

### 28. virtual DOM
**Definition:** A lightweight copy of the UI tree that React uses to find what changed.
**Collocations:** virtual DOM · diff the virtual DOM · VDOM
**Example:** React diffs the virtual DOM to find the smallest set of real DOM updates.
**Difficulty:** 2 · **Interview use:** "What is the virtual DOM?" — basic warm-up.

### 29. re-render
**Definition:** When a component runs its function again to produce new output.
**Collocations:** trigger a re-render · unnecessary re-render · re-render on state change
**Example:** The parent re-rendered, which caused all children to re-render too.
**Difficulty:** 1 · **Interview use:** Core of every perf question.

### 30. batching
**Definition:** Grouping many state updates into one re-render for performance.
**Collocations:** batched updates · automatic batching · batch across awaits
**Example:** React 18 batches updates across `await`, so two `setState` calls cause one render.
**Difficulty:** 2 · **Interview use:** "What's new in React 18?" — common.

### 31. React.memo
**Definition:** A wrapper that skips a re-render when the component's props have not changed.
**Collocations:** wrap in React.memo · memoized component · shallow compare props
**Example:** I wrapped the heavy `Row` in `React.memo` to skip re-renders.
**Difficulty:** 2 · **Interview use:** Performance optimization questions.

### 32. unnecessary render
**Definition:** A render that produced the same output and could have been skipped.
**Collocations:** unnecessary render · wasted render · skip the render
**Example:** Passing a new object literal each render caused unnecessary renders.
**Difficulty:** 2 · **Interview use:** "How would you debug slow re-renders?" — common.

### 33. fiber
**Definition:** React's internal data structure for tracking work units in the tree.
**Collocations:** fiber tree · fiber node · React fiber
**Example:** Fiber lets React pause and resume rendering work.
**Difficulty:** 3 · **Interview use:** Senior-only deep-dive.

### 34. commit phase
**Definition:** The step where React applies changes to the real DOM.
**Collocations:** commit phase · commit changes · effects run after commit
**Example:** `useLayoutEffect` runs after commit, before the browser paints.
**Difficulty:** 3 · **Interview use:** Paired with render phase questions.

### 35. render phase
**Definition:** The step where React calls your component to build the new tree.
**Collocations:** render phase · pure during render · no side effects in render
**Example:** Side effects belong in `useEffect`, not in the render phase.
**Difficulty:** 3 · **Interview use:** "Why must render be pure?" — depth question.

### 36. concurrent rendering
**Definition:** React 18's ability to pause and resume render work to keep the UI responsive.
**Collocations:** concurrent rendering · concurrent features · interruptible render
**Example:** Concurrent rendering lets a transition update yield to a higher-priority event.
**Difficulty:** 3 · **Interview use:** React 18 deep-dive.

### 37. React Profiler
**Definition:** A dev tool that shows how long each component took to render.
**Collocations:** open the Profiler · record a session · flame chart
**Example:** I used the Profiler to find the component that took 80ms to render.
**Difficulty:** 2 · **Interview use:** "How do you debug perf?" — answer mentions Profiler.

---

## Group 4 — State Management (10 terms)

### 38. lifting state up
**Definition:** Moving state to the closest common parent so siblings can share it.
**Collocations:** lift state up · shared parent state · lift the state
**Example:** I lifted the search query state up to the parent so both panels could read it.
**Difficulty:** 2 · **Interview use:** Classic React pattern question.

### 39. prop drilling
**Definition:** Passing props through many layers just to reach a deep child.
**Collocations:** prop drilling · drill props down · escape prop drilling
**Example:** We used Context to escape prop drilling through 5 layers.
**Difficulty:** 2 · **Interview use:** "How do you avoid prop drilling?" — common.

### 40. global state
**Definition:** State shared across many parts of the app, not owned by one component.
**Collocations:** global state · global store · pull from global state
**Example:** The current user lives in global state since most pages need it.
**Difficulty:** 1 · **Interview use:** State management questions.

### 41. local state
**Definition:** State owned by one component, not shared with others.
**Collocations:** local state · component-local · keep state local
**Example:** I kept the modal's open/closed flag as local state.
**Difficulty:** 1 · **Interview use:** "When local vs global state?" — common.

### 42. derived state
**Definition:** State you can calculate from other state — usually you should not store it.
**Collocations:** derived state · derive on render · avoid duplicate state
**Example:** The filtered list is derived state, so I calculate it on render.
**Difficulty:** 2 · **Interview use:** "What's wrong with this state?" — coding question.

### 43. single source of truth
**Definition:** Each piece of data should live in exactly one place.
**Collocations:** single source of truth · one source of truth · avoid duplication
**Example:** I removed the duplicate state to keep one source of truth.
**Difficulty:** 1 · **Interview use:** Architecture question.

### 44. immutable update
**Definition:** Making a new object or array instead of changing the old one.
**Collocations:** immutable update · spread to copy · structural sharing
**Example:** I spread the array into a new one to keep the update immutable.
**Difficulty:** 2 · **Interview use:** "Why does my state update not trigger a re-render?" — common bug.

### 45. optimistic update
**Definition:** Updating the UI right away, before the server confirms, to feel fast.
**Collocations:** optimistic update · roll back on error · optimistic UI
**Example:** I added the comment to the list optimistically, and removed it if the request failed.
**Difficulty:** 2 · **Interview use:** UX-focused question.

### 46. selector
**Definition:** A small function that picks a piece of state out of a store.
**Collocations:** write a selector · memoized selector · select from the store
**Example:** The selector returns just the user's name from the global store.
**Difficulty:** 2 · **Interview use:** Redux/Zustand questions.

### 47. state library
**Definition:** A library that helps manage shared state — like Redux, Zustand, or Jotai.
**Collocations:** state library · pick a state library · global state library
**Example:** We picked Zustand because it has less boilerplate than Redux.
**Difficulty:** 2 · **Interview use:** "Which state library and why?" — common.

---

## Group 5 — Effects & Data Fetching (12 terms)

### 48. cleanup function
**Definition:** The function returned from `useEffect` that runs before the next effect or on unmount.
**Collocations:** cleanup function · clean up the listener · unsubscribe in cleanup
**Example:** I returned a cleanup function to remove the event listener.
**Difficulty:** 2 · **Interview use:** "How do you avoid memory leaks?" — common.

### 49. stale closure
**Definition:** When a callback uses an old value of state or props because it captured them earlier.
**Collocations:** stale closure · captured the old value · stale state in callback
**Example:** The setInterval had a stale closure, so it always logged the initial count.
**Difficulty:** 3 · **Interview use:** Classic bug-find question.

### 50. race condition in effect
**Definition:** When two async effects finish out of order and the wrong result wins.
**Collocations:** race condition · cancel on cleanup · ignore the stale response
**Example:** I added a `cancelled` flag in cleanup to fix the fetch race condition.
**Difficulty:** 3 · **Interview use:** "What's wrong with this fetch?" — coding question.

### 51. effect dependency bug
**Definition:** Forgetting to include a value in the dependency array, so the effect uses stale data.
**Collocations:** missing dependency · lint warning · exhaustive-deps rule
**Example:** ESLint warned me about a missing dependency, which would have caused stale data.
**Difficulty:** 2 · **Interview use:** Common bug source — interviewers test this.

### 52. data fetching
**Definition:** Getting data from a server, usually in `useEffect` or a data library.
**Collocations:** data fetching · fetch on mount · refetch on focus
**Example:** I moved the data fetching from `useEffect` to React Query.
**Difficulty:** 1 · **Interview use:** Setup for the next several questions.

### 53. cache invalidation
**Definition:** Marking cached data as stale so the next read fetches fresh data.
**Collocations:** invalidate the cache · cache invalidation · refetch after mutate
**Example:** After the user updated their profile, I invalidated the user cache.
**Difficulty:** 2 · **Interview use:** React Query / SWR questions.

### 54. data library
**Definition:** A library like React Query or SWR that handles caching, refetching, and loading state for data.
**Collocations:** data library · React Query · SWR · `useQuery` / `useSWR`
**Example:** A data library saves you from writing the same `loading/error/data` code in every component.
**Difficulty:** 2 · **Interview use:** "Why use React Query?" — common.

### 55. server component
**Definition:** A React component that runs only on the server and sends HTML to the client.
**Collocations:** server component · RSC · render on the server
**Example:** I moved the heavy data fetch into a server component to avoid sending the library to the browser.
**Difficulty:** 3 · **Interview use:** Next.js App Router questions.

### 56. client component
**Definition:** A React component that runs in the browser and can use state and effects.
**Collocations:** client component · `"use client"` directive · interactive component
**Example:** I added `"use client"` to make the form a client component.
**Difficulty:** 2 · **Interview use:** Pairs with server component questions.

### 57. Suspense
**Definition:** A React feature that shows a fallback UI while a child is waiting for something.
**Collocations:** wrap in Suspense · Suspense fallback · Suspense for data
**Example:** I wrapped the chart in `<Suspense fallback={<Spinner />}>` while it loaded.
**Difficulty:** 3 · **Interview use:** Modern React patterns.

### 58. streaming render
**Definition:** Sending HTML to the browser in pieces as parts of the page become ready.
**Collocations:** streaming render · stream HTML · partial response
**Example:** Streaming render let the header appear before the slow chart finished.
**Difficulty:** 3 · **Interview use:** Performance and SSR questions.

### 59. lazy loading
**Definition:** Loading code or data only when it is needed, to make the first load faster.
**Collocations:** lazy load · `React.lazy` · dynamic import · code splitting
**Example:** I lazy-loaded the chart library so the home page stayed small.
**Difficulty:** 2 · **Interview use:** Bundle-size questions.

---

## Group 6 — Forms & Events (6 terms)

### 60. synthetic event
**Definition:** A wrapper React puts around browser events so they behave the same across browsers.
**Collocations:** synthetic event · event.preventDefault() · event pooling (old React)
**Example:** I called `e.preventDefault()` on the synthetic event to stop the form submit.
**Difficulty:** 2 · **Interview use:** "What is a synthetic event?" — basic.

### 61. controlled component
**Definition:** A form input whose value is driven by React state.
**Collocations:** controlled input · value and onChange · controlled form
**Example:** The text input is controlled, so I read the value from state.
**Difficulty:** 1 · **Interview use:** "Controlled vs uncontrolled?" — classic.

### 62. uncontrolled component
**Definition:** A form input whose value lives in the DOM, read with a ref.
**Collocations:** uncontrolled input · read via ref · `defaultValue`
**Example:** I made the file input uncontrolled and read it via a ref on submit.
**Difficulty:** 2 · **Interview use:** Pairs with controlled-component question.

### 63. form library
**Definition:** A library like react-hook-form or Formik that helps with form state and validation.
**Collocations:** form library · react-hook-form · validation rules
**Example:** I switched to react-hook-form because the custom form code was getting messy.
**Difficulty:** 2 · **Interview use:** "How do you handle big forms?" — common.

### 64. event bubbling
**Definition:** When an event fires on a child and then travels up to its parents.
**Collocations:** event bubbling · stop propagation · bubbles up
**Example:** I called `e.stopPropagation()` to stop the click from bubbling to the row.
**Difficulty:** 2 · **Interview use:** Event handling bugs in coding rounds.

### 65. event delegation
**Definition:** Attaching one event listener to a parent to handle events from many children.
**Collocations:** event delegation · delegate to the parent · single listener
**Example:** React uses event delegation by attaching one listener at the root.
**Difficulty:** 2 · **Interview use:** "How does React handle events?" — depth question.
