import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page.component';
import { PriceComparisonsPageComponent } from './price-comparisons-page/price-comparisons-page.component';
import { SearchPageComponent } from './search-page/search-page.component';

const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'search',
    component: SearchPageComponent,
  },
  {
    path: 'price-comparisons',
    component: PriceComparisonsPageComponent,
  },
  {
    path: 'tracked-items',
    redirectTo: 'price-comparisons',
  },
  {
    path: '**',
    redirectTo: '/',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
