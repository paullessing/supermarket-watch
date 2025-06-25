import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SearchParams } from '../search-box/search-box.component';

@Component({
  selector: 'app-homepage',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {
  public isSearching: boolean = false;

  constructor(private readonly router: Router) {}

  public onSearch({ query, sortBy }: SearchParams): void {
    this.router.navigate(['search'], { queryParams: { query, sortBy } });
    this.isSearching = true;
  }
}
