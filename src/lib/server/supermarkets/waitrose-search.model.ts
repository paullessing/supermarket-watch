/* eslint @typescript-eslint/no-empty-object-type: "off" */ // This complains about the `{}` types which we don't have information for
export interface SearchResults {
  criteria: {
    searchTags: [
      {
        text: string; // 'Vivera'
        value: string; // 'vivera'
        group: string; // 'CUSTOM'
      },
    ];
    suggestedSearchTags: unknown[];
    filters: [
      {
        group: string; // 'OFFER_TYPE'
        filters: [
          {
            filterTag: {
              text: string; // 'All Offers'
              value: string; // '1'
              id: string; // 'promotionflag'
              group: string; // 'OFFER_TYPE'
              count: number; // 1
            };
            applied: boolean; // false
          },
        ];
      },
    ];
    sortBy: string; // 'RELEVANCE'
    alternative: boolean; // false
  };
  totalMatches: number; // 11
  productsInResultset: number; // 11
  relevancyWeightings: string[]; // [ "$rc_master_generic" ]
  searchRulesets: string[]; // [ "EXACT" ]
  categoryLevelFilters: {
    name: string; // 'Dietary & Lifestyle'
    categoryId: string; // '234676'
    expectedResults: number; // 6
  }[];
  searchTime: number; // 0
  totalTime: number; // 0
  componentsAndProducts: (SearchAemComponent | SearchProduct)[];
}

export function isProduct(
  item: SearchProduct | SearchAemComponent
): item is SearchProduct {
  return item && Object.prototype.hasOwnProperty.call(item, 'searchProduct');
}

interface Promotion {
  promotionUnitPrice?: {
    amount: number; // 2.4,
    currencyCode: string; // 'GBP'
  };
  promotionalPricePerUnit?: string; // '(£13.72 per kg)'
  promotionDescription: string; // '20% Off'
  promotionTypeCode: string; // 'POF' | 'MV' (POF = percent off, MV = multi-purchase)
  promotionExpiryDate: string; // '2021-06-01'
  promotionId: number; // 375864
  pyoPromotion: boolean; // false
  myWaitrosePromotion: boolean; // false
}

interface DetailedPromotion extends Promotion {
  groups: {
    threshold: number; // 1: number of items required to buy to fulfil promotion
    name: string; // 'X'
    lineNumbers: ['472425'];
  }[];
}

export interface SearchProduct {
  searchProduct: {
    resultType: string; // 'GENERAL'
    id: string; // '472425-629172-629173'
    lineNumber: string; // '472425'
    productType: string; // 'G'
    name: string; // 'Vivera Veggie Shawarma Kebab'
    size: string; // '175g'
    thumbnail: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_472425_BP_9.jpg'
    reviews: {
      averageRating: number; // 4.4412,
      reviewCount: number; // 34
    };
    currentSaleUnitPrice: {
      quantity: {
        amount: number; // 1
        uom: string; // 'C62'
      };
      price: {
        amount: number; // 3
        currencyCode: string; // 'GBP'
      };
    };
    defaultQuantity: {
      amount: number; // 1
      uom: string; // 'C62'
    };
    promotion?: Promotion;
    promotions: DetailedPromotion[];
    persistDefault: boolean; // false
    displayPrice: string; // '£2.40'
    displayPriceEstimated: boolean; // false
    displayPriceQualifier: string; // '(£13.72/kg)'
    leadTime: number; // 0
    maxPersonalisedMessageLength: number; // 0
    productImageUrls: {
      small: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_472425_BP_9.jpg'
      medium: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/3/LN_472425_BP_3.jpg'
      large: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_472425_BP_11.jpg'
      extraLarge: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/4/LN_472425_BP_4.jpg'
    };
    weights: {
      uoms: string[]; // ["C62"]
      pricePerUomQualifier: string; // '(£13.72/kg)'
    };
    restriction: {};
    searchScore: string; // '2.5'
    substitutionsProhibited: boolean; // false
    customerProductDetails: {
      customerFavourite: boolean; // false
      customerPyo: boolean; // false
    };
    markedForDelete: boolean; // false
    cqResponsive: {
      deviceBreakpoints: {
        name: string; // 'default'
        visible: boolean; // true
      }[];
    };
    sponsored: boolean; // false
  };
}

export interface SearchAemComponent {
  aemComponent: {
    multiService: boolean; // false
    multiServiceData: {};
    gridPosition: number; // 4
    resourceType: string; // 'waitrosegroceriescms/components/content/tradingcontent/tradingcell'
    cqResponsive: {
      deviceBreakpoints: {
        width: string; // '12'
        name: string; // 'xs'
        auto: boolean; // false
        layout: string; // 'oneCell'
        visible: boolean; // true
      }[];
    };
    componentId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component'
    uniqueId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_4'
    childComponents: unknown[];
    nodeName: string; // 'referenced-component'
    componentPlaceholder: boolean; // false
    styleIds: unknown[];
    defaultNumOfCells: string; // 'twoCells'
    image: {
      landscapeImage: {
        multiService: boolean; // false
        multiServiceData: {};
        resourceType: string; // 'waitrosegroceriescms/components/content/image'
        componentId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_image_landscape'
        uniqueId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_image_landscape'
        childComponents: unknown[];
        nodeName: string; // 'landscape'
        componentPlaceholder: boolean; // false
        styleIds: unknown[];
        src: string; // '/content/waitrosegroceriescms/en/library/productGrid/static-trading-pod/2018/july/vegan---vegetarian-refresh/149-vegan-lifestyle/jcr:content/library-par/referenced-component/image/landscape.wtrAdaptiveImg.jpg/1530017065487.jpg'
        adaptiveSrcs: {};
        altText: string; // 'xxx'
        uncropped: boolean; // false
        isDecorative: boolean; // false
        fileReference: string; // '/content/dam/waitrosegroceriescms/ecomm/2018/july/vegan-&-vegetarian-refresh/127-vegan-healthy.jpg'
        newWindow: boolean; // false
        mobileImage: {};
        childComponentsVerticalAlignment: string; // 'top'
        overlayColor: string; // ''
        tabletImage: {};
        items: {};
        itemsOrder: unknown[];
      };
      portraitImage: {
        multiService: boolean; // false
        multiServiceData: {};
        resourceType: string; // 'waitrosegroceriescms/components/content/image'
        componentId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_image_portrait'
        uniqueId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_image_portrait'
        childComponents: unknown[];
        nodeName: string; // 'portrait'
        componentPlaceholder: boolean; // false
        styleIds: unknown[];
        adaptiveSrcs: {};
        uncropped: boolean; // false
        isDecorative: boolean; // false
        newWindow: boolean; // false
        mobileImage: {};
        childComponentsVerticalAlignment: string; // 'top'
        overlayColor: string; // ''
        tabletImage: {};
        items: {};
        itemsOrder: unknown[];
      };
    };
    textArea: {
      heading: string; // 'Going vegan? Or just a little bit vegan...'
      subheading: string; // 'If you designate one day a week to vegan food, or try a fully plant-based diet, it’s a move that could be good for your health with extra fruit, vegetables, and fibre'
      disclaimer: string; // 'on selected lines only'
      displayDisclaimer: boolean; // false
      buttonStyle: string; // 'primary'
      link: {
        text: string; // 'Shop vegan'
        altText: string; // 'Shop vegan'
        url: string; // '/ecom/shop/browse/groceries/health_free_from_and_specialist_eating/vegan'
        newWindow: boolean; // false
      };
      theme: string; // 'light'
    };
    icons: {
      messageIcon: {
        display: boolean; // true
        data: {
          message: string; // 'Try'
          theme: string; // 'grey'
        };
      };
      brandIcon: {
        display: boolean; // false
        image: {
          multiService: boolean; // false
          multiServiceData: {};
          resourceType: string; // 'waitrosegroceriescms/components/content/image'
          componentId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_icons_brandIcon_brandImage'
          uniqueId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_icons_brandIcon_brandImage'
          childComponents: unknown[];
          nodeName: string; // 'brandImage'
          componentPlaceholder: boolean; // false
          styleIds: unknown[];
          adaptiveSrcs: {};
          uncropped: boolean; // false
          isDecorative: boolean; // false
          newWindow: boolean; // false
          mobileImage: {};
          childComponentsVerticalAlignment: string; // 'top'
          overlayColor: string; // ''
          tabletImage: {};
          items: {};
          itemsOrder: unknown[];
        };
        position: string; // 'floated'
      };
      offerRoundel: {
        display: boolean; // false
        image: {
          multiService: boolean; // false
          multiServiceData: {};
          resourceType: string; // 'waitrosegroceriescms/components/content/image'
          componentId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_icons_offerRoundel_roundelImage'
          uniqueId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component_icons_offerRoundel_roundelImage'
          childComponents: unknown[];
          nodeName: string; // 'roundelImage'
          componentPlaceholder: boolean; // false
          styleIds: unknown[];
          adaptiveSrcs: {};
          uncropped: boolean; // false
          isDecorative: boolean; // false
          newWindow: boolean; // false
          mobileImage: {};
          childComponentsVerticalAlignment: string; // 'top'
          overlayColor: string; // ''
          tabletImage: {};
          items: {};
          itemsOrder: unknown[];
        };
      };
    };
    analytics: {
      analyticsId: string; // '_content_waitrosegroceriescms_en_library_productGrid_static-trading-pod_2018_july_vegan---vegetarian-refresh_149-vegan-lifestyle_jcr_content_library-par_referenced-component'
      analyticsComponentType: string; // 'waitrosegroceriescms/components/content/tradingcontent/tradingcell'
      promoName: string; // 'waitrose:ecommerce-trading/online-campaign-code/TM_VeganLifstyle_MSO_PM2_P6'
    };
    items: {};
    itemsOrder: unknown[];
  };
}

export interface SingleResult {
  products: [
    {
      resultType: string; // 'GENERAL'
      id: string; // '472425-629172-629173'
      lineNumber: string; // '472425'
      productType: string; // 'G'
      name: string; // 'Vivera Veggie Shawarma Kebab'
      size: string; // '175g'
      thumbnail: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_472425_BP_9.jpg'
      reviews: {
        averageRating: number; // 4.4412
        reviewCount: number; // 34
      };
      currentSaleUnitPrice: {
        quantity: {
          amount: number; // 1
          uom: string; // 'C62'
        };
        price: {
          amount: number; // 3
          currencyCode: string; // 'GBP'
        };
      };
      defaultQuantity: {
        amount: number; // 1
        uom: string; // 'C62'
      };
      promotion?: Promotion;
      promotions: DetailedPromotion[];
      persistDefault: boolean; // false
      displayPrice: string; // '£2.40'
      displayPriceEstimated: boolean; // false
      displayPriceQualifier: string; // '(£13.72/kg)'
      leadTime: number; // 0
      contents: {
        name: string; // 'Vivera Veggie Shawarma Kebab'
        ingredients: string; // 'Rehydrated <STRONG>SOYA</STRONG> Protein ^87%], Rapeseed Oil, Sunflower Oil, Vinegar, Herbs and Spices, Salt, Natural Flavourings, Dried Vegetables ^Paprika, Onion], Water, Garlic, Maltodextrin, Paprika Concentrate, Vitamins and Minerals ^Vitamin B12, Iron]'
        ingredientsNote: string; // 'Please see ingredients in <STRONG>BOLD</STRONG>.'
        allergens: [];
        nutrients: {
          rdaHeader: string; // '. * Reference intake of an average adult (8400 kJ/2000 kcal), ** Reference intake of vitamins and minerals'
          per100gHeader: string; // 'per 100g'
          nutrientsData: {
            name: string; // 'Energy'
            valuePerUnit: string; // '594kJ'
            valuePerUnitUOM: string; // 'KJoules'
          }[];
        };
        referenceIntakes: {
          riPortionFooter1: string; // 'RI = % of your daily reference intake'
          riPortionHeader: string; // 'Per 100 g'
          riItems: {
            name: string; // 'Energy'
            percent: string; // '7%'
            value: string; // '150kcal|625kJ'
          }[];
        };
        statements: {
          name: string; // 'Lifestyle'
          values: string[]; // ["Suitable for Vegans"]
        }[];
        origins: [];
        cookingInstructions: {
          type: string; // 'FROMAMBIENT'
          value: string; // 'Minimum 6 minutes on aluminium foil.'
          group: string; // 'Barbecue'
        }[];
        marketingDescBop: string; // 'Contains 15% Protein Vitamin B12 & Iron. Our Fans Favourite. Cook Me Please. Good for You! 100% Plant-Based. High in protein. Source of iron and vitamin B12. Vegan Friendly.This product contains added iron and vitamin B12. Soya Soya is used to make most of our delicious plant-based products as it is high in protein and contains lots of fibre. Soya is a very sustainable crop as it grows very fast and all parts of the plant can be used. Our soya is GMO free and comes from France, North-America and China from areas where no deforestation has taken place to grow soya. We are hoping to source more soya from Europe as soon as the taste, quality and quantities are in line with our requirements. Watch this space! Better Health A plant-based diet has great health benefits. It typically contains more healthy unsaturated fats, less saturated fat, and less cholesterol. Our Vivera products fit perfectly into your balanced plant-based diet, as they are high in protein and we added iron and vitamin B12. Good for you, good for the planet!'
        brandedUsageInstr: string; // 'Yumminess! To Make Plant Shawarma Pitas in 20 Minutes for 2 You'll Also Need: - 1 clove of garlic - 5 g chives - 2 tbsp of (vegan) mayonnaise - 2 tbsp of (vegan) yoghurt - 200 g of cherry tomatoes - 1 small red onion - 2 large pitas - lettuce - Olive oil, pepper and salt'
      };
      maxPersonalisedMessageLength: number; // 0
      productImageUrls: {
        small: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/9/LN_472425_BP_9.jpg'
        medium: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/3/LN_472425_BP_3.jpg'
        large: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_472425_BP_11.jpg'
        extraLarge: string; // 'https://ecom-su-static-prod.wtrecom.com/images/products/4/LN_472425_BP_4.jpg'
      };
      availableDays: string; // 'NYYYYYY'
      alcohol: number; // 0
      weights: {
        uoms: ['C62'];
        pricePerUomQualifier: string; // '(£13.72/kg)'
      };
      restriction: {};
      substitutionsProhibited: boolean; // false
      customerProductDetails: {
        customerFavourite: boolean; // false
        customerPyo: boolean; // false
      };
      productShelfLife: number; // 8
      markedForDelete: boolean; // false
      summary: string; // 'Precooked plant-based slices made from rehydrated soya protein and seasoned with shawarma herbs.'
      brand: string; // 'Vivera'
      shelfLife: number; // 8
      shortName: string; // 'Vivera Veggie Shawarma Kebab'
      image: string; // '/images/products/9/LN_472425_BP_9.jpg'
      alcoholDetails: {};
      wine: {};
      cake: {};
      packageContents: unknown[];
      attributes: {
        frozen: boolean; // false
        previouslyFrozen: boolean; // false
        freezing: boolean; // false
        organic: boolean; // false
        analgesic: boolean; // false
        fairtrade: boolean; // false
        kosher: boolean; // false
        seasonal: boolean; // false
        microwaveable: boolean; // false
        waitroseOwnLabel: boolean; // false
        essentialRange: boolean; // false
        ageRestriction: boolean; // false
        serviceCounter: boolean; // false
        colourMayVary: boolean; // false
        varietyMayVary: boolean; // false
      };
      allergens: {
        suitableForThoseAvoidingEgg: boolean; // false
        suitableForThoseAvoidingGluten: boolean; // false
        suitableForThoseAvoidingMilk: boolean; // false
        suitableForThoseAvoidingNuts: boolean; // false
        suitableForThoseAvoidingSoya: boolean; // false
        suitableForVegans: boolean; // false
        suitableForVegetarians: boolean; // false
      };
      packaging: unknown[];
      categories: {
        id: string; // '10051'
        name: string; // 'Groceries'
        urlName: string; // 'Groceries'
      }[];
    },
  ];
  totalMatches: number; // 0
  productsInResultset: number; // 0
  searchTime: number; // 0
  totalTime: number; // 0
}
