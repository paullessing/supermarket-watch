export interface Document {
  _id: string;
}

export interface TimestampedDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}
