import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchResultItem } from '@shoppi/api-interfaces';

@Component({
  selector: 'app-add-product-dialog',
  templateUrl: './add-product-dialog.component.html',
  styleUrls: ['./add-product-dialog.component.scss'],
})
export class AddProductDialogComponent {
  @Input()
  public item!: SearchResultItem;

  @Output()
  public exit: EventEmitter<void> = new EventEmitter();

  public onClose(): void {
    this.exit.emit();
  }
}
