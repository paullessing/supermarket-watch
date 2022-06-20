import { Provider } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { SupermarketProduct } from '../supermarket-product.model';
import { SupermarketList } from '../supermarkets/supermarket-list.service';
import { PriceComparisonDocument, ProductHistoryDocument } from './tracked-products.repository';

const DATABASE = Symbol('Database');
export const COMPARISONS_COLLECTION = Symbol('TRACKING_COLLECTION');
export const HISTORY_COLLECTION = Symbol('HISTORY_COLLECTION');

const productCache: Map<string, SupermarketProduct> = new Map();

export const dbProviders: Provider[] = [
  {
    provide: DATABASE,
    useFactory: async () => {
      const client = await MongoClient.connect('mongodb://mongo:27017');
      return client.db('shopping');
    },
  },
  {
    provide: COMPARISONS_COLLECTION,
    inject: [DATABASE],
    useFactory: async (db: Db) => {
      if (process.env['RUN_MIGRATION'] === 'true') {
        await runComparisonsMigration(db);
      }

      const collection = db.collection('priceComparisons');
      await collection.createIndexes([
        {
          key: { 'products.product.id': 1 },
          unique: true,
          sparse: false,
        },
        {
          key: {
            'products.product.name': 'text',
            name: 'text',
          },
        },
      ]);

      return collection;
    },
  },
  {
    provide: HISTORY_COLLECTION,
    inject: [DATABASE, SupermarketList],
    useFactory: async (db: Db, supermarketList: SupermarketList) => {
      const collection = db.collection<ProductHistoryDocument>('productHistory');
      await collection.createIndex(
        {
          productId: 1,
        },
        {
          unique: true,
          sparse: false,
        }
      );

      if (process.env['RUN_MIGRATION'] === 'true') {
        await runHistoryMigration(collection, supermarketList);
      }

      return collection;
    },
  },
];

async function runHistoryMigration(
  collection: Collection<ProductHistoryDocument>,
  supermarketList: SupermarketList
): Promise<void> {
  console.log('\n=============== RUNNING MIGRATION: History ==================\n');

  const entries = await collection.find({}).toArray();
  await Promise.all(
    entries.map(async (doc: ProductHistoryDocument) => {
      console.log('Updating product: ' + doc.productId);
      const product = productCache.get(doc.productId) ?? (await supermarketList.fetchProduct(doc.productId));
      console.log('Fetched product: ' + doc.productId);

      const historyEntries = doc.history.map((entry) => ({
        ...entry,
        product: {
          ...entry.product,
          image: entry.product.image ?? product.image,
          url: entry.product.url ?? product.url,
          packSize: entry.product.packSize ?? product.packSize,
        },
      }));

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            historyEntries,
          },
        }
      );
      console.log('Update complete product: ' + doc.productId);
    })
  );
  console.log('\n=============== MIGRATION COMPLETE: History ==================\n');
}

async function runComparisonsMigration(db: Db): Promise<void> {
  console.log('\n=============== RUNNING MIGRATION: Comparisons ==================\n');
  const collections = await (await db.listCollections()).toArray();
  const collectionNames = collections.map(({ name }) => name);
  if (collectionNames.includes('trackedProducts') && !collectionNames.includes('priceComparisons')) {
    await db.renameCollection('trackedProducts', 'priceComparisons');
  }

  const collection = db.collection<PriceComparisonDocument>('priceComparisons');
  const comparisons = await collection.find({}).toArray();

  for (const comparison of comparisons) {
    const unitOfMeasurement: PriceComparisonDocument['unitOfMeasurement'] = {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      name: comparison?.unitOfMeasurement?.name ?? (comparison as any).unitName,
      amount: comparison?.unitOfMeasurement?.amount ?? (comparison as any).unitAmount,
      /* eslint-enable @typescript-eslint/no-explicit-any */
    };
    if (
      unitOfMeasurement.amount !== comparison.unitOfMeasurement?.amount ||
      unitOfMeasurement.name !== comparison.unitOfMeasurement?.name
    ) {
      console.log('Updating document', comparison._id, unitOfMeasurement);
      await collection.updateOne(
        { _id: comparison._id },
        {
          $set: {
            unitOfMeasurement,
          },
        }
      );
    }
  }

  console.log('\n=============== MIGRATION COMPLETE: Comparisons ==================\n');
}
