/* eslint-disable @typescript-eslint/no-parameter-properties */
import { Conversion } from './conversion.service';

export class CircularConversionError extends Error {
  // prettier-ignore
  constructor(
    public readonly conversions: Conversion[],
  ) {
    super(`Circular Conversion in ${JSON.stringify(conversions)}`);
  }
}
