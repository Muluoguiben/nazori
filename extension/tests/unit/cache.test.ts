import { describe, it, expect } from 'vitest';
import { LRUCache, makeCacheKey } from '../../src/background/cache';

describe('LRUCache', () => {
  describe('basic get/set operations', () => {
    it('stores and retrieves a value', () => {
      const cache = new LRUCache<string>(10);
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('overwrites existing value on set', () => {
      const cache = new LRUCache<string>(10);
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('cache miss', () => {
    it('returns undefined for missing key', () => {
      const cache = new LRUCache<string>(10);
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('returns undefined after key is evicted', () => {
      const cache = new LRUCache<string>(2);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3'); // evicts 'a'
      expect(cache.get('a')).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('evicts the least recently used item when capacity is exceeded', () => {
      const cache = new LRUCache<string>(3);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      cache.set('d', '4'); // evicts 'a'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe('2');
      expect(cache.get('c')).toBe('3');
      expect(cache.get('d')).toBe('4');
    });

    it('evicts in insertion order when no access', () => {
      const cache = new LRUCache<number>(2);
      cache.set('first', 1);
      cache.set('second', 2);
      cache.set('third', 3); // evicts 'first'

      expect(cache.get('first')).toBeUndefined();
      expect(cache.get('second')).toBe(2);
      expect(cache.get('third')).toBe(3);
    });
  });

  describe('recently accessed items survive eviction', () => {
    it('promotes accessed item to most recently used', () => {
      const cache = new LRUCache<string>(3);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      // Access 'a' to promote it
      cache.get('a');

      // Now 'b' is the oldest
      cache.set('d', '4'); // evicts 'b'

      expect(cache.get('a')).toBe('1');
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe('3');
      expect(cache.get('d')).toBe('4');
    });

    it('promotes item on set (update)', () => {
      const cache = new LRUCache<string>(3);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');

      // Update 'a' to promote it
      cache.set('a', 'updated');

      cache.set('d', '4'); // evicts 'b' (now oldest)

      expect(cache.get('a')).toBe('updated');
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('empties the cache', () => {
      const cache = new LRUCache<string>(10);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('size tracking', () => {
    it('reports correct size', () => {
      const cache = new LRUCache<string>(10);
      expect(cache.size).toBe(0);
      cache.set('a', '1');
      expect(cache.size).toBe(1);
      cache.set('b', '2');
      expect(cache.size).toBe(2);
    });

    it('size does not exceed maxSize', () => {
      const cache = new LRUCache<string>(2);
      cache.set('a', '1');
      cache.set('b', '2');
      cache.set('c', '3');
      expect(cache.size).toBe(2);
    });

    it('size does not increase on update of existing key', () => {
      const cache = new LRUCache<string>(10);
      cache.set('a', '1');
      cache.set('a', '2');
      expect(cache.size).toBe(1);
    });
  });

  describe('constructor validation', () => {
    it('throws RangeError for maxSize < 1', () => {
      expect(() => new LRUCache(0)).toThrow(RangeError);
      expect(() => new LRUCache(-1)).toThrow(RangeError);
    });
  });

  describe('has method', () => {
    it('returns true for existing key', () => {
      const cache = new LRUCache<string>(10);
      cache.set('a', '1');
      expect(cache.has('a')).toBe(true);
    });

    it('returns false for missing key', () => {
      const cache = new LRUCache<string>(10);
      expect(cache.has('a')).toBe(false);
    });
  });
});

describe('makeCacheKey', () => {
  it('produces a deterministic key for given params', () => {
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    const key2 = makeCacheKey('hello', 'en', 'ja', 'general');
    expect(key1).toBe(key2);
  });

  it('produces different keys for different text', () => {
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    const key2 = makeCacheKey('world', 'en', 'ja', 'general');
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different source lang', () => {
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    const key2 = makeCacheKey('hello', 'fr', 'ja', 'general');
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different target lang', () => {
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    const key2 = makeCacheKey('hello', 'en', 'ko', 'general');
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different domain', () => {
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    const key2 = makeCacheKey('hello', 'en', 'ja', 'legal');
    expect(key1).not.toBe(key2);
  });

  it('uses null character as separator to avoid collisions', () => {
    // "a\0b" text with "c" source should differ from "a" text with "b\0c" source
    const key1 = makeCacheKey('hello', 'en', 'ja', 'general');
    expect(key1).toContain('\0');
  });
});
