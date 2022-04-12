import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackedItemGroup } from '@shoppi/api-interfaces';
import { EditPriceComparisonDialogComponent } from './edit-price-comparison-dialog.component';

describe('EditProductDialogComponent', () => {
  let component: EditPriceComparisonDialogComponent;
  let fixture: ComponentFixture<EditPriceComparisonDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditPriceComparisonDialogComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditPriceComparisonDialogComponent);
    component = fixture.componentInstance;
    component.comparison = {
      name: 'Item Name',
    } as TrackedItemGroup;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
