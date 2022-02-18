import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product, SearchResultItem } from '@shoppi/api-interfaces';

export interface AddFavouriteData {
  itemId: string;
  isFavourite: boolean;
}

@Component({
  selector: 'app-search-result-list',
  templateUrl: './search-result-list.component.html',
  styleUrls: ['./search-result-list.component.scss'],
})
export class SearchResultListComponent {
  @Input()
  public results: SearchResultItem[] = [];

  // @Output()
  // public setFavourite: EventEmitter<AddFavouriteData> = new EventEmitter();

  @Output()
  public addItem: EventEmitter<SearchResultItem> = new EventEmitter();

  public trackItem(_: number, item: SearchResultItem | Product): string {
    return item.id;
  }

  // public isFavourite(resultId: string): boolean {
  //   return !!this.results.find(({ id }) => id === resultId)?.isFavourite;
  // }
  //
  // public onSetFavourite(itemId: string): void {
  //   const isFavourite = !this.isFavourite(itemId);
  //
  //   this.setFavourite.emit({ itemId, isFavourite });
  // }

  public onAddItem(item: SearchResultItem): void {
    this.addItem.emit(item);
  }
}
