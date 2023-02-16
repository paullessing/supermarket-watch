import { Provider } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { SupermarketList } from '../supermarkets/supermarket-list.service'; // DO NOT SHORTEN - CAUSES CIRCULAR DEPENDENCY
import { ProductHistoryDocument } from './product-repository.service';

const DATABASE = Symbol('Database');
export const COMPARISONS_COLLECTION = Symbol('TRACKING_COLLECTION');
export const HISTORY_COLLECTION = Symbol('HISTORY_COLLECTION');
export const ISSUES_COLLECTION = Symbol('ISSUES_COLLECTION');

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
    useFactory: async (db: Db) => {
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

      return collection;
    },
  },
  {
    provide: ISSUES_COLLECTION,
    inject: [DATABASE],
    useFactory: async (db: Db) => {
      const collection = db.collection('issues');
      await collection.createIndexes([
        {
          key: { productId: 1 },
          unique: true,
          sparse: false,
        },
      ]);

      return collection;
    },
  },
];
