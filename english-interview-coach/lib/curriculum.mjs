// Pure-JS parser for curriculum/weekN.md, shared by app/cards/page.tsx and the
// unit tests. Each `### N. term` heading becomes one entry; every `**Field:**`
// value under the heading is captured. Fields can share a line separated by
// " · " (used for difficulty/interview_use); the trailing separator is stripped
// so internal · characters inside collocations and examples are preserved.

const FIELD_MARKER = /\*\*([A-Za-z][A-Za-z _-]*):\*\*\s*/g;
const TRAILING_SEPARATOR = /\s*·\s*$/;

export function parseEntries(markdown) {
  if (!markdown || typeof markdown !== 'string') return [];
  const blocks = markdown.split(/^### /m).slice(1);
  const entries = [];
  for (const block of blocks) {
    const newlineIdx = block.indexOf('\n');
    if (newlineIdx === -1) continue;
    const header = block.slice(0, newlineIdx);
    const body = block.slice(newlineIdx + 1);
    const headerMatch = header.match(/^(\d+)\.\s*(.+?)\s*$/);
    if (!headerMatch) continue;
    const fields = parseFields(body);
    if (!fields.definition) continue;
    entries.push({
      index: Number(headerMatch[1]),
      term: headerMatch[2],
      ...fields,
    });
  }
  return entries;
}

function parseFields(text) {
  const matches = [...text.matchAll(FIELD_MARKER)];
  const fields = {};
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const next = matches[i + 1];
    const key = m[1].trim().toLowerCase().replace(/[\s-]+/g, '_');
    const valueStart = m.index + m[0].length;
    const valueEnd = next ? next.index : text.length;
    const value = text.slice(valueStart, valueEnd).replace(TRAILING_SEPARATOR, '').trim();
    fields[key] = value;
  }
  return fields;
}
