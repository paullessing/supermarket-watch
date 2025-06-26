export type Conversion = Unit[];
export type ManualConversion = [Unit, Unit];

export interface Unit {
  name: string;
  multiplier: number;
}

const STANDARD_UNIT_SYNONYMS = {
  l: ['liter', 'litre', 'litres', 'liters', 'ltr'],
  ml: ['milliliter', 'millilitre', 'millilitres', 'milliliters', 'mls'],
  kg: ['kilogram', 'kilograms', 'kgs'],
  g: ['gram', 'grams', 'gms', 'gs', 'gramme', 'grammes'],
  mg: ['milligram', 'milligrams', 'mgs', 'milligramme', 'milligrammes'],
  sht: ['sheet', 'sheets'],
  ea: ['each', 'eaches', 'unit', 'units'],
} as const;

const alternativeUnitsToStandardUnit = new Map<string, string>(
  Object.entries(STANDARD_UNIT_SYNONYMS).reduce<[string, string][]>(
    (acc, [standardUnit, alternatives]) => [
      ...acc,
      ...alternatives.map((alternative): [string, string] => [
        alternative,
        standardUnit,
      ]),
    ],
    []
  )
);

export function standardiseUnit(unit: string): string {
  unit = unit.toLocaleLowerCase();
  return alternativeUnitsToStandardUnit.get(unit) ?? unit;
}

const LITRE_VALUES = [
  ['l', 1],
  ['ml', 1000],
] as const;
export const LITRE_UNITS = LITRE_VALUES.map(([unit]) => unit);

const GRAM_VALUES = [
  ['kg', 1],
  ['g', 1000],
  ['mg', 1000_000],
] as const;
export const GRAM_UNITS = GRAM_VALUES.map(([unit]) => unit);

export const commonConversions: (readonly (readonly [
  name: string,
  multiplier: number,
])[])[] = [LITRE_VALUES, GRAM_VALUES];
