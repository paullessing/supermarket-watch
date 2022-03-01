import { Provider } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';

const DATABASE = Symbol('Database');
export const TRACKING_COLLECTION = Symbol('TRACKING_COLLECTION');
export const HISTORY_COLLECTION = Symbol('HISTORY_COLLECTION');

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

      // TODO remove after running in prod
      const update = await collection.updateMany({ unitName: { $exists: false } }, [
        {
          $addFields: {
            unitName: { $first: '$products.product.unitName' },
            unitAmount: { $first: '$products.product.unitAmount' },
          },
        },
      ]);

      console.log('UPDATED unit names', update);

      return collection;
    },
    inject: [DATABASE],
  },
  {
    provide: HISTORY_COLLECTION,
    useFactory: async (db: Db) => {
      const collection = db.collection('productHistory');
      await collection.createIndex(
        {
          productId: 1,
        },
        {
          unique: true,
          sparse: false,
        }
      );
      return collection;
    },
    inject: [DATABASE],
  },
];
