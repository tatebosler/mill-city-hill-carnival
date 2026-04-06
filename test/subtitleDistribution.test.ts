import { describe, expect, it } from 'vitest';
import { subtitleOptions, pickWeightedRandom } from '../src/app/subtitle-options';

describe('subtitle distribution', () => {
  it('follows weighted distribution approximately', () => {
    const N = 20000;
    const counts = new Map<string, number>();
    for (const o of subtitleOptions) counts.set(o.text, 0);

    for (let i = 0; i < N; i++) {
      const t = pickWeightedRandom(subtitleOptions);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }

    const totalWeight = subtitleOptions.reduce((s, o) => s + o.weight, 0);

    for (const opt of subtitleOptions) {
      const expected = (opt.weight / totalWeight) * N;
      const actual = counts.get(opt.text) ?? 0;
      const relDiff = Math.abs(actual - expected) / expected;
      // allow 15% relative deviation for randomness
      expect(relDiff).toBeLessThan(0.15);
    }
  }, 20000);
});
