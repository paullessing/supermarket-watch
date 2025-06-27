<script module lang="ts">
  export interface RemoveProductData {
    productId: string;
    comparisonId: string;
  }

  export interface EditComparisonDetailsData {
    id: string;
    name: string;
  }
</script>

<script lang="ts">
  import type { ComparisonProductData, PriceComparison } from '$lib/models';
  import { onMount } from 'svelte';
  import { clickOutside } from 'svelte-outside';

  interface Props {
    comparison: PriceComparison;
    onEditDetails: (data: EditComparisonDetailsData) => void;
    onDelete: (data: { id: string }) => void;
    onRemoveProduct: (data: RemoveProductData) => void;
    onExit: () => void;
  }

  let { comparison, onEditDetails, onExit, onDelete, onRemoveProduct }: Props =
    $props();

  let isEditingName: boolean = $state(false);
  let isRemovingItems: boolean = $state(false);
  let isMounted: boolean = $state(false);

  let details: Pick<PriceComparison, 'name'> = $state({
    name: comparison.name,
  });

  function onSaveClick(): void {
    setTimeout(() => {
      if (detailsHaveChanged()) {
        onEditDetails({
          id: comparison.id,
          ...details,
        });
      } else {
        onExit();
      }
    });
  }

  function detailsHaveChanged(): boolean {
    return details.name !== comparison.name;
  }

  function onDeleteClick(): void {
    if (
      window.confirm('Are you sure you want to delete this price comparison?')
    ) {
      setTimeout(() => {
        onDelete({ id: comparison.id });
      });
    }
  }

  function onRemoveProductClick(product: ComparisonProductData): void {
    setTimeout(() => {
      const prompt = `Are you sure you want to remove "${product.supermarket} - ${product.name}" from this comparison?`;
      if (window.confirm(prompt)) {
        onRemoveProduct({
          comparisonId: comparison.id,
          productId: product.id,
        });
      }
    });
  }

  onMount(() => {
    setTimeout(() => {
      isMounted = true;
    });
  });

  function close(): void {
    if (isMounted) {
      onExit();
    }
  }
</script>

<div class="edit-comparison-dialog">
  <div class="edit-comparison-dialog__wrapper" use:clickOutside={close}>
    <button
      class="edit-comparison-dialog__close"
      onclick={close}
      style="cursor: pointer"
    >
      Close
    </button>

    <div class="edit-comparison-dialog__content">
      <h1>Edit Price Comparison</h1>
      {#if !isEditingName}
        <h2>
          {comparison.name}
          <button
            class="edit-comparison-dialog__edit-name-button button-link"
            onclick={() => setTimeout(() => (isEditingName = true))}
            style="cursor: pointer"
          >
            Edit
          </button>
        </h2>
      {:else}
        <input
          type="text"
          class="edit-comparison-dialog__name-input"
          bind:value={details.name}
        />
      {/if}

      <h3 class="edit-comparison-dialog__items-title">
        Products
        <button
          class="edit-comparison-dialog__edit-items-button button-link"
          onclick={() => (isRemovingItems = !isRemovingItems)}
          style="cursor: pointer"
        >
          {isRemovingItems ? 'Done' : 'Edit'}
        </button>
      </h3>
      <ul
        class="edit-comparison-dialog__product-list"
        class:edit-comparison-dialog__product-list--edit={isRemovingItems}
      >
        {#each comparison.products as product}
          <li class="edit-comparison-dialog__product-list-item">
            {product.name} (<em>{product.supermarket}</em>)
            {#if isRemovingItems}
              <button
                class="edit-comparison-dialog__remove-button button-link"
                onclick={() => onRemoveProductClick(product)}
              >
                Remove
              </button>
            {/if}
          </li>
        {/each}
      </ul>

      <div class="edit-comparison-dialog__buttons">
        <button
          class="edit-comparison-dialog__button button-link edit-comparison-dialog__button--delete edit-comparison-dialog__button--left"
          onclick={onDeleteClick}
        >
          Delete Item
        </button>
        <button class="edit-comparison-dialog__button" onclick={close}>
          Cancel
        </button>
        <button
          class="edit-comparison-dialog__button"
          type="submit"
          onclick={onSaveClick}
        >
          Save
        </button>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .edit-comparison-dialog {
    $root: &;

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

      &--left {
        margin-right: auto;
        margin-left: 0;
      }

      &--delete {
        color: red;
      }
    }

    &__edit-name-button {
      font-size: 1rem;
      color: blue;
      font-weight: normal;
    }

    &__name-input {
      padding: 0.5rem;
      margin-top: 0.5rem;
      width: 100%;
    }

    &__items-title {
      display: flex;
      padding-top: 1rem;
    }

    &__edit-items-button {
      font-size: 1rem;
      color: blue;
      font-weight: normal;
      margin-left: auto;
    }

    $product-list-overflow: 0.5rem;

    &__product-list {
      padding-left: 0;
      margin-left: -$product-list-overflow;
      margin-right: -$product-list-overflow;
    }

    &__product-list-item {
      padding: 0.5rem $product-list-overflow;
      cursor: default;
      display: flex;

      #{$root}__product-list--edit &:hover {
        background-color: #f5f5f5;
      }
    }

    &__remove-button {
      margin-left: auto;
      color: red;
      position: relative;

      &::before {
        display: block;
        content: '';
        position: absolute;
        left: -0.5rem;
        right: -0.5rem;
        top: -0.5rem;
        bottom: -0.5rem;
      }
    }
  }
</style>
