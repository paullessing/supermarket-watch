import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { HistoricalProduct, TrackedItemGroup } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tracked-items-page',
  templateUrl: './tracked-items-page.component.html',
  styleUrls: ['./tracked-items-page.component.scss'],
})
export class TrackedItemsPageComponent implements OnInit {
  public itemGroups: TrackedItemGroup[];

  constructor(private readonly http: HttpClient) {
    this.itemGroups = [];
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
}
