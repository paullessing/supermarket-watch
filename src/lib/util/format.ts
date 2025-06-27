import { format } from 'date-fns/format';

export const UNITS_WITH_SPACE = ['ea', 'each', 'unit'];

export function formatCurrency(amount: number | null): string {
  return `£${(amount ?? 0).toFixed(2)}`;
}

export function formatDate(date: string | Date, formatString: string): string {
  return format(date, formatString);
}

export function formatUnitAmount(
  { amount, name }: { amount: number; name: string },
  collapseOne?: boolean
): string {
  const displayAmount = amount === 1 && collapseOne ? '' : `${amount}`;
  const displayName = UNITS_WITH_SPACE.includes(name.toLocaleLowerCase())
    ? ` ${name}`
    : name;

  return `${displayAmount}${displayName}`.trim();
}
