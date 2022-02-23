import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, Output, Renderer2 } from '@angular/core';
import { HistoricalProduct, ProductSearchResult, ProductSearchResults, TrackedItemGroup } from '@shoppi/api-interfaces';

export interface RemoveProductData {
  productId: string;
  trackingId: string;
}

@Component({
  selector: 'app-edit-item-group-dialog',
  templateUrl: './edit-item-group-dialog.component.html',
  styleUrls: ['./edit-item-group-dialog.component.scss'],
})
export class EditItemGroupDialogComponent {
  @Input()
  public group!: TrackedItemGroup;

  @Output()
  public exit: EventEmitter<void> = new EventEmitter();

  @Output()
  public deleteTrackedGroup: EventEmitter<{ id: string }> = new EventEmitter();

  @Output()
  public removeProduct: EventEmitter<RemoveProductData> = new EventEmitter();

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

  public onConfirm(): void {
    // TODO implement
  }

  public onDelete(): void {
    if (window.confirm('Are you sure you want to delete this group?')) {
      this.deleteTrackedGroup.emit({ id: this.group.id });
    }
  }

  public onRemoveProduct(product: HistoricalProduct): void {
    if (window.confirm(`Are you sure you want to remove "${product.supermarket} - ${product.name}" from this group?`)) {
      this.removeProduct.emit({ trackingId: this.group.id, productId: product.id });
    }
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

    console.log(searchText);
  }
}
