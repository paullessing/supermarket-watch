import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import {
  ComparisonProductData,
  PriceComparison,
  ProductSearchResult,
  ProductSearchResults,
} from '@shoppi/api-interfaces';

export interface RemoveProductData {
  productId: string;
  comparisonId: string;
}

export interface EditComparisonDetailsData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-edit-price-comparison-dialog',
  templateUrl: './edit-price-comparison-dialog.component.html',
  styleUrls: ['./edit-price-comparison-dialog.component.scss'],
})
export class EditPriceComparisonDialogComponent implements OnInit {
  @Input()
  public comparison!: PriceComparison;

  @Output()
  public editDetails: EventEmitter<EditComparisonDetailsData> = new EventEmitter();

  @Output()
  public exit: EventEmitter<void> = new EventEmitter();

  @Output()
  public deletePriceComparison: EventEmitter<{ id: string }> = new EventEmitter();

  @Output()
  public removeProduct: EventEmitter<RemoveProductData> = new EventEmitter();

  public searchItemName: string;
  public results: ProductSearchResult[];
  public searchComplete: boolean;
  public isEditingName: boolean;
  public isRemovingItems: boolean;

  public details: Pick<PriceComparison, 'name'>;

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
    this.details.name = this.comparison.name;
  }

  public onConfirm(): void {
    if (this.detailsHaveChanged()) {
      this.editDetails.emit({
        id: this.comparison.id,
        name: this.details.name,
      });
    } else {
      this.exit.emit();
    }
  }

  public onDelete(): void {
    if (window.confirm('Are you sure you want to delete this price comparison?')) {
      this.deletePriceComparison.emit({ id: this.comparison.id });
    }
  }

  public onRemoveProduct(product: ComparisonProductData): void {
    const prompt = `Are you sure you want to remove "${product.supermarket} - ${product.name}" from this comparison?`;
    if (window.confirm(prompt)) {
      this.removeProduct.emit({ comparisonId: this.comparison.id, productId: product.id });
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
      .get<ProductSearchResults>('/api/price-comparisons/search', {
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
    return this.details.name !== this.comparison.name;
  }
}
