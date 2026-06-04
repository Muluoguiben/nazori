import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TAG_META,
  TAGS_IN_ORDER,
  WEEKS,
  filterByScope,
  progressOf,
  selectFrom,
  scopeChoices,
  parseScope,
  scopeToValue,
  weekOfTag,
} from './scope.mjs';

const prompts = JSON.parse(readFileSync(new URL('../prompts.json', import.meta.url), 'utf8'));

test('curriculum has 390 terms and every tag is known and used', () => {
  assert.equal(prompts.length, 390);
  for (const p of prompts) assert.ok(TAG_META[p.tag], `unknown tag: ${p.tag}`);
  const used = new Set(prompts.map((p) => p.tag));
  for (const tag of TAGS_IN_ORDER) assert.ok(used.has(tag), `declared tag never used: ${tag}`);
  assert.equal(used.size, TAGS_IN_ORDER.length); // 36, no extras
});

test('each week filters to 65 terms', () => {
  for (const w of WEEKS) {
    assert.equal(filterByScope(prompts, { type: 'week', week: w }).length, 65);
  }
});

test('a tag filter selects only that tag', () => {
  const hooks = filterByScope(prompts, { type: 'tag', tag: 'hooks' });
  assert.equal(hooks.length, 14);
  assert.ok(hooks.every((p) => p.tag === 'hooks'));
});

test('sequential serves the first not-done term in curriculum order', () => {
  const all = selectFrom(prompts, { scope: { type: 'all' }, mode: 'sequential', done: [] });
  assert.equal(all.term, prompts[0].term);

  const w2 = filterByScope(prompts, { type: 'week', week: 2 });
  const pick = selectFrom(prompts, { scope: { type: 'week', week: 2 }, mode: 'sequential', done: [] });
  assert.equal(pick.term, w2[0].term);

  const next = selectFrom(prompts, {
    scope: { type: 'week', week: 2 },
    mode: 'sequential',
    done: [w2[0].term],
  });
  assert.equal(next.term, w2[1].term);
});

test('sequential reviews in order once a scope is fully done, skipping prevTerm', () => {
  const pool = filterByScope(prompts, { type: 'tag', tag: 'modules' });
  const pick = selectFrom(prompts, {
    scope: { type: 'tag', tag: 'modules' },
    mode: 'sequential',
    done: pool.map((p) => p.term),
    prevTerm: pool[0].term,
  });
  assert.ok(pick);
  assert.notEqual(pick.term, pool[0].term);
});

test('random stays in scope and is deterministic with an injected rand', () => {
  const hooks = filterByScope(prompts, { type: 'tag', tag: 'hooks' });
  const pick = selectFrom(prompts, { scope: { type: 'tag', tag: 'hooks' }, mode: 'random', rand: () => 0 });
  assert.equal(pick.tag, 'hooks');
  assert.equal(pick.term, hooks[0].term);
});

test('random avoids repeating prevTerm', () => {
  const hooks = filterByScope(prompts, { type: 'tag', tag: 'hooks' });
  const pick = selectFrom(prompts, {
    scope: { type: 'tag', tag: 'hooks' },
    mode: 'random',
    prevTerm: hooks[0].term,
    rand: () => 0,
  });
  assert.notEqual(pick.term, hooks[0].term);
});

test('progressOf counts done terms within scope only', () => {
  const hooks = filterByScope(prompts, { type: 'tag', tag: 'hooks' });
  const done = [hooks[0].term, hooks[1].term, 'closure'];
  assert.deepEqual(progressOf(prompts, { type: 'tag', tag: 'hooks' }, done), { done: 2, total: 14 });
});

test('scope values round-trip and parse correctly', () => {
  for (const v of ['all', 'w:3', 't:rag']) assert.equal(scopeToValue(parseScope(v)), v);
  assert.deepEqual(parseScope('w:5'), { type: 'week', week: 5 });
  assert.deepEqual(parseScope('t:hooks'), { type: 'tag', tag: 'hooks' });
  assert.equal(weekOfTag('rag'), 6);
});

test('scopeChoices lists all + 6 whole-weeks + 36 tags', () => {
  const ch = scopeChoices();
  assert.ok(ch.some((c) => c.value === 'all'));
  assert.equal(ch.filter((c) => c.whole).length, 6);
  assert.equal(ch.filter((c) => c.tag).length, 36);
});
