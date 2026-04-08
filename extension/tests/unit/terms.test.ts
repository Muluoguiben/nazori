import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome.storage.local before importing the module
let mockStorage: Record<string, any> = {};

globalThis.chrome = {
  storage: {
    local: {
      get: vi.fn((keys: unknown) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] });
        }
        if (Array.isArray(keys)) {
          const result: Record<string, any> = {};
          keys.forEach((k: string) => {
            if (mockStorage[k] !== undefined) result[k] = mockStorage[k];
          });
          return Promise.resolve(result);
        }
        return Promise.resolve({ ...mockStorage });
      }),
      set: vi.fn((items: Record<string, any>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      }),
    },
  },
} as any;

// Mock nanoid to produce predictable IDs
let idCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: () => `test-id-${++idCounter}`,
}));

import {
  getTerms,
  addTerm,
  updateTerm,
  deleteTerm,
  matchTerms,
  importTerms,
  exportTerms,
} from '../../src/background/terms';

beforeEach(() => {
  mockStorage = {};
  idCounter = 0;
  vi.clearAllMocks();
});

describe('getTerms', () => {
  it('returns empty array when no terms stored', async () => {
    const terms = await getTerms('general');
    expect(terms).toEqual([]);
  });

  it('returns stored terms', async () => {
    const term = {
      id: 'existing-1',
      domain: 'general' as const,
      translations: { en: 'hello', ja: 'こんにちは' },
      createdAt: 1000,
      updatedAt: 1000,
    };
    mockStorage['terms:general'] = [term];

    const terms = await getTerms('general');
    expect(terms).toEqual([term]);
  });
});

describe('addTerm', () => {
  it('creates a term with id and timestamps', async () => {
    const result = await addTerm({
      domain: 'general',
      translations: { en: 'hello', ja: 'こんにちは' },
    });

    expect(result.id).toBe('test-id-1');
    expect(result.domain).toBe('general');
    expect(result.translations).toEqual({ en: 'hello', ja: 'こんにちは' });
    expect(result.createdAt).toBeTypeOf('number');
    expect(result.updatedAt).toBeTypeOf('number');
    expect(result.createdAt).toBe(result.updatedAt);
  });

  it('persists the term to storage', async () => {
    await addTerm({
      domain: 'tech',
      translations: { en: 'API', ja: 'エーピーアイ' },
    });

    const terms = await getTerms('tech');
    expect(terms).toHaveLength(1);
    expect(terms[0].translations.en).toBe('API');
  });
});

describe('updateTerm', () => {
  it('modifies a term', async () => {
    const added = await addTerm({
      domain: 'general',
      translations: { en: 'hello', ja: 'こんにちは' },
    });

    const updated = await updateTerm(added.id, {
      translations: { en: 'hello', ja: 'やあ' },
    });

    expect(updated.translations.ja).toBe('やあ');
    expect(updated.id).toBe(added.id);
    expect(updated.createdAt).toBe(added.createdAt);
    expect(updated.updatedAt).toBeGreaterThanOrEqual(added.updatedAt);
  });

  it('throws for nonexistent term', async () => {
    await expect(updateTerm('nonexistent', { note: 'test' })).rejects.toThrow(
      'Term not found: nonexistent',
    );
  });
});

describe('deleteTerm', () => {
  it('removes a term', async () => {
    const added = await addTerm({
      domain: 'general',
      translations: { en: 'hello' },
    });

    await deleteTerm('general', added.id);
    const terms = await getTerms('general');
    expect(terms).toHaveLength(0);
  });

  it('throws for nonexistent term', async () => {
    await expect(deleteTerm('general', 'nonexistent')).rejects.toThrow(
      'Term not found: nonexistent',
    );
  });
});

describe('matchTerms', () => {
  it('finds matching terms (case-insensitive)', async () => {
    await addTerm({
      domain: 'tech',
      translations: { en: 'Machine Learning', ja: '機械学習' },
    });

    const matches = await matchTerms(
      'We use machine learning for this task',
      'tech',
      'en',
      'ja',
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      source: 'Machine Learning',
      target: '機械学習',
    });
  });

  it('returns empty array when no matches', async () => {
    await addTerm({
      domain: 'tech',
      translations: { en: 'API', ja: 'エーピーアイ' },
    });

    const matches = await matchTerms(
      'This has no relevant terms',
      'tech',
      'en',
      'ja',
    );

    expect(matches).toHaveLength(0);
  });

  it('handles missing language translations', async () => {
    await addTerm({
      domain: 'tech',
      translations: { en: 'API' }, // no Japanese translation
    });

    const matches = await matchTerms('Using API here', 'tech', 'en', 'ja');
    expect(matches).toHaveLength(0);
  });

  it('skips terms without source language translation', async () => {
    await addTerm({
      domain: 'tech',
      translations: { ja: '機械学習', ko: '머신러닝' }, // no English
    });

    const matches = await matchTerms(
      'Some English text about machine learning',
      'tech',
      'en',
      'ja',
    );
    expect(matches).toHaveLength(0);
  });
});

describe('importTerms', () => {
  it('merges incoming terms with existing ones', async () => {
    await addTerm({
      domain: 'general',
      translations: { en: 'hello', ja: 'こんにちは' },
    });

    const incoming = [
      {
        id: 'imported-1',
        domain: 'general' as const,
        translations: { en: 'goodbye', ja: 'さようなら' },
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    await importTerms('general', incoming);

    const terms = await getTerms('general');
    expect(terms).toHaveLength(2);
  });

  it('replaces existing terms with same id', async () => {
    const added = await addTerm({
      domain: 'general',
      translations: { en: 'hello', ja: 'こんにちは' },
    });

    const incoming = [
      {
        id: added.id,
        domain: 'general' as const,
        translations: { en: 'hi', ja: 'やあ' },
        createdAt: added.createdAt,
        updatedAt: 2000,
      },
    ];

    await importTerms('general', incoming);

    const terms = await getTerms('general');
    expect(terms).toHaveLength(1);
    expect(terms[0].translations.en).toBe('hi');
  });
});

describe('exportTerms', () => {
  it('returns all terms for a domain', async () => {
    await addTerm({
      domain: 'legal',
      translations: { en: 'contract', ja: '契約' },
    });
    await addTerm({
      domain: 'legal',
      translations: { en: 'liability', ja: '責任' },
    });

    const exported = await exportTerms('legal');
    expect(exported).toHaveLength(2);
  });

  it('returns empty array for domain with no terms', async () => {
    const exported = await exportTerms('medical');
    expect(exported).toEqual([]);
  });
});
