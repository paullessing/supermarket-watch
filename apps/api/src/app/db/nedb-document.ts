export interface NedbDocument {
  _id: string;
}

export interface NedbTimestampedDocument extends NedbDocument {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Properties of T, but the keys of the NedbDocument are optional
 */
export type InsertQuery<T extends NedbDocument> =
  Omit<T, '_id' | 'createdAt' | 'updatedAt'> &
  Partial<Pick<T, T extends NedbTimestampedDocument ? '_id' | 'createdAt' | 'updatedAt' : '_id'>>;
