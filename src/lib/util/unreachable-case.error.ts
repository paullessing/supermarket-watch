export class UnreachableCaseError extends Error {
  constructor(invalidCase: never) {
    super(`Unreachable case: "${invalidCase}"`);
  }
}
