export enum IssueType {
  UNKNOWN = 'UNKNOWN',
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  MISSING_CONVERSION = 'MISSING_CONVERSION',
}

export interface Issue {
  productId: string;
  createdAt: Date;
  issueType: IssueType;
  description: string;
}
