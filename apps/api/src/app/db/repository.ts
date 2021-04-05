import Nedb from 'nedb';
import * as path from 'path';
import { Config } from '../config';
import Datastore from 'nedb-promises';

export abstract class Repository {

  protected readonly db: Datastore;

  protected constructor(
    private config: Config,
    private fileName: string,
  ) {
    const dbConfig: Nedb.DataStoreOptions = config.dbDirPath ? {
      inMemoryOnly: true,
      timestampData: true,
    } : {
      inMemoryOnly: false,
      timestampData: true,
      filename: path.join(config.dbDirPath, fileName),
      autoload: true,
    }
    console.log('Creating DB with config:', dbConfig);
    this.db = Datastore.create(dbConfig);
  }
}
