export function trackById<T extends { id: string | number }>(_: number, { id }: T): string {
  return `${id}`;
}
