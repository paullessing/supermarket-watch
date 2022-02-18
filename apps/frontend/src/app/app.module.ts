import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AddProductDialogComponent } from './add-product-dialog/add-product-dialog.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FavouritesPageComponent } from './favourites-page/favourites-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { SearchBoxComponent } from './search-box/search-box.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { SearchResultListComponent } from './search-result-list/search-result-list.component';

// prettier-ignore
@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  declarations: [
    AppComponent,
    SearchPageComponent,
    HomePageComponent,
    FavouritesPageComponent,
    SearchBoxComponent,
    AddProductDialogComponent,
    SearchResultListComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
