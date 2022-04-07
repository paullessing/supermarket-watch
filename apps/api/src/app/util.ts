export function rpad(value: string | number, length: number, padChar: string = ' '): string {
  value = `${value}`;
  return value + new Array(Math.max(0, length - value.length)).fill(padChar).join('');
}

export function lpad(value: string, length: number, padChar: string = ' '): string {
  return new Array(Math.max(0, length - value.length)).fill(padChar).join('') + value;
}

export interface RowDefinition<T> {
  name: string;
  key: keyof T | ((val: T) => string);
  padLeft?: boolean;
}

export function createTable<T = unknown>(cols: RowDefinition<T>[], values: T[]): string {
  const lengths = cols.map(({ name }) => name.length);
  const rows = values.map((value) => {
    return cols.map((col, i) => {
      const val = typeof col.key === 'function' ? col.key(value) : `${value[col.key]}`;
      if (val.length > lengths[i]) {
        lengths[i] = val.length;
      }
      return val;
    });
  });
  const headers = cols.map(({ name }, i) => rpad(name, lengths[i])).join(' | ');
  const separator = lengths.map((length) => rpad('', length, '-')).join('-|-');
  const body = rows.map((row) => row.map((value, i) => (cols[i].padLeft ? lpad : rpad)(value, lengths[i])).join(' | '));
  return [headers, separator, ...body].join('\n');
}

export function unique<T>(getId?: (value: T) => unknown): (value: T, index: number, arr: T[]) => boolean {
  if (getId) {
    return (value: T, index: number, arr: T[]) => arr.findIndex((v) => getId(v) === getId(value)) === index;
  } else {
    return (value: T, index: number, arr: T[]) => arr.indexOf(value) === index;
  }
}

export function exists<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
