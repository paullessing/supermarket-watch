import { Collection, Filter, MongoClient, OptionalUnlessRequiredId, WithId } from 'mongodb';
import { Config } from '../config';

export class Repository<T extends { _id: string }> {

  public get db(): Collection<T> {
    return this._db;
  }
  private _db: Collection<T>;

  public readonly initialised: Promise<void>;

  constructor(
    private config: Config,
    private collectionName: string,
  ) {
    const client = new MongoClient('mongodb://mongo:27017');

    this.initialised = client.connect().then(() => {
      console.log('Connected successfully to server');
      const db = client.db('shopping');
      this._db = db.collection<T>(this.collectionName);
    })
  }

  public async findAll(): Promise<WithId<T>[]> {
    await this.initialised;
    return this.db.find({}).toArray();
  }

  public async findOne(id: string): Promise<WithId<T> | null> {
    await this.initialised;
    return await this.db.findOne({ _id: id } as Filter<any>);
  }

  // TODO fix the typing on this
  public async create(item: OptionalUnlessRequiredId<T>): Promise<T> {
    await this.initialised;
    const { insertedId } = await this.db.insertOne(item);
    return {
      ...item as T,
      _id: insertedId
    };
  }

  public async count(query: Filter<T>): Promise<number> {
    await this.initialised;
    return await this.db.countDocuments(query as Filter<any>);
  }

  public async update(item: T): Promise<T> {
    await this.initialised;
    await this.db.updateOne({ _id: item._id } as Filter<any>, item);
    return item;
  }

  public async removeOne(query: Filter<T>): Promise<number> {
    await this.initialised;
    const result = await this.db.deleteOne(query as Filter<any>);
    return result.deletedCount;
  }
}
