import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SortBy } from '@shoppi/api-interfaces';

export interface SearchParams {
  query: string;
  sortBy: SortBy;
}

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
})
export class SearchBoxComponent implements OnInit {
  @Input()
  public isSearching!: boolean;

  @Input()
  public searchText!: string;

  @Input()
  public sortBy!: SortBy;

  @Output()
  public search: EventEmitter<SearchParams> = new EventEmitter();

  public queryString!: string;
  public searchSortBy!: SortBy;

  public SortBy: typeof SortBy = SortBy;

  public ngOnInit() {
    this.queryString = this.searchText || '';
    this.searchSortBy = this.sortBy || SortBy.PRICE;
  }

  public onSearch(event: SubmitEvent): void {
    event.preventDefault();
    this.search.emit({
      query: this.queryString,
      sortBy: this.searchSortBy,
    });
  }
}
