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

export class ConversionService {
  private conversions: Conversion[] = [];

  constructor() {
    for (const commonConversion of commonConversions) {
      const conversion: Conversion = [];
      for (const [name, multiplier] of commonConversion) {
        conversion.push({ name, multiplier });
      }
      this.conversions.push(conversion);
    }
  }

  public convert(pricePerUnit: number, unitAmount: number, from: string, to: string, targetAmount: number = 1): number {
    const fromUnit = this.getUnit(from);
    const toUnit = this.getUnit(to);

    // console.log(`Converting ${unitAmount} ${fromUnit.name} to ${targetAmount} ${toUnit.name}`);
    // console.log('Price per unit:', pricePerUnit);

    const unitMultiplier = toUnit.multiplier / fromUnit.multiplier;
    const amountMultiplier = targetAmount / unitAmount;

    // console.log('Unit multiplier:', unitMultiplier);
    // console.log('Amount multiplier:', amountMultiplier);

    return pricePerUnit * unitMultiplier * amountMultiplier;
  }

  public getUnit(name: string): Unit {
    for (const conversion of this.conversions) {
      for (const unit of conversion) {
        if (unit.name === name) {
          return unit;
        }
      }
    }
    return { name, multiplier: 1 };
  }
}
