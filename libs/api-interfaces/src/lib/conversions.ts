const LITRE_VALUES = [
  ['l', 1],
  ['litre', 1],
  ['ltr', 1],
  ['ml', 1000],
  ['mls', 1000],
] as const;
export const LITRE_UNITS = LITRE_VALUES.map(([unit]) => unit);

const GRAM_VALUES = [
  ['kg', 1],
  ['kgs', 1],
  ['g', 1000],
  ['gs', 1000],
  ['mg', 1000_000],
  ['mgs', 1000_000],
] as const;
export const GRAM_UNITS = GRAM_VALUES.map(([unit]) => unit);

const SHEET_VALUES = [
  ['sheet', 1],
  ['sheets', 1],
  ['sht', 1],
] as const;
export const SHEET_UNITS = SHEET_VALUES.map(([unit]) => unit);

const EACH_VALUES = [
  ['each', 1],
  ['eaches', 1],
  ['ea', 1],
  ['unit', 1],
  ['units', 1],
] as const;
export const EACH_UNITS = EACH_VALUES.map(([unit]) => unit);

export const commonConversions: (readonly (readonly [name: string, multiplier: number])[])[] = [
  LITRE_VALUES,
  GRAM_VALUES,
  SHEET_VALUES,
  EACH_VALUES,
];
