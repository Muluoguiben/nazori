import { nanoid } from 'nanoid';
import type { Domain, LangCode, Term, StorageSchema } from '../shared/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Storage key for a given domain's term list. */
function storageKey(domain: Domain): keyof StorageSchema {
  return `terms:${domain}` as keyof StorageSchema;
}

/** Read terms for a domain from chrome.storage.local. */
async function readTerms(domain: Domain): Promise<Term[]> {
  const key = storageKey(domain);
  const result = await chrome.storage.local.get(key);
  return (result[key] as Term[] | undefined) ?? [];
}

/** Write terms for a domain to chrome.storage.local. */
async function writeTerms(domain: Domain, terms: Term[]): Promise<void> {
  await chrome.storage.local.set({ [storageKey(domain)]: terms });
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Get all terms for the given domain.
 */
export async function getTerms(domain: Domain): Promise<Term[]> {
  return readTerms(domain);
}

/**
 * Add a new term. The caller supplies everything except `id`, `createdAt`, and
 * `updatedAt` which are generated here.
 */
export async function addTerm(
  term: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Term> {
  const now = Date.now();
  const newTerm: Term = {
    ...term,
    id: nanoid(),
    createdAt: now,
    updatedAt: now,
  };

  const terms = await readTerms(newTerm.domain);
  terms.push(newTerm);
  await writeTerms(newTerm.domain, terms);
  return newTerm;
}

/**
 * Update an existing term by id.  Returns the updated term.
 * Throws if the term is not found.
 */
export async function updateTerm(
  id: string,
  updates: Partial<Omit<Term, 'id' | 'createdAt'>>,
): Promise<Term> {
  // We need to search across all domains because the caller may not supply one.
  const domains: Domain[] = ['general', 'legal', 'medical', 'tech'];

  for (const domain of domains) {
    const terms = await readTerms(domain);
    const idx = terms.findIndex((t) => t.id === id);
    if (idx === -1) continue;

    const updated: Term = {
      ...terms[idx],
      ...updates,
      id, // never overwrite id
      createdAt: terms[idx].createdAt, // never overwrite createdAt
      updatedAt: Date.now(),
    };

    // If the domain changed, move the term
    if (updates.domain && updates.domain !== domain) {
      terms.splice(idx, 1);
      await writeTerms(domain, terms);

      const targetTerms = await readTerms(updates.domain);
      targetTerms.push(updated);
      await writeTerms(updates.domain, targetTerms);
    } else {
      terms[idx] = updated;
      await writeTerms(domain, terms);
    }

    return updated;
  }

  throw new Error(`Term not found: ${id}`);
}

/**
 * Delete a term by domain and id.
 */
export async function deleteTerm(domain: Domain, id: string): Promise<void> {
  const terms = await readTerms(domain);
  const filtered = terms.filter((t) => t.id !== id);
  if (filtered.length === terms.length) {
    throw new Error(`Term not found: ${id}`);
  }
  await writeTerms(domain, filtered);
}

// ---------------------------------------------------------------------------
// Import / Export
// ---------------------------------------------------------------------------

/**
 * Import terms into a domain. Existing terms with the same id are replaced;
 * new terms are appended.
 */
export async function importTerms(
  domain: Domain,
  incoming: Term[],
): Promise<void> {
  const existing = await readTerms(domain);
  const existingMap = new Map(existing.map((t) => [t.id, t]));

  for (const term of incoming) {
    existingMap.set(term.id, { ...term, domain, updatedAt: Date.now() });
  }

  await writeTerms(domain, Array.from(existingMap.values()));
}

/**
 * Export all terms for a domain.
 */
export async function exportTerms(domain: Domain): Promise<Term[]> {
  return readTerms(domain);
}

// ---------------------------------------------------------------------------
// Term Matching
// ---------------------------------------------------------------------------

/**
 * Find terms whose source-language entry appears in the given text.
 *
 * Returns an array of `{ source, target }` pairs suitable for sending to
 * the translation API as context.
 *
 * Matching is case-insensitive and operates on whole-word boundaries when the
 * source string is purely alphabetic (to avoid false positives in Latin
 * scripts). CJK terms match as substrings.
 */
export async function matchTerms(
  text: string,
  domain: Domain,
  sourceLang: LangCode,
  targetLang: LangCode,
): Promise<{ source: string; target: string }[]> {
  const terms = await readTerms(domain);
  const matches: { source: string; target: string }[] = [];
  const textLower = text.toLowerCase();

  for (const term of terms) {
    const source = term.translations[sourceLang];
    const target = term.translations[targetLang];
    if (!source || !target) continue;

    const sourceLower = source.toLowerCase();

    // Check whether the source term appears in the text
    if (textLower.includes(sourceLower)) {
      // Avoid duplicates
      if (!matches.some((m) => m.source === source && m.target === target)) {
        matches.push({ source, target });
      }
    }
  }

  return matches;
}
