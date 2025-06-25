<script lang="ts">
  import type { SearchResultItem } from '$lib/models';
  import { createEventDispatcher } from 'svelte';
  import { formatCurrency, formatDate } from '$lib/util/format';

  interface Props {
    results?: SearchResultItem[];
  }

  let { results = [] }: Props = $props();

  const dispatch = createEventDispatcher<{
    addItem: SearchResultItem;
  }>();

  function onAddItem(item: SearchResultItem): void {
    if (item.trackingId === null) {
      dispatch('addItem', item);
    }
  }
</script>

{#if results?.length}
  <ul class="results">
    {#each results as result (result.id)}
      <li class="results__item result" data-id={result.id}>
        <div class="result__image" style:background-image="url('{result.image}')"></div>
        <button
          class="result__favourite"
          class:result__favourite--selected={result.trackingId}
          onclick={() => onAddItem(result)}
          aria-label="Track this item"
        ></button>
        <p class="result__supermarket">{result.supermarket}</p>
        <p class="result__name">{result.name}</p>
        <p class="result__price" class:result__price--special-offer={result.specialOffer}>
          {formatCurrency(result.price)}
        </p>
        {#if result.specialOffer}
          <p class="result__special-offer">
            {result.specialOffer.offerText}{result.specialOffer.offerText ? ',' : ''}
            {#if result.specialOffer.originalPrice !== result.price}
              <span style="white-space: nowrap"
                >{result.specialOffer.offerText ? 'was' : 'Was'}
                {formatCurrency(result.specialOffer.originalPrice)}</span
              >
            {/if}
            <span style="color: #888; margin-left: 0.25rem; white-space: nowrap"
              >until {formatDate(result.specialOffer.validUntil, 'dd/MM')}</span
            >
          </p>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style lang="scss">
  .results {
    $gutter: 16px;
    list-style: none;
    padding-left: 0;
    padding-top: 1rem;

    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    grid-column-gap: $gutter;
    grid-row-gap: $gutter;
  }

  .result {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: fit-content(0);
    position: relative;
    border-radius: 3px;
    //border: 1px solid #ddd;
    box-shadow: 0 2px 4px 2px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    flex-wrap: wrap;
    background-color: white;

    &__image {
      grid-area: 1 / 1 / 2 / 3;
      margin: 0.25rem;
      height: 0;
      padding-bottom: calc(100% - 0.5rem);
      background-size: contain;
      background-repeat: no-repeat;
    }

    &__favourite {
      outline: none;
      border: none;
      //background: transparent;
      padding: 0;
      display: inline-block;
      font-size: 2rem;
      cursor: pointer;
      line-height: 2rem;
      width: 2rem;
      height: 2rem;
      position: absolute;
      right: 0;
      top: 0;
      background-color: white;
      border-bottom-left-radius: 3px;

      &::before {
        content: '☆';
        color: #aaa;
      }

      &--selected::before {
        content: '★';
        color: #ffdd00;
      }

      &:hover::before {
        content: '★';
        color: #ffe765;
      }
    }

    &__name {
      grid-area: 2 / 1 / 3 / 3;
      padding: 0.5rem 0.75rem;
      //min-height: 4.6em; // 3 lines, visually determined
      font-family: Roboto, Arial, Helvetica, sans-serif;
      font-weight: 300;
      font-size: 1.2rem;
    }

    &__supermarket {
      order: 3;
      display: flex;
      align-items: center;
      font-weight: bold;
      margin: 0.5rem;
      font-family:
        Open Sans,
        Arial,
        Helvetica,
        sans-serif;
      line-height: 1.2;
      margin-top: auto;
    }

    &__price {
      order: 4;
      margin: 0.5rem;
      margin-left: auto;
      text-align: right;
      display: flex;
      align-items: center;
      font-size: 1.2rem;
      margin-top: auto;

      &--special-offer {
        color: red;
      }
    }

    &__special-offer {
      grid-column: 1 / 3;
      color: red;
      margin: 0.5rem;
    }

    &__add-button {
      order: 6;
      grid-column: 1 / 3;
      height: 1.4rem;
    }
  }
</style>
