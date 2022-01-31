import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Product, SearchResultItem } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-favourites-page',
  templateUrl: './favourites-page.component.html',
  styleUrls: ['./favourites-page.component.scss']
})
export class FavouritesPageComponent implements OnInit {

  public favourites: Product[];

  constructor(
    private readonly http: HttpClient,
  ) {
    this.favourites = [];
  }

  public ngOnInit(): void {
    this.http.get<{ items: Product[] }>(environment.apiUrl + '/favourites')
      .subscribe(({ items }) => this.favourites = items);
  }

  public trackItem(_, item: SearchResultItem | Product): string {
    return item.id;
  }
}
