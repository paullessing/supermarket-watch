import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { HistoricalProduct, TrackedItemGroup } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';
import { EditGroupData, RemoveProductData } from '../edit-product-dialog/edit-item-group-dialog.component';

@Component({
  selector: 'app-tracked-items-page',
  templateUrl: './tracked-items-page.component.html',
  styleUrls: ['./tracked-items-page.component.scss'],
})
export class TrackedItemsPageComponent implements OnInit {
  public itemGroups: TrackedItemGroup[];

  public editItemGroupIndex: number | null;

  constructor(private readonly http: HttpClient) {
    this.itemGroups = [];
    this.editItemGroupIndex = null;
  }

  public ngOnInit(): void {
    this.http
      .get<{ items: TrackedItemGroup[] }>(environment.apiUrl + '/tracked-products')
      .subscribe(({ items }) => (this.itemGroups = items));
  }

  public trackItem(_: number, item: TrackedItemGroup): string {
    return item.id;
  }

  public trackProduct(_: number, product: HistoricalProduct): string {
    return product.id;
  }

  public deleteTrackingGroup(id: string): void {
    this.http.delete(environment.apiUrl + '/tracked-products/' + id).subscribe(() => {
      this.itemGroups = this.itemGroups.filter((item) => item.id !== id);
    });
  }

  public removeProduct({ trackingId, productId }: RemoveProductData): void {
    this.http.delete(`${environment.apiUrl}/tracked-products/${trackingId}/${productId}`).subscribe(() => {
      this.itemGroups = this.itemGroups.map((item) =>
        item.id === trackingId
          ? { ...item, products: item.products.filter((product) => product.id !== productId) }
          : item
      );
    });
  }

  public onEditGroup({ groupId, name }: EditGroupData): void {
    this.http
      .patch<TrackedItemGroup>(`${environment.apiUrl}/tracked-products/${groupId}`, {
        name,
      })
      .subscribe((itemGroup) => {
        this.itemGroups = this.itemGroups.map((item) => (item.id === groupId ? itemGroup : item));
        this.editItemGroupIndex = null;
      });
  }
}
