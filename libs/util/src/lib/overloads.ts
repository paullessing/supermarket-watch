// This nightmare type exists because TypeScript doesn't support getting overloaded return types as a union
// From https://github.com/microsoft/TypeScript/issues/32164#issuecomment-811608386
type ValidFunction<Arguments extends unknown[], ReturnType> = unknown[] extends Arguments
  ? unknown extends ReturnType
    ? never
    : (...args: Arguments) => ReturnType
  : (...args: Arguments) => ReturnType;

// 12 is the max number of overloads that I've required, can add more when needed
export type Overloads<T extends (...args: unknown[]) => unknown> = T extends {
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
  (...args: infer A3): infer R3;
  (...args: infer A4): infer R4;
  (...args: infer A5): infer R5;
  (...args: infer A6): infer R6;
  (...args: infer A7): infer R7;
  (...args: infer A8): infer R8;
  (...args: infer A9): infer R9;
  (...args: infer A10): infer R10;
  (...args: infer A11): infer R11;
  (...args: infer A12): infer R12;
}
  ?
      | ValidFunction<A1, R1>
      | ValidFunction<A2, R2>
      | ValidFunction<A3, R3>
      | ValidFunction<A4, R4>
      | ValidFunction<A5, R5>
      | ValidFunction<A6, R6>
      | ValidFunction<A7, R7>
      | ValidFunction<A8, R8>
      | ValidFunction<A9, R9>
      | ValidFunction<A10, R10>
      | ValidFunction<A11, R11>
      | ValidFunction<A12, R12>
  : never;

export type OverloadedParameters<T extends (...args: unknown[]) => unknown> = Parameters<Overloads<T>>;
export type OverloadedReturnType<T extends (...args: unknown[]) => unknown> = ReturnType<Overloads<T>>;
