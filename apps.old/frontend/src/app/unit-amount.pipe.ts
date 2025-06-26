import { Pipe, PipeTransform } from '@angular/core';

export const UNITS_WITH_SPACE = ['ea', 'each', 'unit'];

@Pipe({
  name: 'unitAmount',
  pure: true,
})
export class UnitAmountPipe implements PipeTransform {
  public transform(
    { amount, name }: { amount: number; name: string },
    collapseOne: boolean = true
  ): string {
    const displayAmount = amount === 1 && collapseOne ? '' : `${amount}`;
    const displayName = UNITS_WITH_SPACE.includes(name.toLocaleLowerCase())
      ? ` ${name}`
      : name;

    return `${displayAmount}${displayName}`.trim();
  }
}
