import { Inject, Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';
import { Issue, IssueType } from '@shoppi/api-interfaces';
import { ISSUES_COLLECTION } from './db.providers';

export interface IssueDocument {
  productId: string;
  issues: {
    createdAt: Date;
    issueType: IssueType;
    description: string;
  }[];
}

@Injectable()
export class IssuesRepository {
  constructor(@Inject(ISSUES_COLLECTION) private readonly issues: Collection<IssueDocument>) {}

  public async createIssue({
    productId,
    issueType,
    description,
  }: {
    productId: string;
    issueType: IssueType;
    description: string;
  }): Promise<Issue> {
    const createdAt = new Date();

    const document =
      (await this.issues.findOne({ productId })) ||
      ({
        productId,
        issues: [],
      } as IssueDocument);

    document.issues.push({ createdAt, issueType, description });

    await this.issues.updateOne({ productId }, document, { upsert: true });

    return {
      productId,
      createdAt,
      issueType,
      description,
    };
  }

  public async getIssues(productId?: string): Promise<Issue[]> {
    const issues = await this.issues.find(productId ? { productId } : {}).toArray();

    return issues.reduce<Issue[]>(
      (acc, curr) => [
        ...acc,
        ...curr.issues.map(({ createdAt, issueType, description }) => ({
          productId: curr.productId,
          createdAt,
          issueType,
          description,
        })),
      ],
      []
    );
  }
}
