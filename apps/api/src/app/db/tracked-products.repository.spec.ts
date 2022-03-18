import { Test, TestingModule } from '@nestjs/testing';
import { Collection, WithoutId } from 'mongodb';
import { OverloadedParameters, OverloadedReturnType } from '@shoppi/util';
import { ConversionService } from '../conversion.service';
import { Product } from '../product.model';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { ProductHistory, TrackedProducts, TrackedProductsRepository } from './tracked-products.repository';

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
      products.findOne.mockResolvedValue(null);

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
      history.findOne.mockResolvedValue(null);

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
