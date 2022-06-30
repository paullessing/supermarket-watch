import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EditPriceComparisonDialogComponent } from './edit-product-dialog/edit-price-comparison-dialog.component';
import { HomePageComponent } from './home-page/home-page.component';
import { PriceComparisonCardComponent } from './price-comparison-card/price-comparison-card.component';
import { PriceComparisonsPageComponent } from './price-comparisons-page/price-comparisons-page.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { SearchResultListComponent } from './search-result-list/search-result-list.component';
import { UnitAmountPipe } from './unit-amount.pipe';

// prettier-ignore
@NgModule({
  imports: [CommonModule, BrowserModule, AppRoutingModule, HttpClientModule, FormsModule],
  declarations: [
    AppComponent,
    SearchPageComponent,
    HomePageComponent,
    PriceComparisonsPageComponent,
    SearchBoxComponent,
    AddProductDialogComponent,
    EditPriceComparisonDialogComponent,
    SearchResultListComponent,
    PriceComparisonCardComponent,
    UnitAmountPipe,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
}
