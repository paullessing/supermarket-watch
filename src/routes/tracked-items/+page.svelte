<script lang="ts">
  import type { PriceComparison } from '$lib/models';
  import { fetchJson } from '$lib/util/fetch';
  import { formatCurrency, formatUnitAmount } from '$lib/util/format.js';
  import PriceComparisonCard from './PriceComparisonCard.svelte';
  import type { PageProps } from './$types';
  import EditPriceComparisonDialog, {
    type EditComparisonDetailsData,
    type RemoveProductData,
  } from './EditPriceComparisonDialog.svelte';

  let { data }: PageProps = $props();
  let editIndex: number | null = $state(null);

  let priceComparisons: PriceComparison[] = $state(data.priceComparisons);

  async function deletePriceComparison(id: string): Promise<void> {
    await fetch(`/api/price-comparisons/${id}`, {
      method: 'DELETE',
    });
    priceComparisons = priceComparisons.filter((item) => item.id !== id);
  }

  async function removeProduct({
    comparisonId,
    productId,
  }: RemoveProductData): Promise<void> {
    await fetch(`/api/price-comparisons/${comparisonId}/${productId}`, {
      method: 'DELETE',
    });
    priceComparisons = priceComparisons.map((item) =>
      item.id === comparisonId
        ? {
            ...item,
            products: item.products.filter(
              (product) => product.id !== productId
            ),
          }
        : item
    );
  }

  async function onEditComparison({
    id: comparisonId,
    name,
  }: EditComparisonDetailsData): Promise<void> {
    const comparison = await fetchJson(
      `/api/price-comparisons/${comparisonId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          name,
        }),
      }
    );

    priceComparisons = priceComparisons.map((item) =>
      item.id === comparisonId ? comparison : item
    );
    editIndex = null;
  }
</script>

<div class="content">
  <h2 class="title">Compare Prices</h2>

  <div class="price-comparison-list">
    {#each priceComparisons as priceComparison (priceComparison.id)}
      <PriceComparisonCard {priceComparison}></PriceComparisonCard>
    {/each}
  </div>

  <hr style="margin: 2rem 0" />

  {#if priceComparisons.length}
    <table>
      {#each priceComparisons as comparison, index (comparison.id)}
        <thead>
          <tr>
            <td
              colspan="2"
              style="padding: 0.25rem 0.5rem 0.25rem 0; font-weight: bold"
            >
              {comparison.name}
            </td>
            <td>
              <button
                class="tracked-product__edit"
                onclick={() => (editIndex = index)}
              >
                Edit
              </button>
            </td>
          </tr>
        </thead>
        <tbody>
          {#each comparison.products as product (product.id)}
            <tr>
              <td style="padding: 0.25rem 0.5rem">
                <em title={product.name}>{product.supermarket}</em>
              </td>
              <td
                style="padding: 0.25rem 0.5rem"
                style:color={product.specialOffer ? 'red' : null}
              >
                {formatCurrency(product.price)}
              </td>
              <td style="padding: 0.25rem 0.5rem">
                {formatCurrency(product.pricePerUnit)}/{formatUnitAmount(
                  comparison.unitOfMeasurement
                )}
              </td>
            </tr>
            {#if product.specialOffer}
              <tr>
                <td colspan="1"></td>
                <td colspan="2" style="padding: 0 0.5rem 0.25rem; color: red">
                  {product.specialOffer.offerText}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      {/each}
    </table>
  {/if}
</div>

{#if editIndex !== null}
  <EditPriceComparisonDialog
    comparison={priceComparisons[editIndex]}
    onEditDetails={onEditComparison}
    onDelete={({ id }) => deletePriceComparison(id)}
    onRemoveProduct={removeProduct}
    onExit={() => (editIndex = null)}
  ></EditPriceComparisonDialog>
{/if}

<style lang="scss">
  .tracked-product {
    &__edit {
      border: none;
      background: none;
      text-decoration: underline;
      color: blue;
      cursor: pointer;
    }
  }

  .price-comparison-list {
    $item-spacing: 1rem;

    margin-bottom: -$item-spacing;

    > * {
      margin-bottom: $item-spacing;
    }
  }
</style>
