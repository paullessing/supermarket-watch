<script lang="ts">
  import { formatCurrency, formatUnitAmount } from '$lib/util/format.js';
  import type { PriceComparison } from '$lib/models';

  interface Props {
    priceComparison: PriceComparison;
  }

  let { priceComparison }: Props = $props();

  let backgroundImage: string = $derived(
    `url(${JSON.stringify(priceComparison.image)})`
  );

  let isExpanded: boolean = $state(false);

  // let isLoadingHistoryData: boolean = $state(false);
  // let historyData: ApexAxisChartSeries | null = null;

  function getReductionPercentage(): number {
    const best = priceComparison.price.best.unitPrice;
    const usual = priceComparison.price.usual.unitPrice;

    return Math.round((1 - best / usual) * 100);
  }

  // async function loadHistoryData(): Promise<void> {
  //   isLoadingHistoryData = true;
  //
  //   type HistoryReturnValue = {
  //     history: { date: Date; price: number; pricePerUnit: number }[];
  //   };
  //
  //   const data = await Promise.all(
  //     priceComparison.products.map(
  //       async ({
  //         id,
  //         name,
  //         supermarket,
  //       }): HistoryReturnValue & { name: string; supermarket: string } => ({
  //         ...(await fetchJson<HistoryReturnValue>(
  //           `/api/products/${id}/history`
  //         )),
  //         name,
  //         supermarket,
  //       })
  //     )
  //   );
  //
  //   // console.log('got the data', data);
  //
  //   historyData = data.map(({ name, history, supermarket }) => ({
  //     name: `${name} (${supermarket})`,
  //     color: getSupermarketColour(supermarket),
  //     data: history.map(
  //       ({ date, price }) =>
  //         [startOfDay(new Date(date)).getTime(), price] as [
  //           number,
  //           number | null,
  //         ]
  //     ),
  //   }));
  // }

  // function getSupermarketColour(supermarket: string): string | undefined {
  //   return (
  //     {
  //       // TODO: Store this on the supermarkets themselves, or return it with the HTTP data
  //       Waitrose: '#5c8018',
  //       Tesco: '#00539f',
  //       "Sainsbury's": '#f06b02',
  //     }[supermarket] ?? undefined
  //   );
  // }
</script>

<div class="price-comparison-card">
  <div
    class="price-comparison-card__image"
    style="background-image: {backgroundImage}"
  ></div>
  <p class="price-comparison-card__name">{priceComparison.name}</p>
  <div class="price-comparison-card__price-area">
    <!-- @formatter:off -->
    {#if getReductionPercentage() > 0}
      <span class="price-comparison-card__original-price"
        >{formatCurrency(priceComparison.price.usual.itemPrice)}</span
      >
    {/if}
    <span class="price-comparison-card__best-price">
      {formatCurrency(priceComparison.price.best.itemPrice)}
    </span>
    <p class="price-comparison-card__price">
      {formatCurrency(priceComparison.price.best.unitPrice)}/{formatUnitAmount(
        priceComparison.unitOfMeasurement
      )}
    </p>
    {#if getReductionPercentage() > 0}
      <p class="price-comparison-card__reduction">
        -{getReductionPercentage()}%
      </p>
    {/if}
    <!--    <span
              class="price-comparison-card__usual-price"
              *ngIf="getReductionPercentage() > 0"
            > (usually {
                priceComparison.pricePerUnit.usual | currency:'GBP'
              }/{
                priceComparison.unitOfMeasurement.amount === 1 ? '' : priceComparison.unitOfMeasurement.amount
              }{
                priceComparison.unitOfMeasurement.name
              })</span>-->
    <!-- @formatter:on -->
  </div>
  <div class="price-comparison-card__items">
    <button class="button-link" onclick={() => (isExpanded = !isExpanded)}>
      Products {isExpanded ? '-' : '+'}
    </button>
    {#if isExpanded}
      <table style="border-collapse: collapse">
        <tbody>
          {#each priceComparison.products as product}
            <tr>
              <td style="padding: 4px 16px 4px 0">{product.supermarket}</td>
              <td
                style="padding-right: 16px"
                style:color={product.specialOffer ? 'red' : null}
              >
                {formatCurrency(product.pricePerUnit)}/{formatUnitAmount(
                  priceComparison.unitOfMeasurement
                )}
              </td>
              <td
                style="padding-right: 8px"
                style:color={product.specialOffer ? 'red' : null}
              >
                {product.packSize.amount}{product.packSize.unit}
              </td>
              <td style:color={product.specialOffer ? 'red' : null}>
                {formatCurrency(product.price)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>

  <!--  <div class="price-comparison-card__graph">-->
  <!--    <button-->
  <!--      *ngIf="!historyData"-->
  <!--      class="button-link"-->
  <!--      (click)="loadHistoryData()"-->
  <!--      [disabled]="isLoadingHistoryData"-->
  <!--    >-->
  <!--      { isLoadingHistoryData ? 'Loading...' : 'View Stats' }-->
  <!--    </button>-->

  <!--    <apx-chart-->
  <!--      *ngIf="historyData"-->
  <!--      class="price-comparison-card__graph"-->
  <!--      [series]="historyData"-->
  <!--      [chart]="{ type: 'line', height: 350, animations: { enabled: false } }"-->
  <!--      [stroke]="{ curve: 'stepline', width: 1 }"-->
  <!--      [title]="{-->
  <!--        text: 'Price History',-->
  <!--        align: 'left',-->
  <!--        style: { fontFamily: 'inherit' },-->
  <!--      }"-->
  <!--      [xaxis]="{ type: 'datetime' }"-->
  <!--      [legend]="{ fontFamily: 'inherit' }"-->
  <!--    ></apx-chart>-->
  <!--  </div>-->
</div>

<style lang="scss">
  .price-comparison-card {
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(#000, 0.2);
    padding: 8px;
    width: 100%;

    display: grid;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      'image name price'
      'image data data'
      'graph graph graph';

    $padding: 0.5rem;

    &__image {
      width: 20vw;
      max-width: 150px;
      min-width: 80px;
      background-repeat: no-repeat;
      background-size: contain;
      background-position: top;
      flex-shrink: 0;
      margin-right: $padding;
      grid-area: image;

      &::before {
        display: block;
        content: '';
        padding-top: 100%;
        width: 100%;
      }
    }

    &__name {
      font-size: 1.1em;
      font-weight: 500;

      grid-area: name;
    }

    &__price-area {
      font-weight: 300;
      text-align: right;

      grid-area: price;
      justify-content: start;
    }

    &__price {
      margin-bottom: 0.5rem;
    }

    &__reduction {
      margin-top: 0.5rem;
      font-size: 1.3rem;
      font-weight: 400;
      color: red;
    }

    &__usual-price {
      display: block;
      text-align: right;
    }

    &__best-price {
      font-weight: 400;
      font-size: 1.1em;
    }

    &__items {
      grid-area: data;
    }

    &__original-price {
      position: relative;

      &::before {
        display: block;
        content: '';
        border-bottom: 1px solid #444;
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
      }
    }

    &__graph {
      grid-area: graph;
      margin-top: 1rem;
    }
  }
</style>
