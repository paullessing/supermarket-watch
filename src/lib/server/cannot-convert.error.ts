export class CannotConvertError extends Error {
	// prettier-ignore
	constructor(
    public readonly fromUnit: string,
    public readonly toUnit: string
  ) {
    super(`Cannot convert from ${fromUnit} to ${toUnit}`);
  }
}
