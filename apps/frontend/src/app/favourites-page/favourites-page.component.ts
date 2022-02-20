import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { HistoryProduct } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-favourites-page',
  templateUrl: './favourites-page.component.html',
  styleUrls: ['./favourites-page.component.scss'],
})
export class FavouritesPageComponent implements OnInit {
  public favourites: HistoryProduct[];

  constructor(private readonly http: HttpClient) {
    this.favourites = [];
  }

  public ngOnInit(): void {
    this.http
      .get<{ items: HistoryProduct[] }>(environment.apiUrl + '/favourites')
      .subscribe(({ items }) => (this.favourites = items));
  }

  public trackItem(_: number, item: HistoryProduct): string {
    return item.id;
  }
}
