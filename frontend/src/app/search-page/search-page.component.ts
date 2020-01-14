import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent {

  public results: {
    id: string;
    name: string;
    image: string;
    price: number;
    supermarket: string;
  }[];

  constructor(
    private http: HttpClient
  ) { }

  public search(query: string): void {
    this.http.get('/api/search', {
      params: { q: query }
    }).subscribe(({ items }: any) => {
      this.results = items;
    });
  }
}
