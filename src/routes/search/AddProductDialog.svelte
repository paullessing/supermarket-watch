<script module lang="ts">
  export interface AddProductData {
    productId: string;
    combinedTrackingId: string | null;
    conversion: {
      fromQuantity: number;
      fromUnit: string;
      toQuantity: number;
      toUnit: string;
    } | null;
  }
</script>

<script lang="ts">
  import type { ProductDetails, ProductSearchResult, SearchResultItem } from '$lib/models';
  import { clickOutside } from 'svelte-outside';
  import { formatCurrency } from '$lib/util/format';
  import { onMount } from 'svelte';

  interface Props {
    item: SearchResultItem;
    onExit: () => void;
    onAddProduct: (data: AddProductData) => void;
  }

  console.log('APD created');

  let { item, onExit, onAddProduct }: Props = $props();

  let isMounted: boolean = false;

  let product: ProductDetails | null = $state(null);
  let results: ProductSearchResult[] = $state([]);
  let combineWithItem: ProductSearchResult | null = $state(null);
  let searchComplete: boolean = $state(false);
  let searchItemName: string = $state('');
  let mustProvideConversion: boolean = $state(false);
  let conversion: {
    fromUnit: string;
    fromQuantity: number;
    toQuantity: number;
    toUnit: string;
  } = $state({
    fromUnit: '',
    fromQuantity: 1,
    toQuantity: 1,
    toUnit: '',
  });

  $effect(() => {
    (async () => {
      product = await (await fetch(`/api/products/${item.id}`)).json();
      await search(item.name);
    })();
  });

  async function search(searchText: string): Promise<void> {
    const res = await fetch(`/api/price-comparisons/search?${new URLSearchParams({ term: searchText }).toString()}`);
    results = (await res.json()).results;

    combineWithItem = null;
    searchComplete = true;
  }

  function close(): void {
    if (isMounted) {
      onExit();
    }
  }

  $effect(() => {
    if (searchItemName?.length <= 2) {
      combineWithItem = null;
      searchComplete = false;
      results = [];
      return;
    }

    search(searchItemName);
  });

  onMount(() => {
    setTimeout(() => {
      isMounted = true;
      console.log('is mounted');
    });
  });

  function setCombineWithItem(item: ProductSearchResult | null): void {
    setTimeout(() => {
      if (!product) {
        return;
      }

      combineWithItem = item;

      if (combineWithItem) {
        mustProvideConversion = !combineWithItem.units.includes(product.unitName);
        conversion = {
          ...conversion,
          fromUnit: combineWithItem.units[0],
          toUnit: product.unitName,
        };
      } else {
        searchItemName = '';
        results = [];
      }
    });
  }

  function onAdd(): void {
    onAddProduct({
      productId: item.id,
      combinedTrackingId: combineWithItem?.trackingId ?? null,
      conversion: mustProvideConversion ? conversion : null,
    });
  }
</script>

<div class="add-product-dialog">
  <div class="add-product-dialog__wrapper" use:clickOutside={() => (console.log('click outside'), close())}>
    <button class="add-product-dialog__close" onclick={close} style="cursor: pointer">Close </button>

    {#if !product}
      <div class="add-product-dialog__content">Loading...</div>
    {:else}
      <div class="add-product-dialog__content">
        <h1>Add Item</h1>
        <h2>{product.name} - {formatCurrency(product.price)}</h2>
        <p>{product.supermarket}</p>
        <div style="margin-top: 1rem">
          Combine with existing item
          {#if !combineWithItem}
            <input type="text" placeholder="Enter item name" bind:value={searchItemName} />
            {#if results}
              <ul>
                {#each results as result}
                  <li>
                    <button
                      class="add-product-dialog__search-result button-link"
                      onclick={() => setCombineWithItem(result)}
                    >
                      {result.name}
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if searchComplete && !results.length}
              <p>No results found</p>
            {/if}
          {:else}
            <p style="margin-left: 1rem">
              {combineWithItem.name}
              <button onclick={() => setCombineWithItem(null)}>Clear</button>
            </p>
            {#if mustProvideConversion}
              <div>
                <label for="conversion.from">How does this item convert?</label><br />
                <input id="conversion.from" type="number" style="width: 50px" bind:value={conversion.fromQuantity} />
                <select bind:value={conversion.fromUnit}>
                  {#each combineWithItem.units as unit}
                    <option value={unit}>
                      {unit}
                    </option>
                  {/each}
                </select>
                =
                <input type="number" style="width: 50px" bind:value={conversion.toQuantity} />
                {product.unitName}
              </div>
            {/if}
          {/if}
        </div>

        <div class="add-product-dialog__buttons">
          <button class="add-product-dialog__button" onclick={close}>Cancel </button>
          <button class="add-product-dialog__button" type="submit" onclick={onAdd}>Add </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .add-product-dialog {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    padding: 1rem;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.2);
    overflow: hidden;
    z-index: 1000;

    &__wrapper {
      $spacing: 1rem;
      width: 100%;
      max-width: 800px;
      position: relative;
    }

    &__content {
      background-color: white;
      max-height: 100%;
      overflow-y: auto;
      box-shadow: rgba(0, 0, 0, 0.3) 0 3px 8px 3px;
      border-radius: 3px;

      padding: 1rem;
    }

    &__close {
      border: 0;
      background-color: transparent;
      display: block;
      position: absolute;
      right: 1rem;
      top: 1rem;
      z-index: 100;
    }

    &__buttons {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
    }

    &__button {
      margin-left: 1rem;
    }

    &__search-result {
      color: blue;
    }
  }
</style>
