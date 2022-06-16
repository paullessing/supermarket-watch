import { Provider } from '@nestjs/common';
import { Collection, Db, MongoClient } from 'mongodb';
import { SupermarketList, SupermarketProduct } from '../supermarkets';
import { ProductHistoryDocument } from './tracked-products.repository';

const DATABASE = Symbol('Database');
export const TRACKING_COLLECTION = Symbol('TRACKING_COLLECTION');
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
    provide: TRACKING_COLLECTION,
    useFactory: async (db: Db) => {
      const collection = db.collection('trackedProducts');
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
    inject: [DATABASE],
  },
  {
    provide: HISTORY_COLLECTION,
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
    inject: [DATABASE],
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
