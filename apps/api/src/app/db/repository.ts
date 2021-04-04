import * as path from 'path';
import { Config } from '../config';
import Datastore from 'nedb-promise';

export abstract class Repository {

  private db: Datastore;

  constructor(
    private config: Config,
    private fileName: string,
  ) {
    const dbConfig: Datastore.DataStoreOptions = config.dbDirPath ? {
      inMemoryOnly: true,
    } : {
      inMemoryOnly: false,
      filename: path.join(config.dbDirPath, fileName),
      autoload: true,
    }
    this.db = new Datastore(dbConfig);
  }
}
