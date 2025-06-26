import { isAfter, startOfDay } from 'date-fns';
import { conversionService, ConversionService } from '../conversion.service';
import { SupermarketProduct } from '../supermarket-product.model';
import type { ManualConversion } from '$lib/models';
import { minimum } from '$lib/util/util';

export class ProductPriceCalculator {
  constructor(private readonly conversionService: ConversionService) {}

  public getBestPrice(
    products: { product: SupermarketProduct; lastUpdated: Date }[],
    now: Date,
    targetUnit: { name: string; amount: number },
    manualConversions: ManualConversion[]
  ): { unitPrice: number; itemPrice: number } {
    const today = startOfDay(now);

    const productPrices = products.map(({ product, lastUpdated }) => {
      const currentPrice = this.conversionService.convert(
        product.pricePerUnit,
        { unit: product.unitName, unitAmount: product.unitAmount },
        { unit: targetUnit.name, unitAmount: targetUnit.amount },
        manualConversions
      );

      return {
        lastUpdated,
        itemPrice: product.price,
        currentPrice,
      };
    });

    const best = productPrices
      .filter(({ lastUpdated }) => isAfter(lastUpdated, today))
      .reduce(minimum('currentPrice')) ?? { itemPrice: 0, unitPrice: 0 };

    return { itemPrice: best.itemPrice, unitPrice: best.currentPrice };
  }

  public getUsualPrice(
    products: { product: SupermarketProduct }[],
    targetUnit: { name: string; amount: number },
    manualConversions: ManualConversion[]
  ): { unitPrice: number; itemPrice: number } {
    return (
      products
        .map(({ product }) => {
          const currentPrice = this.conversionService.convert(
            product.pricePerUnit,
            { unit: product.unitName, unitAmount: product.unitAmount },
            { unit: targetUnit.name, unitAmount: targetUnit.amount },
            manualConversions
          );

          const usualPrice = product.specialOffer
            ? this.conversionService.convert(
                product.specialOffer.originalPricePerUnit ?? 0,
                { unit: product.unitName, unitAmount: product.unitAmount },
                { unit: targetUnit.name, unitAmount: targetUnit.amount },
                manualConversions
              )
            : currentPrice;

          return {
            unitPrice: usualPrice,
            itemPrice: product.specialOffer
              ? (product.specialOffer.originalPrice ?? 0)
              : product.price,
          };
        })
        .reduce(minimum('unitPrice')) ?? { itemPrice: 0, unitPrice: 0 }
    );
  }
}

export const productPriceCalculator = new ProductPriceCalculator(
  conversionService
);
