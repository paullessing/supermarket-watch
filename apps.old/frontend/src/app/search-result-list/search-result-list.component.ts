import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResultItem } from '@shoppi/api-interfaces';

@Component({
  selector: 'app-search-result-list',
  templateUrl: './search-result-list.component.html',
  styleUrls: ['./search-result-list.component.scss'],
})
export class SearchResultListComponent {
  @Input()
  public results: SearchResultItem[] = [];

  @Output()
  public addItem: EventEmitter<SearchResultItem> = new EventEmitter();

  public trackItem(_: number, item: SearchResultItem): string {
    return item.id;
  }

  public onAddItem(item: SearchResultItem): void {
    if (item.trackingId === null) {
      this.addItem.emit(item);
    }
  }
}
