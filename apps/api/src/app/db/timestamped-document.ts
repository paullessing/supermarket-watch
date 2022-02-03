import { ObjectId } from 'mongodb';

export interface Document {
  _id: ObjectId;
}

export interface TimestampedDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}
