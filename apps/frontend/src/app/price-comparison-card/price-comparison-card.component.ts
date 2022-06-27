import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { PriceComparison } from '@shoppi/api-interfaces';

@Component({
  selector: 'app-price-comparison-card',
  templateUrl: './price-comparison-card.component.html',
  styleUrls: ['./price-comparison-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriceComparisonCardComponent implements OnInit {
  @Input()
  public priceComparison!: PriceComparison;

  public backgroundImage!: SafeStyle;

  public isExpanded: boolean = false;

  constructor(private readonly sanitizer: DomSanitizer) {}

  public ngOnInit(): void {
    this.backgroundImage = this.sanitizer.bypassSecurityTrustStyle(`url(${this.priceComparison.image})`);
  }

  public getReductionPercentage(): number {
    const { best, usual } = this.priceComparison.pricePerUnit;
    return Math.round((1 - best / usual) * 100);
  }
}
