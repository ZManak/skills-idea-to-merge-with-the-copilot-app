import assert from 'node:assert/strict';
import test from 'node:test';
import { formatBookmark, generateSlug, normalizeUrl, parseBookmarks } from '../src/lib/bookmarks.ts';

test('normalizes URLs with and without https to the same value', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com');
  assert.equal(normalizeUrl(' https://example.com '), normalizeUrl('example.com'));
  assert.equal(normalizeUrl('example.com/path?q=1'), 'https://example.com/path?q=1');
  assert.throws(() => normalizeUrl('javascript://example.com'));
  assert.throws(() => normalizeUrl(''));
});

test('recovers from empty, corrupted, legacy, and non-array storage', () => {
  for (const value of [null, '', '{bad json', '"legacy"', '{"url":"https://example.com"}', 'null', '123']) {
    assert.deepEqual(parseBookmarks(value), []);
  }
  assert.deepEqual(parseBookmarks(JSON.stringify(['https://legacy.example', { originalUrl: 'https://example.com', slug: 'mona-123' }])), []);
});

test('keeps only valid bookmark objects from untrusted storage', () => {
  const valid = { url: 'https://example.com', slug: 'mona-7fk2' };
  assert.deepEqual(parseBookmarks(JSON.stringify([
    valid, null, {}, { url: 'javascript:alert(1)', slug: 'mona-123' },
    { url: 'https://example.com', slug: 'bad slug' }, { url: 5, slug: 'mona-123' },
  ])), [valid]);
  assert.deepEqual(parseBookmarks('[{"url":"https://example.com/","slug":"mona-123"}]'),
    [{ url: 'https://example.com', slug: 'mona-123' }]);
});

test('formats a bookmark using the exact separator', () => {
  assert.equal(formatBookmark({ url: 'https://www.example.com', slug: 'mona-7fk2' }), 'https://www.example.com :: mona-7fk2');
});

test('generates a short base62 slug distinct from existing slugs', () => {
  const slug = generateSlug([]);
  assert.match(slug, /^mona-[a-zA-Z0-9]{6}$/);
  assert.notEqual(generateSlug([{ url: 'https://example.com', slug }]), slug);
});
