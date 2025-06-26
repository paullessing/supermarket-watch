import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { PriceComparison } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';
import {
  EditComparisonDetailsData,
  RemoveProductData,
} from '../edit-product-dialog/edit-price-comparison-dialog.component';
import { trackById } from '../util';

@Component({
  selector: 'app-price-comparisons-page',
  templateUrl: './price-comparisons-page.component.html',
  styleUrls: ['./price-comparisons-page.component.scss'],
})
export class PriceComparisonsPageComponent implements OnInit {
  public priceComparisons: PriceComparison[];

  public editIndex: number | null;

  public trackById = trackById;

  constructor(private readonly http: HttpClient) {
    this.priceComparisons = [];
    this.editIndex = null;
  }

  public ngOnInit(): void {
    this.http
      .get<{
        items: PriceComparison[];
      }>(environment.apiUrl + '/price-comparisons')
      .subscribe(({ items }) => (this.priceComparisons = items));
  }

  public deletePriceComparison(id: string): void {
    this.http
      .delete(environment.apiUrl + '/price-comparisons/' + id)
      .subscribe(() => {
        this.priceComparisons = this.priceComparisons.filter(
          (item) => item.id !== id
        );
      });
  }

  public removeProduct({
    comparisonId: comparisonId,
    productId,
  }: RemoveProductData): void {
    this.http
      .delete(
        `${environment.apiUrl}/price-comparisons/${comparisonId}/${productId}`
      )
      .subscribe(() => {
        this.priceComparisons = this.priceComparisons.map((item) =>
          item.id === comparisonId
            ? {
                ...item,
                products: item.products.filter(
                  (product) => product.id !== productId
                ),
              }
            : item
        );
      });
  }

  public onEditComparison({
    id: comparisonId,
    name,
  }: EditComparisonDetailsData): void {
    this.http
      .patch<PriceComparison>(
        `${environment.apiUrl}/price-comparisons/${comparisonId}`,
        {
          name,
        }
      )
      .subscribe((comparison) => {
        this.priceComparisons = this.priceComparisons.map((item) =>
          item.id === comparisonId ? comparison : item
        );
        this.editIndex = null;
      });
  }
}
