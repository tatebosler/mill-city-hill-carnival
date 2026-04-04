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
  const result: HillSize[] = [];

  const basePerDistance = Math.floor(count / 4);
  const extras = count % 4;

  const targets: Record<HillSize, number> = {
    400: basePerDistance + (extras > 0 ? 1 : 0),
    300: basePerDistance + (extras > 1 ? 1 : 0),
    200: basePerDistance + (extras > 2 ? 1 : 0),
    100: basePerDistance,
  };

  let remainingDist = dist;
  let remainingCount = count;

  for (const size of [400, 300, 200, 100] as const) {
    let target = targets[size];
    while (
      target > 0 &&
      remainingCount > 0 &&
      remainingDist >= size &&
      // Ensure that after taking this hill we can still fill the rest with 100m hills
      remainingDist - size >= (remainingCount - 1) * 100
    ) {
      result.push(size);
      remainingDist -= size;
      remainingCount--;
      target--;
    }
  }

  while (remainingCount > 0 && remainingDist >= 100) {
    result.push(100);
    remainingDist -= 100;
    remainingCount--;
  }

  // If we filled all distance but still have holes, return what we have (caller will handle)
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
