import { Provider } from '@nestjs/common';
import { Db, MongoClient } from 'mongodb';
import { compareSpecialOffers } from '@shoppi/api-interfaces';
import { SupermarketList } from '../supermarkets/supermarket-list.service'; // DO NOT SHORTEN - CAUSES CIRCULAR DEPENDENCY
import { PriceComparisonDocument, ProductHistoryDocument } from './product-repository.service';

const DATABASE = Symbol('Database');
export const COMPARISONS_COLLECTION = Symbol('TRACKING_COLLECTION');
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
];

async function runComparisonsMigration(db: Db): Promise<void> {
  console.log('\n=============== RUNNING MIGRATION: Comparisons ==================\n');

  const collection = db.collection<PriceComparisonDocument>('priceComparisons');
  const history = db.collection<ProductHistoryDocument>('productHistory');
  const comparisons = await collection.find({}).toArray();

  for (const comparison of comparisons) {
    const products = comparison.products;

    const newProducts = await Promise.all(
      products.map(async (productData) => {
        if (productData.product.specialOffer) {
          const productHistory = await history.findOne({ productId: productData.product.id });
          if (!productHistory) {
            console.log(`Failed to update item ${productData.product.id}: no history entries`);
            process.exit(1);
          }
          const now = new Date();
          let startDate = now;
          let index = 0;
          while (
            compareSpecialOffers(productHistory.history[index].product.specialOffer, productData.product.specialOffer)
          ) {
            index++;
            startDate = productHistory.history[index].date;
          }
          if (now === startDate) {
            console.warn(
              `Product ${productData.product.name} (${productData.product.supermarket}) has default start date`
            );
          }
          return {
            ...productData,
            specialOfferStartedAt: startDate,
          };
        } else {
          return {
            ...productData,
            specialOfferStartedAt: null,
          };
        }
      })
    );

    await collection.updateOne(
      {
        _id: comparison._id,
      },
      {
        $set: {
          products: newProducts,
        },
      }
    );

    console.log(`Updated product comparison "${comparison.name}":`);
    for (const product of newProducts) {
      console.log(
        `  [${product.product.supermarket}] ${product.product.name}: ${
          product.specialOfferStartedAt?.toISOString() || 'null'
        }`
      );
    }
  }

  console.log('\n=============== MIGRATION COMPLETE: Comparisons ==================\n');
}
