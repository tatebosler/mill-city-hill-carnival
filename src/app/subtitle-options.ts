export interface SubtitleOption {
  text: string;
  weight: number;
}

export const subtitleOptions: SubtitleOption[] = [
  { text: "I Like To Move It, Move It", weight: 10 },
  { text: "I got bills I gotta pay", weight: 5 },
  { text: "The ultimate showdown in wholesome chaos", weight: 3 },
  { text: "Fourth time's the charm", weight: 4 },
  { text: "Cheek to cheek!", weight: 10 },
  { text: "But will you take on the Coffman stairs?", weight: 2 },
  // Add more options here, e.g.:
  // { text: "Come One, Come All", weight: 2 },
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
