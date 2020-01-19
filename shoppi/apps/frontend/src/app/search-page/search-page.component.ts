import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { SearchResultItem } from '@shoppi/api-interfaces';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent {

  public results: SearchResultItem[];

  public isSearching: boolean;

  constructor(
    private http: HttpClient
  ) {
    this.isSearching = false;
  }

  public search(query: string, event: Event): void {
    event.preventDefault();

    if (this.isSearching) {
      return;
    }
    this.isSearching = true;

    this.http.get('/api/search', {
      params: { q: query }
    }).subscribe(({ items }: any) => {
      this.results = items;
      this.isSearching = false;
    });
  }
}
