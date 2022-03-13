import { Test, TestingModule } from '@nestjs/testing';
import { Collection, WithoutId } from 'mongodb';
import { ConversionService } from '../conversion.service';
import { Product } from '../product.model';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { ProductHistory, TrackedProducts, TrackedProductsRepository } from './tracked-products.repository';

// This nightmare type exists because TypeScript doesn't support getting overloaded return types as a union
// From https://github.com/microsoft/TypeScript/issues/32164#issuecomment-811608386
// prettier-ignore
type Overloads<T extends (...args: unknown[]) => unknown> =
  T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7; (...args: infer A8): infer R8; (...args: infer A9): infer R9; (...args: infer A10): infer R10; (...args: infer A11): infer R11; (...args: infer A12): infer R12 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7) | ((...args: A8) => R8) | ((...args: A9) => R9) | ((...args: A10) => R10) | ((...args: A11) => R11) | ((...args: A12) => R12)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7; (...args: infer A8): infer R8; (...args: infer A9): infer R9; (...args: infer A10): infer R10; (...args: infer A11): infer R11 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7) | ((...args: A8) => R8) | ((...args: A9) => R9) | ((...args: A10) => R10) | ((...args: A11) => R11)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7; (...args: infer A8): infer R8; (...args: infer A9): infer R9; (...args: infer A10): infer R10 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7) | ((...args: A8) => R8) | ((...args: A9) => R9) | ((...args: A10) => R10)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7; (...args: infer A8): infer R8; (...args: infer A9): infer R9 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7) | ((...args: A8) => R8) | ((...args: A9) => R9)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7; (...args: infer A8): infer R8}
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7) | ((...args: A8) => R8)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6; (...args: infer A7): infer R7 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6) | ((...args: A7) => R7)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5; (...args: infer A6): infer R6 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5) | ((...args: A6) => R6)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4; (...args: infer A5): infer R5 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4) | ((...args: A5) => R5)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3; (...args: infer A4): infer R4 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3) | ((...args: A4) => R4)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2; (...args: infer A3): infer R3 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2) | ((...args: A3) => R3)
  : T extends { (...args: infer A1): infer R1; (...args: infer A2): infer R2 }
  ? ((...args: A1) => R1) | ((...args: A2) => R2)
  : T extends { (...args: infer A1): infer R1 }
  ? (...args: A1) => R1
  : never

type OverloadedParameters<T extends (...args: unknown[]) => unknown> = Parameters<Overloads<T>>;
type OverloadedReturnType<T extends (...args: unknown[]) => unknown> = ReturnType<Overloads<T>>;

type FunctionMembers<Class> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [ClassMember in keyof Class]: Class[ClassMember] extends Function ? ClassMember : never;
}[keyof Class];

type StubbedFunctions<StubbedClass> = {
  [FunctionName in FunctionMembers<StubbedClass>]: StubbedClass[FunctionName] extends (...args: unknown[]) => unknown
    ? jest.Mock<OverloadedReturnType<StubbedClass[FunctionName]>, OverloadedParameters<StubbedClass[FunctionName]>>
    : never;
};

type Stubbed<Class> = Class & StubbedFunctions<Class>;

function stubClass<Class>(functionNames: FunctionMembers<Class>[] = []): Class & StubbedFunctions<Class> {
  const stubs: { [StubbedFunction in FunctionMembers<Class>]?: jest.Mock } = {};
  functionNames.forEach((functionName) => {
    stubs[functionName] = jest.fn();
  });
  return stubs as unknown as Class & StubbedFunctions<Class>;
}

describe('TrackedProductsRepository', () => {
  let repo: TrackedProductsRepository;
  // let conversionService: ConversionService;
  let products: Stubbed<Collection<TrackedProducts>>;
  let history: Stubbed<Collection<ProductHistory>>;

  let now: Date;

  beforeEach(async () => {
    products = stubClass<Collection<TrackedProducts>>([
      'deleteOne',
      'deleteMany',
      'findOne',
      'find',
      'findOneAndUpdate',
      'insertOne',
      'updateOne',
    ]);
    history = stubClass<Collection<ProductHistory>>(['deleteMany', 'findOne', 'insertOne', 'updateOne']);
    now = new Date('2020-01-01T00:00:00.000Z');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrackedProductsRepository,
        {
          provide: ConversionService,
          useValue: null,
        },
        {
          provide: TRACKING_COLLECTION,
          useValue: products,
        },
        {
          provide: HISTORY_COLLECTION,
          useValue: history,
        },
      ],
    }).compile();

    repo = module.get<TrackedProductsRepository>(TrackedProductsRepository);
    // conversionService = module.get<ConversionService>(ConversionService);
  });

  it('should be defined', () => {
    expect(repo).toBeDefined();
  });

  describe('removeAllHistory()', () => {
    it('should call deleteMany on the history collection', function () {
      repo.removeAllHistory();

      expect(history.deleteMany).toHaveBeenCalledWith({});
    });
  });

  describe('addToHistory()', () => {
    let product: Product;

    beforeEach(() => {
      products.findOne.mockReturnValue(null);

      product = {
        id: '123',
        name: 'Test Product',
        unitAmount: 1.1,
        price: 2.2,
        pricePerUnit: 3.3,
        unitName: 'kgs',
        specialOffer: null,
        supermarket: 'Test Supermarket',
      };
    });

    it('should create a new history entry if the product does not exist in history', async () => {
      history.findOne.mockReturnValue(null);

      try {
        await repo.addToHistory(product, now);
      } catch (e) {
        console.error('ERROR', e);
      }

      expect(history.findOne).toHaveBeenCalledTimes(1);
      expect(history.findOne).toHaveBeenCalledWith({ productId: product.id });

      expect(history.insertOne).toHaveBeenCalledTimes(1);
      expect(history.insertOne).toHaveBeenCalledWith({
        productId: product.id,
        history: [
          {
            date: now,
            product,
          },
        ],
        createdAt: now,
        updatedAt: now,
      } as WithoutId<ProductHistory>);
    });
  });
});
