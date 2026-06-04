import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEntries } from './curriculum.mjs';

const SAMPLE = [
  '# Week N',
  '',
  'Preamble paragraph.',
  '',
  '## Group 1 — Sample (2 terms)',
  '',
  '### 1. type annotation',
  '**Definition:** Writing the type of a value next to it, like `name: string`.',
  '**Collocations:** add a type annotation · type-annotated parameter',
  '**Example:** I added a type annotation so the editor could catch wrong inputs.',
  '**Difficulty:** 1 · **Interview use:** Basic — used when explaining any TypeScript code.',
  '',
  '### 2. interface',
  '**Definition:** A named shape that an object must follow.',
  '**Collocations:** define an interface · implement an interface · extend an interface',
  '**Example:** The `User` interface has `id`, `name`, and `email` fields.',
  '**Difficulty:** 1 · **Interview use:** Comes up when comparing with `type` aliases.',
  '',
].join('\n');

test('parseEntries returns one entry per ### heading', () => {
  assert.equal(parseEntries(SAMPLE).length, 2);
});

test('parseEntries extracts index, term, and definition', () => {
  const [first] = parseEntries(SAMPLE);
  assert.equal(first.index, 1);
  assert.equal(first.term, 'type annotation');
  assert.match(first.definition, /Writing the type/);
});

test('parseEntries separates same-line difficulty and interview_use fields', () => {
  const [first] = parseEntries(SAMPLE);
  assert.equal(first.difficulty, '1');
  assert.match(first.interview_use, /^Basic/);
});

test('parseEntries preserves internal · separators inside multi-item field values', () => {
  const [, second] = parseEntries(SAMPLE);
  assert.match(second.collocations, /define an interface · implement an interface/);
});

test('parseEntries ignores ## group headings and preamble', () => {
  for (const e of parseEntries(SAMPLE)) {
    assert.ok(!e.term.startsWith('Group'));
    assert.ok(!e.term.startsWith('#'));
  }
});

test('parseEntries returns [] for empty or non-string input', () => {
  assert.deepEqual(parseEntries(''), []);
  assert.deepEqual(parseEntries(null), []);
  assert.deepEqual(parseEntries(undefined), []);
});

test('parseEntries skips entries that have no Definition field', () => {
  const malformed = '### 1. orphan\n**Example:** has no definition.\n';
  assert.deepEqual(parseEntries(malformed), []);
});

test('parseEntries handles a field name with internal whitespace', () => {
  const md = [
    '### 7. generic',
    '**Definition:** A type that takes a type parameter.',
    '**Interview use:** Common deep-dive question.',
    '',
  ].join('\n');
  const [entry] = parseEntries(md);
  assert.equal(entry.interview_use, 'Common deep-dive question.');
});
