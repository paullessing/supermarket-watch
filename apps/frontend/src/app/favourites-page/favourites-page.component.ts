import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Favourites, HistoricalProduct } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-favourites-page',
  templateUrl: './favourites-page.component.html',
  styleUrls: ['./favourites-page.component.scss'],
})
export class FavouritesPageComponent implements OnInit {
  public favourites: Favourites[];

  constructor(private readonly http: HttpClient) {
    this.favourites = [];
  }

  public ngOnInit(): void {
    this.http
      .get<{ items: Favourites[] }>(environment.apiUrl + '/favourites')
      .subscribe(({ items }) => (this.favourites = items));
  }

  public trackItem(_: number, item: Favourites): string {
    return item.id;
  }

  public trackProduct(_: number, product: HistoricalProduct): string {
    return product.id;
  }
}
