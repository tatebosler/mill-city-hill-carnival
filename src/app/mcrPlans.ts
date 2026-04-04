export interface PlanRange {
  distance: { min: number; max: number }; // meters, multiples of 100
  hills: { min: number; max: number };    // rep count
}

export interface TrainingPlan {
  id: string;
  label: string;
  range: PlanRange;
}

export const MCR_PLANS: TrainingPlan[] = [
  {
    id: 'lte25',
    label: '≤ 25 miles per week',
    range: {
      distance: { min: 1600, max: 2200 },
      hills: { min: 7, max: 9 },
    },
  },
  {
    id: '26-40',
    label: '26–40 miles per week',
    range: {
      distance: { min: 2200, max: 2800 },
      hills: { min: 8, max: 10 },
    },
  },
  {
    id: '41-60',
    label: '41–60 miles per week',
    range: {
      distance: { min: 2600, max: 3200 },
      hills: { min: 10, max: 12 },
    },
  },
  {
    id: '60plus',
    label: '60+ miles per week',
    range: {
      distance: { min: 3000, max: 3400 },
      hills: { min: 10, max: 14 },
    },
  },
];
