import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { ProductSearchResult, ProductSearchResults, SearchResultItem } from '@shoppi/api-interfaces';

export interface AddProductData {
  productId: string;
  combinedTrackingId: string | null;
}

@Component({
  selector: 'app-add-product-dialog',
  templateUrl: './add-product-dialog.component.html',
  styleUrls: ['./add-product-dialog.component.scss'],
})
export class AddProductDialogComponent implements OnInit {
  @Input()
  public item!: SearchResultItem;

  @Output()
  public exit: EventEmitter<void> = new EventEmitter();

  @Output()
  public addProduct: EventEmitter<AddProductData> = new EventEmitter();

  public searchItemName: string;
  public results: ProductSearchResult[];
  public searchComplete: boolean;

  public get combineWithItem(): ProductSearchResult | null {
    return this._combineWithItem;
  }

  public set combineWithItem(value: ProductSearchResult | null) {
    this._combineWithItem = value;

    if (!value) {
      this.searchItemName = '';
      this.results = [];
    }
  }

  private _combineWithItem: ProductSearchResult | null;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly renderer: Renderer2,
    private readonly http: HttpClient
  ) {
    this.searchItemName = '';
    this.results = [];
    this.searchComplete = false;
    this._combineWithItem = null;

    renderer.listen(elementRef.nativeElement, 'click', (event: MouseEvent) => {
      if (event.target === elementRef.nativeElement) {
        this.exit.emit();
      }
    });
  }

  public ngOnInit(): void {
    this.search(this.item.name);
  }

  public onAdd(): void {
    this.addProduct.emit({
      productId: this.item.id,
      combinedTrackingId: this._combineWithItem?.trackingId ?? null,
    });
  }

  public onClose(): void {
    this.exit.emit();
  }

  public onSearchTextChange(searchText: string): void {
    this.searchItemName = searchText;

    if (searchText.length <= 2) {
      this._combineWithItem = null;
      this.searchComplete = false;
      return;
    }

    this.search(searchText);
  }

  private search(searchText: string): void {
    this.http
      .get<ProductSearchResults>('/api/tracked-products/search', {
        params: {
          term: searchText,
        },
      })
      .subscribe(({ results }) => {
        this._combineWithItem = null;
        this.results = results;
        this.searchComplete = true;
      });
  }
}
