import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {

  public isSearching: boolean;

  constructor(
    private router: Router
  ) {}

  public onSearch(text: string): void {
    this.router.navigate(['search'], { queryParams: { query: text } });
    this.isSearching = true;
  }
}
