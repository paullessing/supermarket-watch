import { CannotConvertError } from './cannot-convert.error';

export type Conversion = Unit[];

export interface Unit {
  name: string;
  multiplier: number;
}

export const commonConversions: [name: string, multiplier: number][][] = [
  [
    ['l', 1],
    ['litre', 1],
    ['ltr', 1],
    ['ml', 1000],
    ['mls', 1000],
  ],
  [
    ['kg', 1],
    ['kgs', 1],
    ['g', 1000],
    ['gs', 1000],
    ['mg', 1000_000],
    ['mgs', 1000_000],
  ],
  [
    ['sheet', 1],
    ['sheets', 1],
    ['sht', 1],
  ],
  [
    ['each', 1],
    ['eaches', 1],
    ['ea', 1],
    ['unit', 1],
    ['units', 1],
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

  /**
   * @throws CannotConvertError
   */
  public convert(
    pricePerUnit: number,
    from: {
      unit: string;
      unitAmount: number;
    },
    to: {
      unit: string;
      unitAmount?: number;
    },
    manualConversion?: Conversion
  ): number {
    // Cases:
    // 1. ml => l  + __     (both units in defaults, all fine)
    // 2. ea => kg + ea<>kg (direct conversion using manual value)
    // 3. ea => kg + ea<>g  (convert using manualConversion, then convert using defaults)
    // 4. ml => kg + l<>g   (convert using each manualConversion, then convert using defaults)

    const fromConversion = this.getConversion(from.unit) || [{ name: from.unit, multiplier: 1 }];

    if (fromConversion.find((unit) => unit.name === to.unit)) {
      return this.convertSpecific(
        fromConversion,
        pricePerUnit,
        {
          unit: from.unit,
          unitAmount: from.unitAmount,
        },
        {
          unit: to.unit,
          unitAmount: to.unitAmount ?? 1,
        }
      );
    }

    if (!manualConversion) {
      // We can't convert from->to, and there is no manual conversion defined
      throw new CannotConvertError(from.unit, to.unit);
    }

    const manualFromUnitName = this.findManualConversion(manualConversion, fromConversion);
    if (!manualFromUnitName) {
      // We can't convert from->manual using any intermediate value
      throw new CannotConvertError(from.unit, to.unit);
    }

    const toConversion = this.getConversion(to.unit) || [{ name: to.unit, multiplier: 1 }];

    const manualToUnitName = this.findManualConversion(manualConversion, toConversion);
    if (!manualToUnitName) {
      // We can't convert to->manual using any intermediate value
      throw new CannotConvertError(from.unit, to.unit);
    }

    const amountConvertedToCommonBaseUnit = this.convertSpecific(
      fromConversion,
      pricePerUnit,
      {
        unit: from.unit,
        unitAmount: from.unitAmount,
      },
      {
        unit: manualFromUnitName,
        unitAmount: 1,
      }
    );

    const amountConvertedToTargetBaseUnit = this.convertSpecific(
      manualConversion,
      amountConvertedToCommonBaseUnit,
      {
        unit: manualFromUnitName,
        unitAmount: 1,
      },
      {
        unit: manualToUnitName,
        unitAmount: 1,
      }
    );

    const amountConvertedToTargetFinalUnit = this.convertSpecific(
      toConversion,
      amountConvertedToTargetBaseUnit,
      {
        unit: manualToUnitName,
        unitAmount: 1,
      },
      {
        unit: to.unit,
        unitAmount: to.unitAmount ?? 1,
      }
    );

    return amountConvertedToTargetFinalUnit;
  }

  private findManualConversion(conversion1: Conversion, conversion2: Conversion): string | null {
    // return the unit that is in both conversions
    return conversion1.find((unit) => conversion2.find((unit2) => unit2.name === unit.name))?.name ?? null;
  }

  private getConversion(name: string): Conversion | null {
    for (const conversion of this.conversions) {
      for (const unit of conversion) {
        if (unit.name === name) {
          return conversion;
        }
      }
    }
    return null;
  }

  private convertSpecific(
    conversion: Conversion,
    pricePerUnit: number,
    from: {
      unit: string;
      unitAmount: number;
    },
    to: {
      unit: string;
      unitAmount: number;
    }
  ): number {
    const fromUnit = this.getConversionUnit(conversion, from.unit);
    const toUnit = this.getConversionUnit(conversion, to.unit);

    if (!fromUnit || !toUnit) {
      throw new CannotConvertError(from.unit, to.unit);
    }

    //     // prettier-ignore
    //     console.log(`Converting ${from.unitAmount} ${fromUnit.name} to ${to.unitAmount} ${toUnit.name}
    // ${rpad(`pricePerUnit: ${pricePerUnit}`, 30)} // ${pricePerUnit}p/${from.unitAmount}${from.unit}
    // ${rpad(`/ from.unitAmount (${from.unitAmount})`, 30)} // ${pricePerUnit / from.unitAmount}/${1}${from.unit}
    // ${rpad(`* fromUnit.multiplier (${fromUnit.multiplier})`, 30)} // ${(pricePerUnit / from.unitAmount) * fromUnit.multiplier}/${fromUnit.multiplier}${from.unit} = ${(pricePerUnit / from.unitAmount) * fromUnit.multiplier}/${toUnit.multiplier}${to.unit}
    // ${rpad(`/ toUnit.multiplier (${toUnit.multiplier})`, 30)} // ${(pricePerUnit / from.unitAmount) * fromUnit.multiplier / toUnit.multiplier}/${1}${to.unit}
    // ${rpad(`* to.unitAmount (${to.unitAmount})`, 30)} // ${(pricePerUnit / from.unitAmount) * to.unitAmount * fromUnit.multiplier / toUnit.multiplier}/${to.unitAmount}${to.unit}
    //     `);

    // e.g. using [8ea = 2kg]
    // £6/3ea  = £2/ea = £16/2kg = £8/kg = £24/3kg
    // prettier-ignore
    return (((((
      pricePerUnit             // 600p/3ea
        / from.unitAmount)     // 200p/1ea
        * fromUnit.multiplier) // 1600p/8ea = 1600p/2kg
        / toUnit.multiplier)   // 800p/1kg
        * to.unitAmount)       // 2400p/3kg
    );
  }

  private getConversionUnit(conversion: Conversion, name: string): Unit | null {
    for (const unit of conversion) {
      if (unit.name === name) {
        return unit;
      }
    }
    return null;
  }
}
