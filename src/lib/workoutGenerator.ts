export type HillSize = 100 | 200 | 300 | 400;

export interface Hill {
  id: string;
  size: HillSize;
}

export const HILL_SIZES: HillSize[] = [400, 300, 200, 100];

let _counter = 0;
export function resetIdCounter() {
  _counter = 0;
}
export function makeId() {
  return `hill-${++_counter}`;
}

export function selectHillsConsistency(dist: number, count: number): HillSize[] {
  let bestSize: HillSize = 100;
  let bestCount = 0;
  let bestDistUsed = 0;

  for (const size of HILL_SIZES) {
    let maxReps = Math.min(count, Math.floor(dist / size));

    // Ensure that after choosing maxReps of this size we can still fill remaining
    // reps with the minimum hill size (100m).
    while (maxReps >= 0 && dist - maxReps * size < (count - maxReps) * 100) {
      maxReps--;
    }

    const distUsed = maxReps * size;
    if (distUsed > bestDistUsed) {
      bestDistUsed = distUsed;
      bestSize = size;
      bestCount = maxReps;
    }
  }

  const result: HillSize[] = Array(bestCount).fill(bestSize);
  let remainingDist = dist - bestCount * bestSize;
  let remainingCount = count - bestCount;

  if (remainingCount > 0 && remainingDist >= 100) {
    const tail = selectHillsConsistency(remainingDist, remainingCount);
    result.push(...tail);
  }

  return result;
}

export function selectHillsVariety(dist: number, count: number): HillSize[] {
  // Solve for counts of each hill size: c400, c300, c200, c100
  // such that c400 + c300 + c200 + c100 = count
  // and 400*c400 + 300*c300 + 200*c200 + 100*c100 = dist
  // Iterate feasible counts (small search space: count <= 30) and pick the solution
  // with the most even distribution (min variance from mean count).

  let best: { counts: [number, number, number, number]; score: number } | null = null;
  const mean = count / 4;

  for (let c400 = 0; c400 <= count; c400++) {
    for (let c300 = 0; c300 + c400 <= count; c300++) {
      for (let c200 = 0; c200 + c300 + c400 <= count; c200++) {
        const c100 = count - (c400 + c300 + c200);
        const total = 400 * c400 + 300 * c300 + 200 * c200 + 100 * c100;
        if (total !== dist) continue;

        const counts = [c400, c300, c200, c100];
        // score: sum squared deviation from mean (lower = more even)
        const score = counts.reduce((s, c) => s + (c - mean) * (c - mean), 0);

        if (!best || score < best.score) {
          best = { counts: [c400, c300, c200, c100], score };
        }
      }
    }
  }

  if (!best) return [];

  const [c400, c300, c200, c100] = best.counts;
  const result: HillSize[] = [];
  for (let i = 0; i < c400; i++) result.push(400);
  for (let i = 0; i < c300; i++) result.push(300);
  for (let i = 0; i < c200; i++) result.push(200);
  for (let i = 0; i < c100; i++) result.push(100);
  return result;
}

export function canAutoComplete(hills: Hill[], distance: number, reps: number): boolean {
  const currentDist = hills.reduce((s, h) => s + h.size, 0);
  const missing = HILL_SIZES.filter((s) => !hills.some((h) => h.size === s));
  const mustAddDist = missing.reduce((s, m) => s + m, 0);
  const mustAddCount = missing.length;
  const remainingDist = distance - currentDist - mustAddDist;
  const remainingCount = reps - hills.length - mustAddCount;

  if (remainingDist < 0 || remainingCount < 0) return false;
  if (remainingDist % 100 !== 0) return false;
  if (remainingCount === 0 && remainingDist !== 0) return false;
  if (remainingCount > 0 && remainingDist < remainingCount * 100) return false;
  if (remainingCount > 0 && remainingDist > remainingCount * 400) return false;
  return true;
}

export function doComplete(
  hills: Hill[],
  distance: number,
  reps: number,
  distribution: 'consistency' | 'variety',
): Hill[] {
  const result = [...hills];
  const represented = new Set(result.map((h) => h.size));

  for (const size of [400, 300, 200, 100] as const) {
    if (!represented.has(size)) {
      result.push({ id: makeId(), size });
      represented.add(size);
    }
  }

  const currentDist = result.reduce((s, h) => s + h.size, 0);
  const remainingDist = distance - currentDist;
  const remainingCount = reps - result.length;

  if (remainingCount > 0 && remainingDist > 0) {
    const toAdd =
      distribution === 'consistency'
        ? selectHillsConsistency(remainingDist, remainingCount)
        : selectHillsVariety(remainingDist, remainingCount);

    for (const size of toAdd) {
      result.push({ id: makeId(), size });
    }
  }

  result.sort((a, b) => b.size - a.size);

  return result;
}
