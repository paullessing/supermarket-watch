export interface SpecialOffer {
  offerText: string;
  originalPrice: null | number;
  validUntil: string;
}

export function compareSpecialOffers(
  a: SpecialOffer | null,
  b: SpecialOffer | null
): boolean {
  if ((a ?? b) === null) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  return (
    a.offerText === b.offerText &&
    a.originalPrice === b.originalPrice &&
    a.validUntil === b.validUntil
  );
}
