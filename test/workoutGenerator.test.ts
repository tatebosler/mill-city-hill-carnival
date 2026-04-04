import { describe, expect, it, beforeEach } from 'vitest';
import { doComplete, resetIdCounter } from '../src/lib/workoutGenerator';

describe('workout generator', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('generates requested number of hills for 2500m / 8 hills (consistency)', () => {
    const hills = doComplete([], 2500, 8, 'consistency');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(8);
    expect(total).toBe(2500);
  });

  it('generates requested number of hills for 2500m / 8 hills (variety)', () => {
    const hills = doComplete([], 2500, 8, 'variety');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(8);
    expect(total).toBe(2500);
  });

  it('generates requested number of hills for 2500m / 9 hills (consistency)', () => {
    const hills = doComplete([], 2500, 9, 'consistency');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(9);
    expect(total).toBe(2500);
  });

  it('generates requested number of hills for 2500m / 9 hills (variety)', () => {
    const hills = doComplete([], 2500, 9, 'variety');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(9);
    expect(total).toBe(2500);
  });

  it('generates requested number of hills for 2500m / 10 hills (consistency)', () => {
    const hills = doComplete([], 2500, 10, 'consistency');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(10);
    expect(total).toBe(2500);
  });

  it('generates requested number of hills for 2500m / 10 hills (variety)', () => {
    const hills = doComplete([], 2500, 10, 'variety');
    const total = hills.reduce((s, h) => s + h.size, 0);
    expect(hills.length).toBe(10);
    expect(total).toBe(2500);

    // ensure the distribution (when sorted smallest→largest) matches expectation
    const sorted = hills.map((h) => h.size).sort((a, b) => a - b);
    expect(sorted).toEqual([100, 100, 200, 200, 200, 300, 300, 300, 400, 400]);
  });
});
