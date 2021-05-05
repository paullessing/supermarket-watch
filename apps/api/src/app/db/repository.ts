import Nedb, { DataStoreOptions } from 'nedb';
import * as path from 'path';
import { Config } from '../config';
import Datastore from 'nedb-promises';
import { InsertQuery } from './nedb-document';

export class Repository<T extends { _id: string }> {

  public readonly db: Datastore;

  constructor(
    private config: Config,
    private fileName: string,
    private dbConfigOptions: DataStoreOptions = {}
  ) {
    const dbConfig: Nedb.DataStoreOptions = config.dbDirPath ? {
      inMemoryOnly: false,
      timestampData: true,
      filename: path.join(config.dbDirPath, fileName),
      autoload: true,
      ...dbConfigOptions,
    } : {
      inMemoryOnly: true,
      timestampData: true,
      ...dbConfigOptions,
    };
    // console.log('Creating DB with config:', dbConfig);
    this.db = Datastore.create(dbConfig);
  }

  public async findAll(): Promise<T[]> {
    return this.db.find({});
  }

  public async findOne(id: string): Promise<T | null> {
    return await this.db.findOne({ _id: id });
  }

  public async create(item: InsertQuery<T>): Promise<T> {
    return await this.db.insert(item) as unknown as T;
  }

  public async count(query: any): Promise<number> {
    return await this.db.count(query);
  }

  public async update(item: T): Promise<T> {
    await this.db.update({ _id: item._id }, item);
    return item;
  }

  public async removeOne(query: any): Promise<number> {
    return await this.db.remove(query, { multi: false });
  }
}
