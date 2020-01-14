import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent {

  public results: {
    id: string;
    name: string;
    image: string;
    price: number;
    supermarket: string;
  }[]; // = [{"id":"sainsburys:eazypop-microwave-popcorn-salted-100g","name":"Eazypop Microwave Popcorn Salted 85g","image":"https://www.sainsburys.co.uk/wcsstore7.44.7/ExtendedSitesCatalogAssetStore/images/catalog/productImages/28/5023751000728/5023751000728_L.jpeg","price":0.6,"supermarket":"Sainsbury's"},{"id":"sainsburys:eazypop-microwave-popcorns-butter-100g","name":"Eazypop Microwave Popcorn Butter 100g","image":"https://www.sainsburys.co.uk/wcsstore7.44.7/ExtendedSitesCatalogAssetStore/images/catalog/productImages/66/5023751000766/5023751000766_L.jpeg","price":0.6,"supermarket":"Sainsbury's"},{"id":"tesco:258782162","name":"Magicorn Eazy Pop Popcorn Salted 100G","image":"http://img.tesco.com/Groceries/pi/023/5023751202023/IDShot_90x90.jpg","price":0.6,"supermarket":"Tesco"}];

  public isSearching: boolean;

  constructor(
    private http: HttpClient
  ) {
    this.isSearching = false;
  }

  public search(query: string, event: Event): void {
    event.preventDefault();

    if (this.isSearching) {
      return;
    }
    this.isSearching = true;

    this.http.get('/api/search', {
      params: { q: query }
    }).subscribe(({ items }: any) => {
      this.results = items;
      this.isSearching = false;
    });
  }
}
