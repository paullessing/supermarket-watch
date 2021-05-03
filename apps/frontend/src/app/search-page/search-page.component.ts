import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { SearchResult, SearchResultItem } from '@shoppi/api-interfaces';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss']
})
export class SearchPageComponent {

  public results: SearchResultItem[];

  public isSearching: boolean;

  public selected: boolean;

  constructor(
    private http: HttpClient,
  ) {
    this.isSearching = false;

    // test code
    // setTimeout(() => this.search('', { preventDefault: () => {}} as any));
  }

  public search(query: string, event: Event): void {
    event.preventDefault();

    if (this.isSearching) {
      return;
    }
    this.isSearching = true;

    this.http.get<SearchResult>(environment.apiUrl + '/search', {
      params: { q: query }
    })
    // of({"items":[{"id":"sainsburys:7595669","name":"Alpro Almond No Sugars Long Life Drink 1L","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/09/5411188112709/5411188112709_L.jpeg","price":1.8,"supermarket":"Sainsbury's"},{"id":"sainsburys:7603414","name":"Alpro Almond No Sugars Chilled Drink 1L","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/78/5411188112778/5411188112778_L.jpeg","price":1.85,"supermarket":"Sainsbury's"},{"id":"sainsburys:7544271","name":"Alpro Almond Long Life Drink 1L","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/35/5411188110835/5411188110835_L.jpeg","price":1.8,"supermarket":"Sainsbury's"},{"id":"sainsburys:7551206","name":"Alpro Almond Chilled Drink 1L","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/59/5411188110859/5411188110859_L.jpeg","price":1.8,"supermarket":"Sainsbury's"},{"id":"sainsburys:7740223","name":"Alpro Plain with Almond Yoghurt Alternative 500g","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/61/5411188118961/5411188118961_L.jpeg","price":1.75,"supermarket":"Sainsbury's"},{"id":"sainsburys:7862245","name":"Alpro Coconut Almond Chilled Drink 1L","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/07/5411188119807/5411188119807_L.jpeg","price":1.85,"supermarket":"Sainsbury's"},{"id":"sainsburys:7957854","name":"Alpro Almond Salted Caramel Ice Cream 500ml","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/21/5411188127321/5411188127321_L.jpeg","price":2.5,"supermarket":"Sainsbury's"},{"id":"sainsburys:8028143","name":"Alpro Low Calorie Almond Vanilla Dessert 2x113g","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/95/5411188130895/5411188130895_L.jpeg","price":1.5,"supermarket":"Sainsbury's"},{"id":"sainsburys:8033024","name":"Alpro Daily Vitality Almond with Guarana Drink 750ml","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/13/5411188131113/5411188131113_L.jpeg","price":2.3,"supermarket":"Sainsbury's"},{"id":"waitrose:567758-274797-274798","name":"Alpro Almond No Sugars Roasted Chilled Drink","price":1.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_567758_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:824344-166791-166792","name":"Alpro Almond Chilled Drink","price":1.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_824344_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:825993-438222-438223","name":"Alpro Coconut & Almond Chilled Drink","price":1.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_825993_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:544050-260026-260027","name":"Alpro Almond No Sugars Roasted Long Life Drink","price":1.7,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_544050_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:465845-512658-512659","name":"Alpro Almond No Sugars Unroasted Long Life Drink","price":1.85,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_465845_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:555173-185127-185128","name":"Alpro Almond Long Life Drink","price":1.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_555173_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:555029-344156-344157","name":"Alpro Almond Dark Chocolate Long Life Drink","price":1.7,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_555029_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:887518-470037-470038","name":"Alpro Coconut & Almond Long Life Drink","price":1.75,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_887518_BP_9.jpg","supermarket":"Waitrose"},{"id":"waitrose:483795-741054-741055","name":"Alpro Daily Vitality Almond Drink with Guarana","price":2.29,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_483795_BP_9.jpg","supermarket":"Waitrose"},{"id":"tesco:276761995","name":"Alpro Almond No Sugars Long Life Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/709/5411188112709/IDShot_90x90.jpg","price":1.7,"supermarket":"Tesco"},{"id":"tesco:275067782","name":"Alpro Almond No Sugars Chilled Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/778/5411188112778/IDShot_90x90.jpg","price":1.8,"supermarket":"Tesco"},{"id":"tesco:272012512","name":"Alpro Almond Long Life Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/835/5411188110835/IDShot_90x90.jpg","price":1.7,"supermarket":"Tesco"},{"id":"tesco:272103255","name":"Alpro Almond Chilled Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/859/5411188110859/IDShot_90x90.jpg","price":1.8,"supermarket":"Tesco"},{"id":"tesco:304783080","name":"Alpro Barista Almond Long Life Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/899/5411188129899/IDShot_90x90.jpg","price":1.8,"supermarket":"Tesco"},{"id":"tesco:287937656","name":"Alpro Almond Coconut Chilled Drink 1 Litre","image":"http://img.tesco.com/Groceries/pi/807/5411188119807/IDShot_90x90.jpg","price":1.8,"supermarket":"Tesco"},{"id":"tesco:305837586","name":"Alpro Vitality With Guarana Almond Drink 750Ml","image":"http://img.tesco.com/Groceries/pi/113/5411188131113/IDShot_90x90.jpg","price":2.3,"supermarket":"Tesco"}]})
      .subscribe(({ items }) => {
        this.results = items;
        this.isSearching = false;
      });
  }

  public trackItem(_, item: SearchResultItem): string {
    return item.id;
  }

  public setFavourite(itemId: string): void {
    const isFavourite = !this.isFavourite(itemId);

    this.results = this.results.map((item) => item.id === itemId ? { ...item, isFavourite: isFavourite } : item);

    this.http.post(environment.apiUrl + '/products/favourite', { itemId, isFavourite }).subscribe();
  }

  public isFavourite(resultId: string): boolean {
    return !!this.results.find(({ id }) => id === resultId)?.isFavourite;
  }
}
