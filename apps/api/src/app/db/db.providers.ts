import { Provider } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { standardiseUnit } from '@shoppi/api-interfaces';
import { ProductHistory, TrackedProducts } from './tracked-products.repository';

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

      // Remove after release of "unify units" branch
      const products = await collection.find<TrackedProducts>({}).toArray();
      await Promise.all(
        products.map(async (trackedProducts) => {
          let hasUpdate = false;
          if (trackedProducts.unitName !== standardiseUnit(trackedProducts.unitName)) {
            trackedProducts.unitName = standardiseUnit(trackedProducts.unitName);
            hasUpdate = true;
          }
          for (const product of trackedProducts.products) {
            if (product.product.unitName !== standardiseUnit(product.product.unitName)) {
              product.product.unitName = standardiseUnit(product.product.unitName);
              hasUpdate = true;
            }
          }
          if (hasUpdate) {
            const updateResult = await collection.updateOne({ _id: trackedProducts._id }, trackedProducts);
            console.log('Updated to fix units', updateResult);
          }
        })
      );

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

      // Remove after release of "unify units" branch
      const productHistories = await collection.find<ProductHistory>({}).toArray();
      await Promise.all(
        productHistories.map(async (productHistory) => {
          let hasUpdate = false;
          for (const historyEntry of productHistory.history) {
            if (historyEntry.product.unitName !== standardiseUnit(historyEntry.product.unitName)) {
              historyEntry.product.unitName = standardiseUnit(historyEntry.product.unitName);
              hasUpdate = true;
            }
          }

          if (hasUpdate) {
            const updateResult = await collection.updateOne({ _id: productHistory._id }, productHistory);
            console.log('Updated to fix units', updateResult);
          }
        })
      );

      return collection;
    },
    inject: [DATABASE],
  },
];
