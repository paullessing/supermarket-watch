import { Provider, Scope } from '@nestjs/common';

export const NOW = Symbol('NOW');

export const nowProvider: Provider = {
  provide: NOW,
  useFactory: () => new Date(),
  scope: Scope.REQUEST,
};
