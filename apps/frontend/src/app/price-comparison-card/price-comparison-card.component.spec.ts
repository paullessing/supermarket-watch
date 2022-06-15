import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceComparisonCardComponent } from './price-comparison-card.component';

describe('PriceComparisonCardComponent', () => {
  let component: PriceComparisonCardComponent;
  let fixture: ComponentFixture<PriceComparisonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PriceComparisonCardComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PriceComparisonCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
