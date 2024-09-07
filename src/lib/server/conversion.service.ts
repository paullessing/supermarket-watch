import type { Conversion, ManualConversion, Unit } from '$lib/models';
import { commonConversions } from '$lib/models';
import { CannotConvertError } from './cannot-convert.error';
import { exists } from './util';

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
		manualConversions: ManualConversion[] = []
	): number {
		// We have the "from" unit, so we can do a breadth-first search to find the shortest path to the "to" unit
		// We don't need to initially calculate any conversions, we can just store the list of conversions during the search

		const step = (
			currentUnits: {
				unit: string;
				/**
				 * During the search, the path represents "previous unit" + "conversion from previous to current unit"
				 * However, when we return, the returned path will represent "current unit" + "conversion from previous to current unit"
				 */
				path: { unit: string; conversion: Conversion }[];
			}[]
		): { unit: string; conversion: Conversion }[] | null => {
			if (currentUnits.length === 0) {
				return null;
			}

			const nextSteps = [];

			for (const { unit, path } of currentUnits) {
				if (unit === to.unit) {
					// Shift all units left by one so that the path represents conversion + targetUnit rather than conversion + sourceUnit
					return path.map(({ conversion }, index) => ({
						unit: index < path.length - 1 ? path[index + 1].unit : to.unit,
						conversion
					}));
				}

				const matchingConversions = [...this.conversions, ...manualConversions]
					.filter((conversion) => !path.some((pathUnit) => pathUnit.conversion === conversion))
					.filter((conversion) => conversion.some(({ name }) => name === unit));

				for (const conversion of matchingConversions) {
					for (const { name: nextUnit } of conversion) {
						if (nextUnit === unit) {
							continue;
						}
						if (path.some(({ unit }) => unit === nextUnit)) {
							// Skip this conversion if we've already had the same unit at some point
							continue;
						}
						const newPath = [...path, { unit, conversion }];
						nextSteps.push({ unit: nextUnit, path: newPath });
					}
				}
			}

			return step(nextSteps);
		};

		const result = step([{ unit: from.unit, path: [] }]);
		if (result === null) {
			throw new CannotConvertError(from.unit, to.unit);
		}

		let fromUnit = from.unit;
		let price = pricePerUnit;

		for (let i = 0; i < result.length; i++) {
			const { unit: toUnit, conversion } = result[i];

			price = this.convertSpecific(
				conversion,
				price,
				{ unit: fromUnit, unitAmount: 1 },
				{ unit: toUnit, unitAmount: 1 }
			);
			fromUnit = toUnit;
		}

		const toUnitAmount = to.unitAmount || 1;

		return (price / from.unitAmount) * toUnitAmount;
	}

	/**
	 * Gets all convertable units for a product, given a list of allowed conversions and a list of actual units of the product.
	 * It is assumed that all existing units can be converted between, using default conversions and/or the given manual conversions.
	 * This method will throw if that assumption does not hold.
	 *
	 * @param units
	 * @param manualConversions
	 */
	public getConvertableUnits(units: string[], manualConversions: ManualConversion[] = []): string[] {
		// We know there is a conversion, so we can add the rest of the units
		const addConversions = (conversion: Conversion): void => {
			for (const convertedUnit of conversion) {
				if (!foundConversions.has(convertedUnit.name)) {
					foundConversions.add(convertedUnit.name);

					const possibleConversions = this.getMatchingConversions(convertedUnit.name, manualConversions);

					for (const possibleConversion of possibleConversions) {
						addConversions(possibleConversion);
					}
				}
			}
		};

		const foundConversions = new Set<string>();

		// add the first value
		const firstUnit = units[0];
		foundConversions.add(firstUnit);
		const conversions = this.getMatchingConversions(firstUnit, manualConversions);

		for (const conversion of conversions) {
			addConversions(conversion);
		}

		for (const unit of units) {
			if (!foundConversions.has(unit)) {
				throw new CannotConvertError(units[0], unit);
			}
		}

		return Array.from(foundConversions.values());
	}

	public canAddManualConversion(
		existingManualConversions: ManualConversion[],
		newConversion: ManualConversion
	): boolean {
		const units = new Set([
			...this.conversions.flatMap((conversion) => conversion.map(({ name }) => name)),
			...existingManualConversions.flatMap((conversion) => conversion.map(({ name }) => name))
		]);

		const newUnits = newConversion.map(({ name }) => name);

		while (units.size) {
			const unit = units.values().next().value;
			const convertableUnits = this.getConvertableUnits([unit], existingManualConversions);

			// If at least two units from our new manualConversion are in the convertable units, then the new conversion introduces a loop
			if (convertableUnits.filter((convertableUnit) => newUnits.includes(convertableUnit)).length >= 2) {
				return false;
			}

			for (const convertableUnit of convertableUnits) {
				units.delete(convertableUnit);
			}
		}

		return true;
	}

	private getSimpleConversion(name: string): Conversion | null {
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
		const fromUnit = this.getConversionUnitByName(conversion, from.unit);
		const toUnit = this.getConversionUnitByName(conversion, to.unit);

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

	private getConversionUnitByName(conversion: Conversion, name: string): Unit | null {
		for (const unit of conversion) {
			if (unit.name === name) {
				return unit;
			}
		}
		return null;
	}

	private getMatchingConversions(targetUnit: string, conversions: ManualConversion[]): Conversion[] {
		return [
			this.getSimpleConversion(targetUnit),
			...conversions.filter((conversion) => conversion.find((unit) => unit.name === targetUnit))
		].filter(exists);
	}
}

export const conversionService = new ConversionService();
