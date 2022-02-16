import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchResultItem } from '@shoppi/api-interfaces';
import { AddProductDialogComponent } from './add-product-dialog.component';

describe('AddProductDialogComponent', () => {
  let component: AddProductDialogComponent;
  let fixture: ComponentFixture<AddProductDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddProductDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddProductDialogComponent);
    component = fixture.componentInstance;
    component.item = {
      name: 'Item Name',
    } as SearchResultItem;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
