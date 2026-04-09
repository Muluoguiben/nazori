import type { Domain, LangCode } from '../shared/types';

/**
 * Construct a deterministic cache key from translation parameters.
 */
export function makeCacheKey(
  text: string,
  sourceLang: string,
  targetLang: string,
  domain: string,
  mode = 'normal',
): string {
  return `${text}\0${sourceLang}\0${targetLang}\0${domain}\0${mode}`;
}

/**
 * Generic LRU (Least Recently Used) cache backed by a Map.
 *
 * Map preserves insertion order, so the oldest entry is always the first.
 * On every `get` or `set` we delete-then-re-insert to move the key to the end
 * (most-recently-used position).
 */
export class LRUCache<V> {
  private readonly map = new Map<string, V>();
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    if (maxSize < 1) {
      throw new RangeError('LRUCache maxSize must be at least 1');
    }
    this.maxSize = maxSize;
  }

  /** Number of entries currently in the cache. */
  get size(): number {
    return this.map.size;
  }

  /**
   * Retrieve a value, promoting it to most-recently-used.
   * Returns `undefined` when the key is absent.
   */
  get(key: string): V | undefined {
    if (!this.map.has(key)) {
      return undefined;
    }
    // Move to end (most-recently-used)
    const value = this.map.get(key) as V;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /** Check existence without promoting. */
  has(key: string): boolean {
    return this.map.has(key);
  }

  /**
   * Insert or update a value, promoting it to most-recently-used.
   * Evicts the least-recently-used entry when the cache is full.
   */
  set(key: string, value: V): void {
    // If the key already exists, delete first so re-insert moves it to the end.
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict the oldest (first) entry
      const oldestKey = this.map.keys().next().value as string;
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
  }

  /** Remove all entries. */
  clear(): void {
    this.map.clear();
  }
}
