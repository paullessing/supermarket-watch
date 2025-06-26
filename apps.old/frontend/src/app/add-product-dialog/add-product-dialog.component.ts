import { HttpClient } from '@angular/common/http';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { Observable } from 'rxjs';
import {
  ProductDetails,
  ProductSearchResult,
  ProductSearchResults,
  SearchResultItem,
} from '@shoppi/api-interfaces';

export interface AddProductData {
  productId: string;
  combinedTrackingId: string | null;
  conversion: {
    fromQuantity: number;
    fromUnit: string;
    toQuantity: number;
    toUnit: string;
  } | null;
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

  public product$!: Observable<ProductDetails>;

  public searchItemName: string;
  public results: ProductSearchResult[];
  public searchComplete: boolean;
  public mustProvideConversion: boolean;
  public conversion: {
    fromUnit: string;
    fromQuantity: number;
    toQuantity: number;
    toUnit: string;
  } = {
    fromUnit: '',
    fromQuantity: 1,
    toQuantity: 1,
    toUnit: '',
  };

  public get combineWithItem(): ProductSearchResult | null {
    return this._combineWithItem;
  }

  public set combineWithItem(value: ProductSearchResult | null) {
    this._combineWithItem = value;

    if (!value) {
      this.searchItemName = '';
      this.results = [];
    }

    if (value) {
      this.product$.subscribe((product) => {
        this.mustProvideConversion = !value.units.includes(product.unitName);
        this.conversion.fromUnit = value.units[0];
        this.conversion.toUnit = product.unitName;
      });
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
    this.mustProvideConversion = false;

    renderer.listen(elementRef.nativeElement, 'click', (event: MouseEvent) => {
      if (event.target === elementRef.nativeElement) {
        this.exit.emit();
      }
    });
  }

  public ngOnInit(): void {
    // TODO move this out of this component, it should be loaded before the popup opens
    this.product$ = this.http.get<ProductDetails>(
      `/api/products/${this.item.id}`
    );
    this.search(this.item.name);
  }

  public onAdd(): void {
    this.addProduct.emit({
      productId: this.item.id,
      combinedTrackingId: this._combineWithItem?.trackingId ?? null,
      conversion: this.mustProvideConversion ? this.conversion : null,
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
  }
}
