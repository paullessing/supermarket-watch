type Conversion = Unit[];

interface Unit {
  name: string;
  multiplier: number;
}

export const commonConversions: [name: string, multiplier: number][][] = [
  [
    ['l', 1000],
    ['litre', 1000],
    ['ltr', 1000],
    ['ml', 1],
    ['mls', 1],
  ],
  [
    ['kg', 1000],
    ['kgs', 1000],
    ['g', 1],
    ['gs', 1],
  ],
  [
    ['sheet', 1],
    ['sheets', 1],
    ['sht', 1],
  ],
];

export class ConversionService {}
