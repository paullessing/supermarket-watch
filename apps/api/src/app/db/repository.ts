import { Collection, Filter, MongoClient, ObjectId, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { Config } from '../config';

export class Repository<T extends { _id: ObjectId | string }> {
  public get db(): Collection<T> {
    return this._db;
  }
  private _db: Collection<T>;

  public readonly initialised: Promise<void>;

  constructor(private readonly config: Config, collectionName: string) {
    const client = new MongoClient('mongodb://mongo:27017');

    this.initialised = client.connect().then(() => {
      console.log('Connected successfully to server');
      const db = client.db('shopping');
      this._db = db.collection<T>(collectionName);
    });
  }

  public async findAll(): Promise<WithId<T>[]> {
    await this.initialised;
    return this.db.find({}).toArray();
  }

  public async findOne(id: string | ObjectId): Promise<WithId<T> | null> {
    await this.initialised;
    const _id = typeof id === 'string' ? new ObjectId(id) : id;
    return await this.db.findOne({
      _id,
    } as Filter<any>); /* eslint-disable-line @typescript-eslint/no-explicit-any */
  }

  public async create(item: OptionalUnlessRequiredId<T>): Promise<T> {
    await this.initialised;
    const { insertedId } = await this.db.insertOne(item);
    return {
      ...(item as T),
      _id: insertedId,
    };
  }

  public async count(query: Filter<T>): Promise<number> {
    await this.initialised;
    return await this.db.countDocuments(
      query as Filter<any> /* eslint-disable-line @typescript-eslint/no-explicit-any */
    );
  }

  public async update(item: T): Promise<T> {
    await this.initialised;
    if (!item._id) {
      throw new Error('Cannot update: item is missing _id field');
    }
    const _id = typeof item._id === 'string' ? new ObjectId(item._id) : item._id;
    console.log(
      'Update Pending:',
      { _id } as Filter<any> /* eslint-disable-line @typescript-eslint/no-explicit-any */,
      {
        $set: item,
      }
    );
    const result = await this.db.updateOne(
      { _id } as Filter<any> /* eslint-disable-line @typescript-eslint/no-explicit-any */,
      {
        $set: item,
      }
    );

    console.log('Update', result);
    return item;
  }

  public async removeOne(query: Filter<T>): Promise<number> {
    await this.initialised;
    const result = await this.db.deleteOne(
      query as Filter<any> /* eslint-disable-line @typescript-eslint/no-explicit-any */
    );
    return result.deletedCount;
  }
}
