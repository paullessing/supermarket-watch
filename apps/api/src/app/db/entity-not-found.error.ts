export class EntityNotFoundError extends Error {
  constructor(id: string) {
    super('Entity not found: ' + id);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, EntityNotFoundError.prototype);
  }
}
