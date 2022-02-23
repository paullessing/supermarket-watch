import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrackedItemGroup } from '@shoppi/api-interfaces';
import { EditItemGroupDialogComponent } from './edit-item-group-dialog.component';

describe('EditProductDialogComponent', () => {
  let component: EditItemGroupDialogComponent;
  let fixture: ComponentFixture<EditItemGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditItemGroupDialogComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditItemGroupDialogComponent);
    component = fixture.componentInstance;
    component.group = {
      name: 'Item Name',
    } as TrackedItemGroup;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
