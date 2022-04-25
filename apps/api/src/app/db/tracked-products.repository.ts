import { Inject, Injectable } from '@nestjs/common';
import { compareDesc, differenceInMinutes, isAfter, isBefore, startOfDay, sub } from 'date-fns';
import { Collection, Filter, ObjectId, OptionalId, ReturnDocument, WithoutId } from 'mongodb';
import { ComparisonProductData, ManualConversion, PriceComparison } from '@shoppi/api-interfaces';
import { CannotConvertError } from '../cannot-convert.error';
import { ConversionService } from '../conversion.service';
import { SupermarketProduct } from '../supermarkets';
import { exists, unique } from '../util';
import { HISTORY_COLLECTION, TRACKING_COLLECTION } from './db.providers';
import { EntityNotFoundError } from './entity-not-found.error';
import { TimestampedDocument } from './timestamped-document';

export interface PriceComparisonDocument extends TimestampedDocument {
  name: string;
  image: string;
  unitOfMeasurement: {
    name: string;
    amount: number;
  };
  products: {
    product: SupermarketProduct;
    lastUpdated: Date;
  }[];
  pricePerUnit: {
    best: number;
    usual: number;
  };
  manualConversions: ManualConversion[];
}

interface HistoryEntry {
  date: Date;
  product: SupermarketProduct;
}

export interface ProductHistory extends TimestampedDocument {
  productId: string;
  history: HistoryEntry[];
}

@Injectable()
export class TrackedProductsRepository {
  constructor(
    @Inject(TRACKING_COLLECTION) private readonly priceComparisons: Collection<PriceComparisonDocument>,
    @Inject(HISTORY_COLLECTION) private readonly history: Collection<ProductHistory>,
    private readonly conversionService: ConversionService
  ) {}

  public async getProduct(productId: string, updatedAfter?: Date): Promise<SupermarketProduct | null> {
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
    return priceComparison?.products.find(({ product }) => product.id === productId)?.product ?? null;
  }

  public async getProductIds(comparisonId: string): Promise<string[]> {
    const priceComparison = await this.priceComparisons.findOne({ _id: toId(comparisonId) });
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
    const existingComparison = await this.priceComparisons.findOne({ 'products.product.id': product.id });
    if (existingComparison) {
      console.debug('Comparison for this product already exists:', existingComparison._id.toString());
      throw new Error('Comparison for this product already exists');
    }

    const resultComparisonId = await this.createNewPriceComparison(product, unit, unitAmount, now, manualConversion);

    await this.addProductToHistory(product, now);

    return resultComparisonId;
  }

  public async addToComparison(
    comparisonId: string,
    product: SupermarketProduct,
    now: Date,
    manualConversion?: ManualConversion
  ): Promise<string> {
    const existingComparison = await this.priceComparisons.findOne({ 'products.product.id': product.id });
    if (existingComparison) {
      console.debug('Comparison for this product already exists:', existingComparison._id.toString());
      throw new Error('Comparison for this product already exists');
    }

    const resultComparisonId = await this.addProductToComparison(comparisonId, product, now, manualConversion);

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

    await Promise.all(updatedProducts.map((product) => this.addProductToHistory(product, now)));
  }

  public async updatePriceComparisonConfig(comparisonId: string, { name }: { name?: string }): Promise<PriceComparison> {
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
      { returnDocument: ReturnDocument.AFTER }
    );

    if (!ok || !value) {
      throw new Error('Tracking does not exist');
    }

    return this.convertToPriceComparison(value);
  }

  public async addToHistory(product: SupermarketProduct, now: Date): Promise<void> {
    await this.addProductToHistory(product, now);

    const trackedProducts = await this.priceComparisons.findOne({
      'products.product.id': product.id,
    });
    if (trackedProducts) {
      await this.updateProducts(trackedProducts, [product], now);
    }
  }

  public async getAllTrackedProducts(now: Date): Promise<PriceComparison[]> {
    const trackedProducts = await this.priceComparisons.find({}).toArray();
    return trackedProducts.map(({ _id, name, image, products, unitOfMeasurement, manualConversions }) => {
      return {
        id: _id.toString(),
        name,
        image,
        pricePerUnit: this.getBestPrice(products, now, unitOfMeasurement, manualConversions),
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

    function getOutdatedProductIds(comparison: PriceComparisonDocument): string[] {
      return comparison.products
        .filter(({ lastUpdated }) => lastUpdated < updatedAfter)
        .map(({ product }) => product.id);
    }

    return comparisons.map(getOutdatedProductIds).reduce((acc: string[], curr) => acc.concat(...curr), []);
  }

  public async getAllTrackedIds(): Promise<string[]> {
    return (await this.priceComparisons.find({}).toArray())
      .sort((a, b) => a.createdAt.getDate() - b.createdAt.getDate())
      .reduce((acc, curr) => acc.concat(curr.products.map(({ product: { id } }) => id)), [] as string[]);
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

    return new Map(trackedItems.map(({ productId, _id }) => [productId, _id]));
  }

  public async removeComparison(comparisonId: string): Promise<void> {
    await this.priceComparisons.deleteOne({ _id: toId(comparisonId) });
  }

  public async removeProductFromComparison(comparisonId: string, productId: string): Promise<void> {
    const comparison = await this.priceComparisons.findOne({
      _id: toId(comparisonId),
    } as Filter<PriceComparisonDocument>);

    if (!comparison) {
      throw new Error('Comparison does not exist');
    }

    const updatedProducts = comparison.products.filter(({ product }) => product.id !== productId);

    await this.priceComparisons.updateOne(
      { _id: toId(comparisonId) },
      {
        $set: {
          products: updatedProducts,
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
          $text: { $search: searchTerm, $caseSensitive: false, $language: 'english' },
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

    return [...fuzzyResults, ...regexResults].filter(unique(({ _id }) => _id.toString()));
  }

  public async getHistory(productId: string): Promise<{ date: Date; price: number; pricePerUnit: number }[]> {
    const historyData = await this.history.findOne({ productId });
    if (!historyData) {
      throw new EntityNotFoundError(productId);
    }
    return historyData.history.map(({ date, product: { price, pricePerUnit } }) => ({ date, price, pricePerUnit }));
  }

  private async updateProducts(
    comparison: PriceComparisonDocument,
    updatedProducts: SupermarketProduct[],
    now: Date
  ): Promise<void> {
    const products = comparison.products.slice();

    for (const updatedProduct of updatedProducts) {
      const existingProductIndex = comparison.products.findIndex(({ product }) => product.id === updatedProduct.id);
      if (existingProductIndex < 0) {
        throw new Error('Product not found');
      }
      const existingProduct = products[existingProductIndex];
      if (existingProduct.lastUpdated < now) {
        products[existingProductIndex] = {
          ...existingProduct,
          product: updatedProduct,
          lastUpdated: now,
        };
      }
    }

    const result = await this.priceComparisons.updateOne(
      { _id: comparison._id },
      {
        $set: {
          products,
          lastUpdated: now,
        },
      }
    );
    console.debug('Updated', result);
  }

  private async addProductToHistory(product: SupermarketProduct, now: Date): Promise<void> {
    const entry = await this.history.findOne({
      productId: product.id,
    });

    if (entry) {
      const updatedEntry: Partial<ProductHistory> = {
        history: this.addHistoryEntry(entry.history, product, now),
        updatedAt: now,
      };
      console.debug('Updating history entry', updatedEntry);
      await this.history.updateOne({ _id: toId(entry._id) }, { $set: updatedEntry });
    } else {
      const newEntry: OptionalId<ProductHistory> = {
        productId: product.id,
        history: this.addHistoryEntry([], product, now),
        createdAt: now,
        updatedAt: now,
      };
      console.debug('Creating history entry', newEntry);
      await this.history.insertOne(newEntry as ProductHistory);
    }
  }

  private addHistoryEntry(history: HistoryEntry[], product: SupermarketProduct, now: Date): HistoryEntry[] {
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
      !this.conversionService.canAddManualConversion(comparison.manualConversions, manualConversion)
    ) {
      throw new Error('Cannot add manual conversion');
    }

    const convertableUnits = this.conversionService.getConvertableUnits(
      comparison.products.map(({ product: { unitName } }) => unitName),
      [...comparison.manualConversions, ...[manualConversion].filter(exists)]
    );
    if (!convertableUnits.includes(product.unitName)) {
      throw new CannotConvertError(comparison.unitOfMeasurement.name, product.unitName);
    }

    const price = this.getBestPrice(
      [...comparison.products, { product, lastUpdated: now }],
      now,
      { name: product.unitName, amount: product.unitAmount },
      comparison.manualConversions
    );

    await this.priceComparisons.updateOne(
      {
        _id: toId(trackingId),
      } as Filter<PriceComparisonDocument>,
      {
        $push: {
          products: {
            product,
            lastUpdated: now,
          },
          ...(manualConversion ? { manualConversions: manualConversion } : {}),
        },
        $set: {
          pricePerUnit: price,
          updatedAt: now,
        },
      }
    );
    return trackingId;
  }

  private getBestPrice(
    products: { product: SupermarketProduct; lastUpdated: Date }[],
    now: Date,
    targetUnit: { name: string; amount: number },
    manualConversions: ManualConversion[]
  ): {
    best: number;
    usual: number;
  } {
    const today = startOfDay(now);
    const recentProducts = products
      .sort((a, b) => compareDesc(a.lastUpdated, b.lastUpdated))
      .filter(({ lastUpdated }) => isAfter(lastUpdated, today))
      .filter(unique(({ product: { supermarket } }) => supermarket));

    const best =
      recentProducts.reduce((best: number | null, { product: { pricePerUnit, unitName, unitAmount } }) => {
        const value = this.conversionService.convert(
          pricePerUnit,
          { unit: unitName, unitAmount },
          { unit: targetUnit.name, unitAmount: targetUnit.amount },
          manualConversions
        );

        return best === null ? value : Math.min(best, value);
      }, null) ?? 0;

    // TODO Pretty sure this is operating on the wrong data. Check that it's actually comparing across all the history we have
    // We likely shouldn't be iterating over anything, just storing every time we get an update
    const usualPrices: { [supermarketName: string]: number } = {};
    const currentMonth = sub(today, { months: 1 });
    for (const { product, lastUpdated } of products) {
      if (isBefore(lastUpdated, currentMonth)) {
        break;
      }
      const pricePerUnit = (product.specialOffer && product.specialOffer.originalPricePerUnit) ?? product.pricePerUnit;

      const convertedPricePerUnit = this.conversionService.convert(
        pricePerUnit,
        { unit: product.unitName, unitAmount: product.unitAmount },
        { unit: targetUnit.name, unitAmount: targetUnit.amount },
        manualConversions
      );

      if (usualPrices[product.supermarket] === undefined || usualPrices[product.supermarket] > convertedPricePerUnit) {
        usualPrices[product.supermarket] = convertedPricePerUnit;
      }
    }

    const usualPrice = Object.values(usualPrices).reduce(
      (usual, price) => Math.min(usual, price),
      Number.POSITIVE_INFINITY
    );

    return { best, usual: usualPrice === Number.POSITIVE_INFINITY ? 0 : usualPrice };
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
      pricePerUnit: {
        best: product.pricePerUnit,
        usual: product.specialOffer ? 0 : product.pricePerUnit,
      },
      products: [{ product, lastUpdated: now }],
      createdAt: now,
      updatedAt: now,
      manualConversions: manualConversion ? [manualConversion] : [],
    };

    const result = await this.priceComparisons.insertOne(newEntry as PriceComparisonDocument);
    return result.insertedId.toString();
  }

  private convertToPriceComparison(value: PriceComparisonDocument): PriceComparison {
    return {
      id: value._id.toString(),
      name: value.name,
      image: value.image,
      unitOfMeasurement: {
        name: value.unitOfMeasurement.name,
        amount: value.unitOfMeasurement.amount,
      },
      pricePerUnit: {
        best: value.pricePerUnit.best,
        usual: value.pricePerUnit.usual,
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
}

function toId(id: string | ObjectId): ObjectId {
  return typeof id === 'string' ? new ObjectId(id) : id;
}
