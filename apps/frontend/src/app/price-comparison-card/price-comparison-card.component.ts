import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { curveStepAfter } from 'd3-shape';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';
import { PriceComparison } from '@shoppi/api-interfaces';

type HistoryReturnValue = { history: { date: Date; price: number; pricePerUnit: number }[] };

@Component({
  selector: 'app-price-comparison-card',
  templateUrl: './price-comparison-card.component.html',
  styleUrls: ['./price-comparison-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceComparisonCardComponent implements OnInit {
  private static load: boolean = false;

  @Input()
  public priceComparison!: PriceComparison;

  public backgroundImage!: SafeStyle;

  public isExpanded: boolean = false;

  public isLoadingHistoryData: boolean = false;
  public historyData: unknown[] | null = null;

  public step = curveStepAfter;

  constructor(
    private readonly sanitizer: DomSanitizer,
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.backgroundImage = this.sanitizer.bypassSecurityTrustStyle(`url(${this.priceComparison.image})`);

    if (!PriceComparisonCardComponent.load) {
      PriceComparisonCardComponent.load = true;
      this.loadHistoryData();
    }
  }

  public getReductionPercentage(): number {
    const best = this.priceComparison.price.best.unitPrice;
    const usual = this.priceComparison.price.usual.unitPrice;

    return Math.round((1 - best / usual) * 100);
  }

  public async loadHistoryData(): Promise<void> {
    this.isLoadingHistoryData = true;

    const data = await Promise.all(
      this.priceComparison.products.map(async ({ id, name, supermarket }) => ({
        ...(await lastValueFrom(this.http.get<HistoryReturnValue>(`/api/products/${id}/history`))),
        name,
        supermarket,
      }))
    );

    console.log('got the data', data);

    this.historyData = data.map(({ name, history, supermarket }) => ({
      name: `${name} (${supermarket})`,
      series: history.map(({ date, price }) => ({
        name: format(new Date(date), 'yyyy-mm-dd'),
        value: price,
      })),
    }));

    this.cdr.markForCheck();
  }
}
