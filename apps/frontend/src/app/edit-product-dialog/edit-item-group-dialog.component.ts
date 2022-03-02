import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import { HistoricalProduct, ProductSearchResult, ProductSearchResults, TrackedItemGroup } from '@shoppi/api-interfaces';

export interface RemoveProductData {
  productId: string;
  trackingId: string;
}

export interface EditGroupData {
  groupId: string;
  name: string;
}

@Component({
  selector: 'app-edit-item-group-dialog',
  templateUrl: './edit-item-group-dialog.component.html',
  styleUrls: ['./edit-item-group-dialog.component.scss'],
})
export class EditItemGroupDialogComponent implements OnInit {
  @Input()
  public group!: TrackedItemGroup;

  @Output()
  public editGroup: EventEmitter<EditGroupData> = new EventEmitter();

  @Output()
  public exit: EventEmitter<void> = new EventEmitter();

  @Output()
  public deleteTrackedGroup: EventEmitter<{ id: string }> = new EventEmitter();

  @Output()
  public removeProduct: EventEmitter<RemoveProductData> = new EventEmitter();

  public searchItemName: string;
  public results: ProductSearchResult[];
  public searchComplete: boolean;
  public isEditingName: boolean;
  public isRemovingItems: boolean;

  public details: Pick<HistoricalProduct, 'name'>;

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
    this.isEditingName = false;
    this.isRemovingItems = false;
    this.details = { name: '' };

    renderer.listen(elementRef.nativeElement, 'click', (event: MouseEvent) => {
      if (event.target === elementRef.nativeElement) {
        this.exit.emit();
      }
    });
  }

  public ngOnInit(): void {
    this.details.name = this.group.name;
  }

  public onConfirm(): void {
    if (this.detailsHaveChanged()) {
      this.editGroup.emit({
        groupId: this.group.id,
        name: this.details.name,
      });
    } else {
      this.exit.emit();
    }
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

  private detailsHaveChanged(): boolean {
    return this.details.name !== this.group.name;
  }
}
