import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SearchPageComponent } from './search-page/search-page.component';
import { HomePageComponent } from './home-page/home-page.component';
import { FavouritesPageComponent } from './favourites-page/favourites-page.component';
import { SearchBoxComponent } from './search-box/search-box.component';

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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
