import { describe, expect, it } from 'vitest';
import { generateToken, hashToken } from './tokens.js';

describe('generateToken', () => {
  it('generates a 64-char hex string', () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates distinct tokens across calls', () => {
    expect(generateToken()).not.toBe(generateToken());
  });
});

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('produces a 64-char hex digest', () => {
    expect(hashToken('anything')).toMatch(/^[a-f0-9]{64}$/);
  });

  it('differs for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});
