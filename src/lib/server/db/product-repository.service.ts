import { differenceInMinutes } from 'date-fns';
import {
  Collection,
  type Filter,
  type MatchKeysAndValues,
  ObjectId,
  type OptionalId,
  ReturnDocument,
  type WithoutId,
} from 'mongodb';
import { CannotConvertError } from '../cannot-convert.error';
import { conversionService, ConversionService } from '../conversion.service';
import { SupermarketProduct } from '../supermarket-product.model';
import { EntityNotFoundError } from './entity-not-found.error';
import { ProductPriceCalculator } from './product-price-calculator.service';
import type { TimestampedDocument } from './timestamped-document';
import {
  compareSpecialOffers,
  type ComparisonProductData,
  type ManualConversion,
  type PriceComparison,
} from '$lib/models';
import {
  $comparisonsCollection,
  $historyCollection,
} from '$lib/server/db/db.providers';
import { exists, unique } from '$lib/util/util';

export interface PriceComparisonDocument extends TimestampedDocument {
  name: string;
  image: string;
  unitOfMeasurement: {
    name: string;
    amount: number;
  };
  products: {
    // unique by product.id
    product: SupermarketProduct;
    specialOfferStartedAt: Date | null;
    lastUpdated: Date;
  }[];
  price: {
    best: {
      unitPrice: number;
      itemPrice: number;
    };
    usual: {
      unitPrice: number;
      itemPrice: number;
    };
    computedAt: Date;
  };
  manualConversions: ManualConversion[];
}

interface HistoryEntry {
  date: Date;
  product: SupermarketProduct;
}

export interface ProductHistoryDocument extends TimestampedDocument {
  productId: string;
  history: HistoryEntry[]; // Reverse chronological order
}

export const $productRepository = Promise.all([
  $comparisonsCollection,
  $historyCollection,
]).then(([comparisonsCollection, historyCollection]) => {
  const priceCalculator = new ProductPriceCalculator(conversionService);

  return new ProductRepository(
    comparisonsCollection,
    historyCollection,
    conversionService,
    priceCalculator
  );
});

export class ProductRepository {
  constructor(
    private readonly priceComparisons: Collection<PriceComparisonDocument>,
    private readonly history: Collection<ProductHistoryDocument>,
    private readonly conversionService: ConversionService,
    private readonly priceCalculator: ProductPriceCalculator
  ) {}

  public async getProduct(
    productId: string,
    updatedAfter?: Date
  ): Promise<SupermarketProduct | null> {
    const query: Filter<PriceComparisonDocument> = {
      products: {
        $elemMatch: {
          ...{
            id: productId,
          },
          ...(updatedAfter
            ? {
                lastUpdated: {
                  $gte: updatedAfter,
                },
              }
            : {}),
        },
      },
    };
    const priceComparison = await this.priceComparisons.findOne(query);
    return (
      priceComparison?.products.find(({ product }) => product.id === productId)
        ?.product ?? null
    );
  }

  public async getProductIds(comparisonId: string): Promise<string[]> {
    const priceComparison = await this.priceComparisons.findOne({
      _id: toId(comparisonId),
    });
    if (!priceComparison) {
      return [];
    }

    return priceComparison.products.map(({ product }) => product.id) ?? [];
  }

  public async createPriceComparison(
    product: SupermarketProduct,
    unit: string,
    unitAmount: number,
    now: Date,
    manualConversion?: ManualConversion
  ): Promise<string> {
    const existingComparison = await this.priceComparisons.findOne({
      'products.product.id': product.id,
    });
    if (existingComparison) {
      console.debug(
        'Comparison for this product already exists:',
        existingComparison._id.toString()
      );
      throw new Error('Comparison for this product already exists');
    }

    const resultComparisonId = await this.createNewPriceComparison(
      product,
      unit,
      unitAmount,
      now,
      manualConversion
    );

    await this.addProductToHistory(product, now);

    return resultComparisonId;
  }

  public async addToComparison(
    comparisonId: string,
    product: SupermarketProduct,
    now: Date,
    manualConversion?: ManualConversion
  ): Promise<string> {
    const existingComparison = await this.priceComparisons.findOne({
      'products.product.id': product.id,
    });
    if (existingComparison) {
      console.debug(
        'Comparison for this product already exists:',
        existingComparison._id.toString()
      );
      throw new Error('Comparison for this product already exists');
    }

    const resultComparisonId = await this.addProductToComparison(
      comparisonId,
      product,
      now,
      manualConversion
    );

    await this.addProductToHistory(product, now);

    return resultComparisonId;
  }

  public async updateCurrentProducts(
    trackingId: string,
    updatedProducts: SupermarketProduct[],
    now: Date
  ): Promise<void> {
    const comparison = await this.priceComparisons.findOne({
      _id: toId(trackingId),
    } as Filter<PriceComparisonDocument>);
    console.debug('Existing entry:', comparison);

    if (!comparison) {
      throw new Error('Comparison does not exist');
    }

    await this.updateProducts(comparison, updatedProducts, now);

    await Promise.all(
      updatedProducts.map((product) => this.addProductToHistory(product, now))
    );
  }

  public async updatePriceComparisonConfig(
    comparisonId: string,
    { name }: { name?: string }
  ): Promise<PriceComparison> {
    const updates: Partial<PriceComparisonDocument> = {};
    if (name) {
      updates.name = name;
    }

    if (!Object.keys(updates).length) {
      throw new Error('No updates provided');
    }

    const { ok, value } = await this.priceComparisons.findOneAndUpdate(
      { _id: toId(comparisonId) },
      { $set: updates },
      { returnDocument: ReturnDocument.AFTER, includeResultMetadata: true }
    );

    if (!ok || !value) {
      throw new Error('Tracking does not exist');
    }

    return convertToPriceComparison(value);
  }

  public async addToHistory(
    product: SupermarketProduct,
    now: Date
  ): Promise<void> {
    await this.addProductToHistory(product, now);

    const trackedProducts = await this.priceComparisons.findOne({
      'products.product.id': product.id,
    });
    if (trackedProducts) {
      await this.updateProducts(trackedProducts, [product], now);
    }
  }

  public async getAllTrackedProducts(): Promise<PriceComparison[]> {
    const priceComparisons = await this.priceComparisons.find({}).toArray();
    return priceComparisons.map((priceComparison) => {
      const {
        _id,
        name,
        products,
        image,
        unitOfMeasurement,
        price,
        manualConversions,
      } = priceComparison;

      return {
        id: _id.toString(),
        name,
        image,
        price,
        unitOfMeasurement: {
          name: unitOfMeasurement.name,
          amount: unitOfMeasurement.amount,
        },
        products: products.map(({ product }) => ({
          ...product,
          pricePerUnit: this.conversionService.convert(
            product.pricePerUnit,
            {
              unit: product.unitName,
              unitAmount: product.unitAmount,
            },
            {
              unit: unitOfMeasurement.name,
              unitAmount: unitOfMeasurement.amount,
            },
            manualConversions
          ),
        })),
      };
    });
  }

  public async getOutdatedProductIds(updatedAfter: Date): Promise<string[]> {
    const comparisons = await this.priceComparisons
      .find({
        'products.lastUpdated': {
          $lt: updatedAfter,
        },
      })
      .toArray();

    function getOutdatedProductIds(
      comparison: PriceComparisonDocument
    ): string[] {
      return comparison.products
        .filter(({ lastUpdated }) => lastUpdated < updatedAfter)
        .map(({ product }) => product.id);
    }

    return comparisons
      .map(getOutdatedProductIds)
      .reduce((acc: string[], curr) => acc.concat(...curr), []);
  }

  public async getAllTrackedIds(): Promise<string[]> {
    return (await this.priceComparisons.find({}).toArray())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce(
        (acc, curr) =>
          acc.concat(curr.products.map(({ product: { id } }) => id)),
        [] as string[]
      );
  }

  /**
   * Returns all tracked products from the set of IDs. The result is a map of itemId => trackedId.
   */
  public async getTrackedIds(itemIds: string[]): Promise<Map<string, string>> {
    const trackedItems = await this.priceComparisons
      .aggregate<{ _id: string; productId: string }>([
        {
          $match: {
            products: {
              $elemMatch: {
                'product.id': {
                  $in: itemIds,
                },
              },
            },
          },
        },
        { $unwind: '$products' },
        {
          $project: { productId: '$products.product.id' },
        },
      ])
      .toArray();

    return new Map(
      trackedItems.map(({ productId, _id }) => [productId, _id.toString()])
    );
  }

  public async removeComparison(comparisonId: string): Promise<void> {
    await this.priceComparisons.deleteOne({ _id: toId(comparisonId) });
  }

  public async removeProductFromComparison(
    comparisonId: string,
    productId: string
  ): Promise<void> {
    const comparison = await this.priceComparisons.findOne({
      _id: toId(comparisonId),
    } as Filter<PriceComparisonDocument>);

    if (!comparison) {
      throw new Error('Comparison does not exist');
    }

    const updatedProducts = comparison.products.filter(
      ({ product }) => product.id !== productId
    );

    const priceComputedAt = comparison.price.computedAt;
    const price = {
      // TODO test this
      best: this.priceCalculator.getBestPrice(
        updatedProducts,
        priceComputedAt,
        comparison.unitOfMeasurement,
        comparison.manualConversions
      ),
      usual: this.priceCalculator.getUsualPrice(
        updatedProducts,
        comparison.unitOfMeasurement,
        comparison.manualConversions
      ),
      computedAt: priceComputedAt,
    };

    await this.priceComparisons.updateOne(
      { _id: toId(comparisonId) },
      {
        $set: {
          products: updatedProducts,
          price,
        },
      }
    );
  }

  /**
   * Debug method only
   */
  public async removeAllComparisons(): Promise<void> {
    await this.priceComparisons.deleteMany({});
  }

  /**
   * Debug method only
   */
  public async removeAllHistory(): Promise<void> {
    await this.history.deleteMany({});
  }

  public async search(searchTerm: string): Promise<PriceComparisonDocument[]> {
    const [fuzzyResults, regexResults] = await Promise.all([
      this.priceComparisons
        .find({
          $text: {
            $search: searchTerm,
            $caseSensitive: false,
            $language: 'english',
          },
        })
        .toArray(),
      this.priceComparisons
        .find({
          $or: [
            { 'products.product.name': { $regex: searchTerm, $options: '$i' } },
            { name: { $regex: searchTerm, $options: '$i' } },
          ],
        })
        .toArray(),
    ]);

    return [...fuzzyResults, ...regexResults].filter(
      unique(({ _id }) => _id.toString())
    );
  }

  public async getHistory(
    productId: string
  ): Promise<{ date: Date; price: number; pricePerUnit: number }[]> {
    const historyData = await this.history.findOne({ productId });
    if (!historyData) {
      throw new EntityNotFoundError(productId);
    }
    return historyData.history.map(
      ({ date, product: { price, pricePerUnit } }) => ({
        date,
        price,
        pricePerUnit,
      })
    );
  }

  public async getProductsWithSpecialOffersStartingSince(
    startDate: Date
  ): Promise<PriceComparison[]> {
    console.log(startDate);

    return (
      await this.priceComparisons
        .find({
          'products.specialOfferStartedAt': { $gte: startDate },
        })
        .toArray()
    ).map(convertToPriceComparison);
  }

  private async updateProducts(
    comparison: PriceComparisonDocument,
    updatedProducts: SupermarketProduct[],
    now: Date
  ): Promise<void> {
    const products = comparison.products.slice();

    for (const updatedProduct of updatedProducts) {
      const existingProductIndex = comparison.products.findIndex(
        ({ product }) => product.id === updatedProduct.id
      );
      if (existingProductIndex < 0) {
        throw new Error('Product not found');
      }
      const existingProduct = products[existingProductIndex];
      if (existingProduct.lastUpdated < now) {
        const oldSpecialOffer = existingProduct.product.specialOffer;
        const newSpecialOffer = updatedProduct.specialOffer;
        const specialOfferStartedAt = newSpecialOffer
          ? compareSpecialOffers(oldSpecialOffer, newSpecialOffer)
            ? existingProduct.specialOfferStartedAt
            : now
          : null;

        products[existingProductIndex] = {
          ...existingProduct,
          product: updatedProduct,
          specialOfferStartedAt,
          lastUpdated: now,
        };
      }
    }

    const price = {
      best: this.priceCalculator.getBestPrice(
        products,
        now,
        comparison.unitOfMeasurement,
        comparison.manualConversions
      ),
      usual: this.priceCalculator.getUsualPrice(
        products,
        comparison.unitOfMeasurement,
        comparison.manualConversions
      ),
      computedAt: now,
    };

    let image: MatchKeysAndValues<PriceComparisonDocument> = {};
    if (!comparison.image) {
      const images = products
        .map(({ product: { image } }) => image)
        .filter(Boolean);
      if (images.length) {
        image = {
          image: images[0],
        };
      }
    }

    const result = await this.priceComparisons.updateOne(
      { _id: comparison._id },
      {
        $set: {
          products,
          updatedAt: now,
          lastUpdated: now,
          price,
          ...image,
        },
      }
    );
    console.debug('Updated', result);
  }

  private async addProductToHistory(
    product: SupermarketProduct,
    now: Date
  ): Promise<void> {
    const entry = await this.history.findOne({
      productId: product.id,
    });

    if (entry) {
      const updatedEntry: Partial<ProductHistoryDocument> = {
        history: this.addHistoryEntry(entry.history, product, now),
        updatedAt: now,
      };
      console.debug('Updating history entry', updatedEntry);
      await this.history.updateOne(
        { _id: toId(entry._id) },
        { $set: updatedEntry }
      );
    } else {
      const newEntry: OptionalId<ProductHistoryDocument> = {
        productId: product.id,
        history: this.addHistoryEntry([], product, now),
        createdAt: now,
        updatedAt: now,
      };
      console.debug('Creating history entry', newEntry);
      await this.history.insertOne(newEntry as ProductHistoryDocument);
    }
  }

  private addHistoryEntry(
    history: HistoryEntry[],
    product: SupermarketProduct,
    now: Date
  ): HistoryEntry[] {
    const newEntry: HistoryEntry = {
      date: now,
      product,
    };
    for (let i = 0; i < history.length; i++) {
      if (Math.abs(differenceInMinutes(now, history[i].date)) < 5) {
        // Don't create closely-spaced history entries
        history[i] = newEntry;
        return history;
      }
      if (history[i].date.getTime() < now.getTime()) {
        const copy = history.slice();
        copy.splice(i, 0, newEntry);
        return copy;
      }
    }
    return [...history, newEntry];
  }

  private async addProductToComparison(
    trackingId: string,
    product: SupermarketProduct,
    now: Date,
    manualConversion?: ManualConversion
  ): Promise<string> {
    const comparison = await this.priceComparisons.findOne({
      _id: toId(trackingId),
    } as Filter<PriceComparisonDocument>);

    if (!comparison) {
      throw new Error('Comparison ID does not exist');
    }
    console.debug('Existing entry:', comparison);
    if (
      manualConversion &&
      !this.conversionService.canAddManualConversion(
        comparison.manualConversions,
        manualConversion
      )
    ) {
      throw new Error('Cannot add manual conversion');
    }

    const convertableUnits = this.conversionService.getConvertableUnits(
      comparison.products.map(({ product: { unitName } }) => unitName),
      [...comparison.manualConversions, ...[manualConversion].filter(exists)]
    );
    if (!convertableUnits.includes(product.unitName)) {
      throw new CannotConvertError(
        comparison.unitOfMeasurement.name,
        product.unitName
      );
    }

    const manualConversions = [
      ...comparison.manualConversions,
      ...(manualConversion ? [manualConversion] : []),
    ];

    const products = [...comparison.products, { product, lastUpdated: now }];

    const price = {
      best: this.priceCalculator.getBestPrice(
        products,
        now,
        comparison.unitOfMeasurement,
        manualConversions
      ),
      usual: this.priceCalculator.getUsualPrice(
        products,
        comparison.unitOfMeasurement,
        manualConversions
      ),
      computedAt: now,
    };

    await this.priceComparisons.updateOne(
      {
        _id: toId(trackingId),
      } as Filter<PriceComparisonDocument>,
      {
        $push: {
          products: {
            product,
            specialOfferStartedAt: product.specialOffer ? now : null, // TODO this should check the history for if the offer has been going on longer
            lastUpdated: now,
          },
        },
        $set: {
          price,
          manualConversions,
          updatedAt: now,
        },
      }
    );
    return trackingId;
  }

  private async createNewPriceComparison(
    product: SupermarketProduct,
    unitName: string,
    unitAmount: number,
    now: Date,
    manualConversion?: ManualConversion
  ): Promise<string> {
    const newEntry: WithoutId<PriceComparisonDocument> = {
      name: product.name,
      image: product.image,
      unitOfMeasurement: {
        amount: unitAmount,
        name: unitName,
      },
      price: {
        best: {
          itemPrice: product.price,
          unitPrice: product.pricePerUnit,
        },
        usual: product.specialOffer
          ? {
              itemPrice: product.specialOffer.originalPrice ?? 0,
              unitPrice: product.specialOffer.originalPricePerUnit ?? 0,
            }
          : {
              itemPrice: product.price,
              unitPrice: product.pricePerUnit,
            },
        computedAt: now,
      },
      products: [
        {
          product,
          specialOfferStartedAt: product.specialOffer ? now : null,
          lastUpdated: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      manualConversions: manualConversion ? [manualConversion] : [],
    };

    const result = await this.priceComparisons.insertOne(
      newEntry as PriceComparisonDocument
    );
    return result.insertedId.toString();
  }
}

function convertToPriceComparison(
  value: PriceComparisonDocument
): PriceComparison {
  return {
    id: value._id.toString(),
    name: value.name,
    image: value.image,
    unitOfMeasurement: {
      name: value.unitOfMeasurement.name,
      amount: value.unitOfMeasurement.amount,
    },
    price: {
      best: value.price.best,
      usual: value.price.usual,
    },
    products: value.products.map(
      ({ product }): ComparisonProductData => ({
        id: product.id,
        name: product.name,
        url: product.url,
        image: product.image,
        packSize: {
          unit: product.packSize.unit,
          amount: product.packSize.amount,
        },
        price: product.price,
        pricePerUnit: product.pricePerUnit,
        supermarket: product.supermarket,
        specialOffer: product.specialOffer,
      })
    ),
  };
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
