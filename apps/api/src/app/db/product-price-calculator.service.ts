import { isAfter, startOfDay } from 'date-fns';
import { ManualConversion } from '@shoppi/api-interfaces';
import { ConversionService } from '../conversion.service';
import { SupermarketProduct } from '../supermarkets';
import { minimum } from '../util';

export class ProductPriceCalculator {
  constructor(
    private readonly conversionService: ConversionService
  ) {
  }

  public getBestPrice(
    products: { product: SupermarketProduct; lastUpdated: Date }[],
    now: Date,
    targetUnit: { name: string; amount: number },
    manualConversions: ManualConversion[]
  ): number {
    const today = startOfDay(now);

    const productPrices = products
      .map(({ product, lastUpdated }) => {
        const currentPrice = this.conversionService.convert(
          product.pricePerUnit,
          { unit: product.unitName, unitAmount: product.unitAmount },
          { unit: targetUnit.name, unitAmount: targetUnit.amount },
          manualConversions
        );

        return {
          lastUpdated,
          currentPrice,
        }
      });

    const best =
      productPrices
        .filter(({ lastUpdated }) => isAfter(lastUpdated, today))
        .map(({ currentPrice }) => currentPrice)
        .reduce(minimum) ?? 0;

    return best;
  }

  public getUsualPrice(
    products: { product: SupermarketProduct }[],
    targetUnit: { name: string; amount: number },
    manualConversions: ManualConversion[]
  ): number {
    return products
      .map(({ product }) => {
        const currentPrice = this.conversionService.convert(
          product.pricePerUnit,
          { unit: product.unitName, unitAmount: product.unitAmount },
          { unit: targetUnit.name, unitAmount: targetUnit.amount },
          manualConversions
        );

        const usualPrice = product.specialOffer ? this.conversionService.convert(
          product.specialOffer.originalPricePerUnit,
          { unit: product.unitName, unitAmount: product.unitAmount },
          { unit: targetUnit.name, unitAmount: targetUnit.amount },
          manualConversions
        ) : currentPrice;

        return usualPrice;
      }).reduce(minimum) ?? 0;
  }
}
