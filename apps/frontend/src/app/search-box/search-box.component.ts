import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent {

  @Input()
  public isSearching: boolean;

  @Input()
  public searchText: string;

  @Output()
  public search: EventEmitter<string> = new EventEmitter();
}
