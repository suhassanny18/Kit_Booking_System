import { describe, it, expect } from 'vitest';
import { runAllDomainTests } from './testRunner';

describe('Kit Booking System - Domain & Service Verification', () => {
  const results = runAllDomainTests();

  for (const r of results) {
    it(`[${r.suite}] ${r.name}`, () => {
      if (!r.passed) {
        throw new Error(r.error);
      }
      expect(r.passed).toBe(true);
    });
  }
});
