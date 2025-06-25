<script lang="ts">
  import { type SearchResultItem } from '$lib/models';
  import { SortBy } from '$lib';
  import SearchBox, { type SearchParams } from './SearchBox.svelte';
  import SearchResultList from './SearchResultList.svelte';
  import { page } from '$app/stores';
  import type { PageServerData } from './$types';
  import { goto } from '$app/navigation';

  export let data: PageServerData;

  $: {
    console.log('Page data', data);
    isSearching = false;
  }

  let isSearching: boolean = false;
  let query: string;
  let addItemDetails: SearchResultItem | null;
  let sortBy: SortBy;

  const urlParams = $page.url.searchParams;
  query = urlParams.get('query') ?? '';
  sortBy = ensureValidEnumValue(SortBy, urlParams.get('sortBy') ?? SortBy.NONE);

  function onSearch(event: CustomEvent<SearchParams>): void {
    query = event.detail.query;
    sortBy = event.detail.sortBy;
    search();
  }

  function search(): void {
    if (isSearching) {
      return;
    }
    isSearching = true;

    console.log('Searching', query, sortBy);

    $page.url.searchParams.set('query', query);
    if (sortBy == SortBy.NONE) {
      $page.url.searchParams.delete('sortBy');
    } else {
      $page.url.searchParams.set('sortBy', sortBy);
    }

    goto(`?${$page.url.searchParams.toString()}`);

    // this.router.navigate([], {
    //   relativeTo: this.route,
    //   queryParams: { query },
    //   queryParamsHandling: 'merge', // remove to replace all query params by provided
    // });

    // if (!environment.production && localStorage.getItem('useCache')) {
    //   const cacheResults = getCache(query, sortBy);
    //   if (cacheResults) {
    //     this.results = cacheResults;
    //     this.isSearching = false;
    //     return;
    //   }
    // }
    //
    // this.http
    //   .get<SearchResult>(environment.apiUrl + '/search', {
    //     params: { q: query, sortBy },
    //   })
    //   //of({"items":[{"id":"sainsburys:6033113","name":"Aero Mousse, Milk Chocolate 4x59g","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/12/3023290624012/3023290624012_L.jpeg","price":1.5,"isSpecialOffer":false,"supermarket":"Sainsbury's","isFavourite":false},{"id":"sainsburys:7525514","name":"Aero Creations Mousse Milk Chocolate 4x57g","image":"https://www.sainsburys.co.uk/wcsstore/ExtendedSitesCatalogAssetStore/images/catalog/productImages/84/3023290400784/3023290400784_L.jpeg","price":1,"isSpecialOffer":true,"supermarket":"Sainsbury's","isFavourite":false},{"id":"waitrose:506202-71534-71535","name":"Nestlé Aero Milk Choc Bubbly Dessert","price":1,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_506202_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":true,"isFavourite":false},{"id":"waitrose:689744-97973-97974","name":"Essential Apricot Fruit Fool","price":0.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_689744_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:459919-64821-64822","name":"Essential Gooseberry Fruit Fool","price":0.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_459919_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:743337-151617-151618","name":"Waitrose Cappuccino Mousse","price":0.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_743337_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:446192-62815-62816","name":"Essential Rhubarb Fruit Fool","price":0.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_446192_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:470267-66305-66306","name":"Waitrose Chocolate Mousse","price":0.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_470267_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:717520-486671-486672","name":"Essential Caramel Surprise","price":0.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_717520_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:541691-369376-369377","name":"Nestlé Aero Creations","price":1,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_541691_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":true,"isFavourite":false},{"id":"waitrose:457058-64409-64410","name":"Nestlé Rolo Dessert","price":1.55,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_457058_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:397667-55908-55909","name":"Bonne Maman Crème Caramel","price":2.5,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_397667_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:864766-703601-703602","name":"Bonne Maman Blackcurrant Mousse","price":1.6,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_864766_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:617490-724973-724974","name":"Bonne Maman Rhubarb Mousse","price":1.6,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_617490_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:612816-86931-86932","name":"Essential Chocolate Mousse","price":1,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_612816_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:456196-549849-549850","name":"Bonne Maman Salted Caramel Créme","price":1.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_456196_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:812940-373613-373614","name":"Bonne Maman Crème Brûlèe","price":2.5,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_812940_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:454154-549843-549844","name":"Bonne Maman Strawberry Mousse","price":2.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_454154_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:533873-373205-373206","name":"Bonne Maman Baba au Rhum","price":2.5,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_533873_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:442370-507816-507817","name":"Bonne Maman Chocolate Mousse","price":2.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_442370_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:739888-619987-619988","name":"Bonne Maman Coffee Crème","price":1.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_739888_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:848138-210482-210483","name":"Pots & Co Lemon & Lime Posset","price":2,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_848138_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:568595-289796-289797","name":"Peppa Pig strawberry jelly","price":0.5,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_568595_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:694652-263496-263497","name":"Cadbury Chocolate Mousse","price":1.55,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_694652_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:556145-702747-702748","name":"Bonne Maman Peach & Apricot Compote Dessert","price":2.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_556145_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:558739-332471-332472","name":"Pots & Co Salted Caramel & Chocolate Pot","price":2,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_558739_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:479342-724963-724964","name":"Gü Dark Chocolate Mousse with Salted Caramel","price":3.3,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_479342_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:509832-661611-661612","name":"Bonne Maman Dark Chocolate Crème with Sea Salt","price":1.65,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_509832_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:542686-702723-702724","name":"Bonne Maman Strawberry & Raspberry Compote","price":2.8,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_542686_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"waitrose:839261-291588-291589","name":"Cadbury Dairy Milk Pots of Joy","price":1.3,"image":"https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_839261_BP_9.jpg","supermarket":"Waitrose","isSpecialOffer":false,"isFavourite":false},{"id":"tesco:252857372","name":"Aero Chocolate Mousse 4 X59g","image":"https://img.tesco.com/Groceries/pi/012/3023290624012/IDShot_225x225.jpg","price":1.5,"isSpecialOffer":false,"supermarket":"Tesco","isFavourite":false},{"id":"tesco:268895324","name":"Aero Creations Chocolate Mousse 4 X57g","image":"https://img.tesco.com/Groceries/pi/784/3023290400784/IDShot_225x225.jpg","price":1,"isSpecialOffer":true,"supermarket":"Tesco","isFavourite":false},{"id":"tesco:259953235","name":"Aero Mint Chocolate Mousse 4 X58g","image":"https://img.tesco.com/Groceries/pi/864/3023290207864/IDShot_225x225.jpg","price":1.5,"isSpecialOffer":false,"supermarket":"Tesco","isFavourite":false},{"id":"tesco:305048425","name":"Nestle Aero Creations Hazelnut Flavoured Mousse 4X57g","image":"https://img.tesco.com/Groceries/pi/857/3023290038857/IDShot_225x225.jpg","price":1,"isSpecialOffer":true,"supermarket":"Tesco","isFavourite":false}]})
    //   .subscribe(({ items }) => {
    //     setCache(query, sortBy, items);
    //     this.results = items;
    //     this.isSearching = false;
    //   });
  }

  function openAddItemDetailsModal(event: CustomEvent<SearchResultItem>): void {
    addItemDetails = event.detail;
  }

  function ensureValidEnumValue<T extends string>(enumClass: { [key: string]: T }, value: string | T): T {
    if (isValidEnumValue(enumClass, value)) {
      return value as T;
    } else {
      throw new Error(`Unexpected enum value "${value}" is not one of: [${Object.values(enumClass).join(', ')}]`);
    }
  }

  function isValidEnumValue<T extends string>(enumClass: { [key: string]: T }, value: string | T): boolean {
    return Object.values(enumClass).indexOf(value as T) >= 0;
  }
</script>

<div class="content search-page">
  <h2 class="title">Search</h2>

  <SearchBox {isSearching} searchText={query} on:search={onSearch}></SearchBox>

  <SearchResultList results={data.results} on:addItem={openAddItemDetailsModal}></SearchResultList>

  <div style="display: none">Add Product Dialog {addItemDetails?.id}</div>
  <!--  <app-add-product-dialog-->
  <!--    *ngIf="addItemDetails"-->
  <!--    [item]="addItemDetails"-->
  <!--    (exit)="addItemDetails = null"-->
  <!--    (addProduct)="track($event)"-->
  <!--  ></app-add-product-dialog>-->
</div>
