// Curriculum metadata + prompt-selection logic (pure: no React, no DB).
// Shared by lib/prompts.ts (typed adapter) and lib/prompts.test.mjs, mirroring
// the lib/stats.mjs <-> lib/db.ts split.

export const WEEKS = [1, 2, 3, 4, 5, 6];

export const WEEK_TITLES = {
  1: 'JavaScript / TypeScript / Async',
  2: 'React + State',
  3: 'Backend + API',
  4: 'System Design',
  5: 'LLM in Production',
  6: 'Agents + RAG',
};

// 36 topic tags in curriculum order, each mapped to its week + display label.
// Must stay in sync with prompts.json (every prompt.tag appears here exactly once).
export const TAGS_IN_ORDER = [
  'ts-types', 'js-core', 'async', 'functions', 'errors', 'modules',
  'react-core', 'hooks', 'react-perf', 'state', 'effects', 'forms',
  'http', 'auth', 'api-design', 'data-layer', 'networking', 'backend-prod',
  'architecture', 'caching', 'databases', 'queues', 'reliability', 'scaling',
  'llm-basics', 'prompting', 'llm-cost', 'llm-safety', 'llm-eval', 'llm-prod',
  'agents', 'tools', 'rag', 'memory', 'multi-agent', 'agent-eval',
];

export const TAG_META = {
  'ts-types': { week: 1, label: 'TypeScript Types' },
  'js-core': { week: 1, label: 'JavaScript Core' },
  async: { week: 1, label: 'Async & Concurrency' },
  functions: { week: 1, label: 'Functions & Patterns' },
  errors: { week: 1, label: 'Errors & Debugging' },
  modules: { week: 1, label: 'Modules & Build' },
  'react-core': { week: 2, label: 'React Fundamentals' },
  hooks: { week: 2, label: 'Hooks' },
  'react-perf': { week: 2, label: 'Rendering & Performance' },
  state: { week: 2, label: 'State Management' },
  effects: { week: 2, label: 'Effects & Data Fetching' },
  forms: { week: 2, label: 'Forms & Events' },
  http: { week: 3, label: 'HTTP & REST' },
  auth: { week: 3, label: 'Auth' },
  'api-design': { week: 3, label: 'API Design' },
  'data-layer': { week: 3, label: 'Data Layer' },
  networking: { week: 3, label: 'Networking & Protocols' },
  'backend-prod': { week: 3, label: 'Production Concerns' },
  architecture: { week: 4, label: 'Architecture Patterns' },
  caching: { week: 4, label: 'Caching' },
  databases: { week: 4, label: 'Databases at Scale' },
  queues: { week: 4, label: 'Async & Queues' },
  reliability: { week: 4, label: 'Reliability' },
  scaling: { week: 4, label: 'Scaling & Performance' },
  'llm-basics': { week: 5, label: 'LLM Basics' },
  prompting: { week: 5, label: 'Prompting' },
  'llm-cost': { week: 5, label: 'Caching & Cost' },
  'llm-safety': { week: 5, label: 'Reliability & Safety' },
  'llm-eval': { week: 5, label: 'Evaluation' },
  'llm-prod': { week: 5, label: 'Production Concerns' },
  agents: { week: 6, label: 'Agent Architecture' },
  tools: { week: 6, label: 'Tools & Function Calling' },
  rag: { week: 6, label: 'RAG' },
  memory: { week: 6, label: 'Memory' },
  'multi-agent': { week: 6, label: 'Multi-agent & Orchestration' },
  'agent-eval': { week: 6, label: 'Eval & Observability for Agents' },
};

export function weekOfTag(tag) {
  return TAG_META[tag]?.week ?? 0;
}

// scope: { type:'all' } | { type:'week', week } | { type:'tag', tag }
export function inScope(prompt, scope) {
  if (!scope || scope.type === 'all') return true;
  if (scope.type === 'week') return weekOfTag(prompt.tag) === scope.week;
  if (scope.type === 'tag') return prompt.tag === scope.tag;
  return true;
}

export function filterByScope(prompts, scope) {
  return prompts.filter((p) => inScope(p, scope));
}

// Stable, unique key for one prompt. The 390-term dataset repeats a few terms
// across weeks (error boundary, batching, cache invalidation) as distinct
// prompts; their tag differs, so tag+term uniquely identifies each prompt and is
// stable across reorderings (unlike an array index).
export function promptId(p) {
  return `${p.tag}${p.term}`;
}

export function progressOf(prompts, scope, done) {
  const doneSet = done instanceof Set ? done : new Set(done || []);
  const pool = filterByScope(prompts, scope);
  let n = 0;
  for (const p of pool) if (doneSet.has(promptId(p))) n += 1;
  return { done: n, total: pool.length };
}

// Pick the next prompt within `scope`.
//   mode 'sequential' walks curriculum order and serves the first not-yet-done
//     prompt; once every prompt in scope is done it cycles through them in order
//     for review.
//   mode 'random' picks uniformly within scope.
// `done` is a set of prompt ids; `prev` is the previous prompt's id. Both modes
// avoid repeating `prev` back-to-back when the pool allows it.
export function selectFrom(prompts, opts = {}) {
  const { scope, mode = 'sequential', done, prev, rand = Math.random } = opts;
  const pool = filterByScope(prompts, scope);
  if (pool.length === 0) return null;

  if (mode === 'random') {
    const others = pool.length > 1 && prev ? pool.filter((p) => promptId(p) !== prev) : pool;
    const list = others.length ? others : pool;
    return list[Math.floor(rand() * list.length)] ?? null;
  }

  const doneSet = done instanceof Set ? done : new Set(done || []);
  const undone = pool.filter((p) => !doneSet.has(promptId(p)));
  if (undone.length) {
    return undone.find((p) => promptId(p) !== prev) ?? undone[0];
  }
  // Everything in scope is done — review in order, advancing past `prev` cyclically
  // so the whole pool is revisited (not just the first one or two prompts).
  if (!prev) return pool[0];
  const i = pool.findIndex((p) => promptId(p) === prev);
  return i === -1 ? pool[0] : pool[(i + 1) % pool.length];
}

// Flat list for the range <select>; the UI groups entries by `week`.
export function scopeChoices() {
  const choices = [{ value: 'all', label: 'All weeks', week: 0 }];
  for (const w of WEEKS) {
    choices.push({ value: `w:${w}`, label: 'Whole week', week: w, whole: true });
    for (const tag of TAGS_IN_ORDER) {
      if (TAG_META[tag].week === w) {
        choices.push({ value: `t:${tag}`, label: TAG_META[tag].label, week: w, tag });
      }
    }
  }
  return choices;
}

export function parseScope(value) {
  if (!value || value === 'all') return { type: 'all' };
  if (value.startsWith('w:')) return { type: 'week', week: Number(value.slice(2)) };
  if (value.startsWith('t:')) return { type: 'tag', tag: value.slice(2) };
  return { type: 'all' };
}

export function scopeToValue(scope) {
  if (!scope || scope.type === 'all') return 'all';
  if (scope.type === 'week') return `w:${scope.week}`;
  if (scope.type === 'tag') return `t:${scope.tag}`;
  return 'all';
}
