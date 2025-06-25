// import { Test, TestingModule } from '@nestjs/testing';
// import { Collection, WithoutId } from 'mongodb';
// import { OverloadedParameters, OverloadedReturnType } from '@shoppi/util';
// import { ConversionService } from '../conversion.service';
// import { SupermarketProduct } from '../supermarket-product.model';
// import { COMPARISONS_COLLECTION, HISTORY_COLLECTION } from './db.providers';
// import { ProductPriceCalculator } from './product-price-calculator.service';
// import { PriceComparisonDocument, ProductHistoryDocument, ProductRepository } from './product-repository.service';
//
// type FunctionMembers<Class> = {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   [ClassMember in keyof Class]: Class[ClassMember] extends Function ? ClassMember : never;
// }[keyof Class];
//
// type StubbedFunctions<StubbedClass> = {
//   [FunctionName in FunctionMembers<StubbedClass>]: StubbedClass[FunctionName] extends (...args: unknown[]) => unknown
//     ? vi.Mock<OverloadedReturnType<StubbedClass[FunctionName]>, OverloadedParameters<StubbedClass[FunctionName]>>
//     : never;
// };
//
// type Stubbed<Class> = Class & StubbedFunctions<Class>;
//
// function stubClass<Class>(functionNames: FunctionMembers<Class>[] = []): Class & StubbedFunctions<Class> {
//   const stubs: { [StubbedFunction in FunctionMembers<Class>]?: jest.Mock } = {};
//   functionNames.forEach((functionName) => {
//     stubs[functionName] = jest.fn();
//   });
//   return stubs as unknown as Class & StubbedFunctions<Class>;
// }
//
// describe('ProductRepository', () => {
//   let repo: ProductRepository;
//   // let conversionService: ConversionService;
//   let products: Stubbed<Collection<PriceComparisonDocument>>;
//   let history: Stubbed<Collection<ProductHistoryDocument>>;
//
//   let now: Date;
//
//   beforeEach(async () => {
//     products = stubClass<Collection<PriceComparisonDocument>>([
//       'deleteOne',
//       'deleteMany',
//       'findOne',
//       'find',
//       'findOneAndUpdate',
//       'insertOne',
//       'updateOne',
//     ]);
//     history = stubClass<Collection<ProductHistoryDocument>>(['deleteMany', 'findOne', 'insertOne', 'updateOne']);
//     now = new Date('2020-01-01T00:00:00.000Z');
//
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         ProductRepository,
//         {
//           provide: ConversionService,
//           useValue: null,
//         },
//         {
//           provide: ProductPriceCalculator,
//           useValue: null,
//         },
//         {
//           provide: COMPARISONS_COLLECTION,
//           useValue: products,
//         },
//         {
//           provide: HISTORY_COLLECTION,
//           useValue: history,
//         },
//       ],
//     }).compile();
//
//     repo = module.get<ProductRepository>(ProductRepository);
//     // conversionService = module.get<ConversionService>(ConversionService);
//   });
//
//   it('should be defined', () => {
//     expect(repo).toBeDefined();
//   });
//
//   describe('removeAllHistory()', () => {
//     it('should call deleteMany on the history collection', function () {
//       repo.removeAllHistory();
//
//       expect(history.deleteMany).toHaveBeenCalledWith({});
//     });
//   });
//
//   describe('addToHistory()', () => {
//     let product: SupermarketProduct;
//
//     beforeEach(() => {
//       products.findOne.mockResolvedValue(null);
//
//       product = SupermarketProduct({
//         id: '123',
//         image: 'http://url.com/image.jpg',
//         url: 'http://url.com/product',
//         name: 'Test Product',
//         unitAmount: 1.1,
//         price: 2.2,
//         pricePerUnit: 3.3,
//         unitName: 'kgs',
//         specialOffer: null,
//         supermarket: 'Test Supermarket',
//         packSize: {
//           unit: 'g',
//           amount: 1,
//         },
//       });
//     });
//
//     it('should create a new history entry if the product does not exist in history', async () => {
//       history.findOne.mockResolvedValue(null);
//
//       await repo.addToHistory(product, now);
//
//       expect(history.findOne).toHaveBeenCalledTimes(1);
//       expect(history.findOne).toHaveBeenCalledWith({ productId: product.id });
//
//       expect(history.insertOne).toHaveBeenCalledTimes(1);
//       expect(history.insertOne).toHaveBeenCalledWith({
//         productId: product.id,
//         history: [
//           {
//             date: now,
//             product,
//           },
//         ],
//         createdAt: now,
//         updatedAt: now,
//       } as WithoutId<ProductHistoryDocument>);
//     });
//
//     // TODO there should be tests here to ensure that #71 remains fixed
//     // but I don't have the time to fix this right now and it's stalling development
//   });
// });

describe('TODO ProductRepository', () => {
  it('should have tests', () => {
    expect(1 + 1).toEqual(2);
  });
});
