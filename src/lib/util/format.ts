import { format } from 'date-fns/format';

export function formatCurrency(amount: number | null): string {
  return `£${(amount ?? 0).toFixed(2)}`;
}

export function formatDate(date: string | Date, formatString: string): string {
  return format(date, formatString);
}
