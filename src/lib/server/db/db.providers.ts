import { Db, MongoClient } from 'mongodb';
import type { PriceComparisonDocument, ProductHistoryDocument } from './product-repository.service';
import { config } from '$lib/server/config';

const $db: Promise<Db> = MongoClient.connect(`mongodb://${config.mongoHost}:27017`).then(
  (client: MongoClient): Db => client.db('shopping')
);

export const $comparisonsCollection = $db.then(async (db) => {
  const collection = db.collection<PriceComparisonDocument>('priceComparisons');
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
});

export const $historyCollection = $db.then(async (db) => {
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
});
