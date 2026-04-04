export interface SubtitleOption {
  text: string;
  weight: number;
}

export const subtitleOptions: SubtitleOption[] = [
  { text: "I Like To Move It, Move It", weight: 10 },
  { text: "I got bills I gotta pay", weight: 7 },
  { text: "Just one more hill", weight: 8 },
  { text: "It only works if you start running!", weight: 6 },
  { text: "The ultimate showdown in wholesome chaos", weight: 3 },
  { text: "Cheek to cheek!", weight: 9 },
  { text: "But will you take on the Coffman stairs?", weight: 2 },
];

export function pickWeightedRandom(options: SubtitleOption[]): string {
  const total = options.reduce((sum, o) => sum + o.weight, 0);
  let r = Math.random() * total;
  for (const option of options) {
    r -= option.weight;
    if (r <= 0) return option.text;
  }
  return options[options.length - 1].text;
}
