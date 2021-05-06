export namespace Tesco {
  export interface ProductDetails {
    cost: number; // 0
    quantity: number; // 0
    product: {
      id: string; // '297511908'
      gtin: string; // '05060283761529'
      baseProductId: string; // '83590683'
      title: string; // 'Propercorn Lightly Sea Salt Popcorn 6X10g'
      description: string[];
      brandName: string; // 'PROPERCORN'
      isInFavourites: unknown;
      defaultImageUrl: string; // 'https://digitalcontent.api.tesco.com/v2/media/ghs/c685489d-90a2-4b09-90e4-20bc27cedd39/snapshotimagehandler_1473680290.jpeg?h=225&w=225'
      images: string[]; // [ "https://digitalcontent.api.tesco.com/v2/media/ghs/c685489d-90a2-4b09-90e4-20bc27cedd39/snapshotimagehandler_1473680290.jpeg?h=225&w=225", "https://digitalcontent.api.tesco.com/v2/media/ghs/e97e4972-e2a2-4e2d-b802-8bc464250178/snapshotimagehandler_839833994.jpeg?h=225&w=225" ]
      displayType: string; // 'Quantity'
      productType: string; // 'SingleProduct'
      averageWeight: unknown;
      maxQuantityAllowed: number; // 25
      bulkBuyLimit: number; // 25
      groupBulkBuyLimit: number; // 0
      bulkBuyLimitMessage: string; // 'You are able to buy a maximum of 25 of this item'
      bulkBuyLimitGroupId: string; // 'G00032327'
      timeRestrictedDelivery: unknown;
      restrictedDelivery: unknown;
      isRestrictedOrderAmendment: unknown;
      isForSale: boolean;
      isNew: boolean;
      status: string; // 'AvailableForSale'
      foodIcons: string[]; // [ "Vegan" ]
      shelfLife: unknown;
      restrictions: unknown[];
      distributorAddress: unknown;
      manufacturerAddress: {
        addressLine1: string; // 'PROPERCORN,'
        addressLine2: string; // '41 Wenlock Road,'
        addressLine3: string; // 'London,'
        addressLine4: string; // 'N1 7SG.'
        addressLine5: unknown;
        addressLine6: unknown;
      };
      importerAddress: unknown;
      returnTo: {
        addressLine1: string; // 'PROPERCORN,'
        addressLine2: string; // '41 Wenlock Road,'
        addressLine3: string; // 'London,'
        addressLine4: string; // 'N1 7SG.'
        addressLine5: string; // 'cass@propercorn.com'
        addressLine6: unknown;
        addressLine7: unknown;
        addressLine8: unknown;
        addressLine9: unknown;
        addressLine10: unknown;
        addressLine11: unknown;
        addressLine12: unknown;
      };
      maxWeight: unknown;
      minWeight: unknown;
      increment: unknown;
      catchWeightList: unknown;
      reviews: {
        info: {
          offset: number; // 0
          total: number; // 5
          page: number; // 1
          count: number; // 5
        };
        entries: {
          author: {
            authoredByMe: boolean;
          };
          reviewId: string; // 'trn:tesco:ugc:rnr:uuid:e8708133-bd32-464a-8aa0-2b53306bcd0f'
          lastModificationTime: unknown;
          lastModeratedTime: unknown;
          rating: {
            value: number; // 4
            range: number; // 5
          };
          status: string; // 'Approved'
          summary: string; // 'Salty and soft'
          text: string; // 'They are fine, but as with any popcorn the kernels are there'
          syndicated: boolean;
          syndicationSource: {
            name: unknown;
            logo: unknown;
            clientId: unknown;
            contentLink: unknown;
          };
          submissionTime: number; // 1589045019703
        }[];
        product: {
          tpnb: string; // '83590683'
          tpnc: unknown;
        };
        stats: {
          countsPerRatingLevel: unknown;
          createdOn: unknown;
          noOfReviews: number; // 5
          overallRatingRange: number; // 5
          overallRating: number; // 4.8
        };
        errors: unknown[];
      };
      multiPackDetails: unknown;
      details: {
        ingredients: string[]; // [ "Wholegrain Corn (86%)", "Rapeseed Oil", "Sea Salt" ],
        packSize: {
          value: string; // '60'
          units: string; // 'G'
        }[];
        allergenInfo: {
          name: string; // 'Other Allergen Info'
          values: string[]; // [ "Made in a factory that handles Milk" ]
        }[];
        marketingTextInfo: unknown;
        storage: unknown;
        nutritionInfo: {
          name: string; // 'Typical Values'
          perComp: string; // 'Per 100g'
          perServing: string; // 'Per 10g'
          referenceIntake: unknown;
          referencePercentage: unknown;
        }[];
        otherNutritionInformation: unknown;
        hazardInfo: {
          chemicalName: string; // ''
          productName: string; // ''
          signalWord: string; // ''
          statements: string[]; // ["Warning: May contain the occasional un-popped kernel."]
          symbolCodes: unknown[];
        };
        guidelineDailyAmount: {
          title: unknown;
          dailyAmounts: unknown[];
        };
        numberOfUses: unknown;
        preparationAndUsage: unknown;
        cookingInstructions: {
          oven: {
            chilled: {
              time: unknown;
              instructions: unknown[];
              temperature: unknown;
            },
            frozen: {
              time: unknown;
              instructions: unknown[];
              temperature: unknown;
            }
          },
          microwave: {
            chilled: {
              detail: unknown;
              instructions: unknown[];
            },
            frozen: {
              detail: unknown;
              instructions: unknown[];
            }
          },
          cookingMethods: unknown[];
          otherInstructions: unknown[];
          cookingGuidelines: unknown[];
          cookingPrecautions: unknown[];
        };
        freezingInstructions: unknown;
        manufacturerMarketing: unknown;
        productMarketing: unknown;
        brandMarketing: string[]; // ["Proper. Small word, big ambition.", "My father was a hopeless cook but made the best popcorn. We'd spend hours obsessing over new flavours, delicious ingredients and the magic of popping corn.", "Years later, inspired by the popcorn maker he gave me, Proper was born.", "We started from humble beginnings, improvising by tossing kernels in a refashioned cement mixer! Now, we continue to do things differently. Making snacks Proper.", "For us, taste is everything. Take these packs of Lightly Sea Salted. We spent years perfecting this classic recipe, sprinkling our hand-popped butterfly corn with just the right amount of sea salt.", "It's popcorn, done properly.", "I hope you love it.", "Cassandra."]
        otherInformation: unknown;
        additives: unknown;
        warnings: string[]; // ["Warning: May contain the occasional un-popped kernel."]
        netContents: string; // '6 x 10g ℮'
        drainedWeight: unknown;
        safetyWarning: unknown;
        lowerAgeLimit: unknown;
        upperAgeLimit: unknown;
        healthmark: unknown;
        recyclingInfo: unknown;
        nappyInfo: unknown;
        alcoholInfo: unknown;
        originInformation: {
          title: string; // 'Produce of'
          value: string; // 'Made in the UK'
        }[];
        dosage: unknown;
        preparationGuidelines: unknown;
        directions: unknown;
        features: string[]; // ["44 kcal per serve", "1824 kJ / 436 kcal per 100g", "Natural seasoning", "Gluten free", "Vegan", "Kosher - KLBD"]
        healthClaims: unknown;
        boxContents: unknown;
        nutritionalClaims: unknown;
      };
      depositAmount: unknown;
      price: number; // 1.79,
      unitPrice: number; // 2.99,
      unitOfMeasure: string; // '100g'
      aisleId: string; // 'b;Rm9vZCUyMEN1cGJvYXJkJTdDQ3Jpc3BzLCUyMFNuYWNrcywlMjBOdXRzJTIwJiUyMFBvcGNvcm4lN0NQb3Bjb3Ju'
      shelfName: string; // 'Salted Popcorn'
      aisleName: string; // 'Popcorn'
      departmentId: string; // 'b;Rm9vZCUyMEN1cGJvYXJkJTdDQ3Jpc3BzLCUyMFNuYWNrcywlMjBOdXRzJTIwJiUyMFBvcGNvcm4='
      departmentName: string; // 'Crisps, Snacks, Nuts & Popcorn'
      superDepartmentId: string; // 'b;Rm9vZCUyMEN1cGJvYXJk'
      superDepartmentName: string; // 'Food Cupboard'
      substitutions: unknown[];
    };
    promotions: {
      promotionId: string; // '76811358'
      promotionType: unknown;
      startDate: string; // '2021-05-03T23:00:00Z'
      endDate: string; // '2021-05-26T23:00:00Z'
      offerText: string; // '£1.00 Clubcard Price'
      price: {
        beforeDiscount: unknown;
        afterDiscount: number; // 1.79
      };
      attributes: ('CLUBCARD_PRICING' | string)[]; // ["CLUBCARD_PRICING"]
    }[];
    promotionMessages: {};
    promotionRewards: {};
    itemLimitReached: boolean;
    groupLimitReached: boolean;
    groupBulkBuyQuantity: number; // 0
    originalQuantity: number; // 0
    originalProductWeight: number; // 0
    originalCatchWeight: number; // 0
    isNewlyAdded: boolean;
    isSubstitute: boolean;
    seedProduct: {};
    isWhyNotTry: boolean;
    customerUnitChoice: string; // 'pcs'
  }
}
