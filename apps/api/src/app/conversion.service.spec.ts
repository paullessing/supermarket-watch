/// <reference types="jest-extended" />

import { Test, TestingModule } from '@nestjs/testing';
import { EACH_UNITS, GRAM_UNITS } from '@shoppi/api-interfaces';
import { CannotConvertError } from './cannot-convert.error';
import { Conversion, ConversionService } from './conversion.service';

describe('ConversionService', () => {
  let service: ConversionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConversionService],
    }).compile();

    service = module.get<ConversionService>(ConversionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('convert()', () => {
    it('should convert between known units (1l -> 1ml)', () => {
      // £50.00/l = £0.05/ml
      // £50.00/l = £0.05/ml
      const pricePerUnit = 5000;
      const from = { unit: 'l', unitAmount: 1 };
      const to = { unit: 'ml' };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(5);
    });

    it('should convert between known units with non-default target amount (1l -> 100ml)', () => {
      // £2/l = £0.20/100ml
      const pricePerUnit = 200;
      const from = { unit: 'l', unitAmount: 1 };
      const to = { unit: 'ml', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(20);
    });

    it('should convert between known units with non-default source amount (100g -> 1kg)', () => {
      // £2/100g = £20/kg
      const pricePerUnit = 200;
      const from = { unit: 'g', unitAmount: 100 };
      const to = { unit: 'kg', unitAmount: 1 };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(2000);
    });

    it('should convert when there is a direct manual conversion (3ea -> [ea/kg] -> 7kg)', () => {
      // £6/3ea [8ea/2kg] = £2/ea = £16/2kg = £8/kg = £56/7kg
      const pricePerUnit = 600;
      const from = { unit: 'ea', unitAmount: 3 };
      const conversion: Conversion = [
        { name: 'ea', multiplier: 8 },
        { name: 'kg', multiplier: 2 },
      ];
      const to = { unit: 'kg', unitAmount: 7 };

      const result = service.convert(pricePerUnit, from, to, conversion);

      expect(result).toBe(5600);
    });

    it('should convert when there is a manual conversion and a from conversion is required (100ml -> [l/kg] -> 2kg)', () => {
      // £0.06/100ml [4l/5kg] = £0.60/l = £2.40/4l = £2.40/5kg = £0.48/kg = £0.96/2kg
      const pricePerUnit = 6;
      const from = { unit: 'ml', unitAmount: 100 };
      const conversion: Conversion = [
        { name: 'l', multiplier: 4 },
        { name: 'kg', multiplier: 5 },
      ];
      const to = { unit: 'kg', unitAmount: 2 };

      const result = service.convert(pricePerUnit, from, to, conversion);

      expect(result).toBe(96);
    });

    it('should convert when there is a manual conversion and a to conversion is required (1l -> [l/kg] -> 100g)', () => {
      // £6/l [4l/5kg] = £24/4l = £24/5kg = £4.80/kg = £0.48/100g
      const pricePerUnit = 600;
      const from = { unit: 'l', unitAmount: 1 };
      const conversion: Conversion = [
        { name: 'l', multiplier: 4 },
        { name: 'kg', multiplier: 5 },
      ];
      const to = { unit: 'g', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to, conversion);

      expect(result).toBe(48);
    });

    it('should convert when there is a manual conversion and a conversion is required on both steps (100ml -> [l/kg] -> 100g)', () => {
      // £0.60/100ml [4l/5kg] = £6/l = £24/4l = £24/5kg = £4.80/kg = £0.48/100g
      const pricePerUnit = 60;
      const from = { unit: 'ml', unitAmount: 100 };
      const conversion: Conversion = [
        { name: 'l', multiplier: 4 },
        { name: 'kg', multiplier: 5 },
      ];
      const to = { unit: 'g', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to, conversion);

      expect(result).toBe(48);
    });
  });

  describe('getConvertableUnits()', () => {
    it('should use common convertable units when the unit is common and there is no manual conversion', () => {
      const result = service.getConvertableUnits(['kg']);

      expect(result).toIncludeSameMembers(GRAM_UNITS);
    });

    it('should return just the unit when there is a single unit and no valid conversion', () => {
      const result = service.getConvertableUnits(['box'], []);

      expect(result).toIncludeSameMembers(['box']);
    });

    it('should return the known conversion when there is a manual conversion, but neither unit is common', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 1 },
            { name: 'crate', multiplier: 2 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'crate']);
    });

    it('should return the known conversion and all common conversions when there is a manual conversion from an unknown conversion to a common one', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 1 },
            { name: 'kg', multiplier: 2 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', ...GRAM_UNITS]);
    });

    it('should return the known conversion and all common conversions when there is a manual conversion from a common conversion to an unknown one', () => {
      const result = service.getConvertableUnits(
        ['kg'],
        [
          [
            { name: 'box', multiplier: 1 },
            { name: 'kg', multiplier: 2 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', ...GRAM_UNITS]);
    });

    it('should return all common conversions when there is a manual conversion between two common conversions', () => {
      const result = service.getConvertableUnits(
        ['kg'],
        [
          [
            { name: 'ea', multiplier: 1 },
            { name: 'kg', multiplier: 2 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers([...GRAM_UNITS, ...EACH_UNITS]);
    });

    it('should return all possible conversions if there are multiple manual conversions', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 2 },
            { name: 'crate', multiplier: 4 },
            { name: 'carton', multiplier: 1 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'crate', 'carton']);
    });

    it('should return all reachable conversions if there are multiple separate manual direct conversions', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 2 },
            { name: 'crate', multiplier: 4 },
            { name: 'carton', multiplier: 1 },
          ],
          [
            { name: 'box', multiplier: 2 },
            { name: 'bottle', multiplier: 7 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'crate', 'carton', 'bottle']);
    });

    it('should return all reachable conversions if there are multiple separate manual conversions via an in-between step', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 2 },
            { name: 'crate', multiplier: 4 },
            { name: 'carton', multiplier: 1 },
          ],
          [
            { name: 'carton', multiplier: 2 },
            { name: 'bottle', multiplier: 7 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'crate', 'carton', 'bottle']);
    });

    it('should not return unreachable manual conversions', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'dog', multiplier: 2 },
            { name: 'cow', multiplier: 4 },
          ],
          [
            { name: 'bottle', multiplier: 2 },
            { name: 'litres', multiplier: 4 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box']);
    });

    it('should throw if an input unit cannot be converted to another input unit', () => {
      expect(() => {
        service.getConvertableUnits(['box', 'l']);
      }).toThrowError(new CannotConvertError('box', 'l'));
    });

    it('should throw if an input unit cannot be converted to another input unit, even if the first one has conversions', () => {
      expect(() => {
        service.getConvertableUnits(['l', 'box']);
      }).toThrowError(new CannotConvertError('l', 'box'));
    });

    it('should throw if an input unit cannot be converted to another input unit, even if they both have conversions', () => {
      expect(() => {
        service.getConvertableUnits(['l', 'kg']);
      }).toThrowError(new CannotConvertError('l', 'kg'));
    });

    it('should throw if an input unit cannot be converted to another input unit even using manual conversions', () => {
      expect(() => {
        service.getConvertableUnits(
          ['box', 'l'],
          [
            [
              { name: 'box', multiplier: 2 },
              { name: 'kg', multiplier: 4 },
            ],
          ]
        );
      }).toThrowError(new CannotConvertError('box', 'l'));
    });
  });

  describe('areManualConversionsCircular()', () => {
    it('should return false if there are no conversions', () => {
      const result = service.areManualConversionsCircular([]);
      expect(result).toBeFalse();
    });

    it('should return false there is just one manual conversion', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'box', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
      ]);
      expect(result).toBeFalse();
    });

    it('should return false there are two non-overlapping manual conversions', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'box', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'box', multiplier: 2 },
          { name: 'carton', multiplier: 4 },
        ],
      ]);
      expect(result).toBeFalse();
    });

    it('should return false there are two manual conversions that depend on each other', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'box', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'box', multiplier: 2 },
          { name: 'carton', multiplier: 4 },
        ],
      ]);
      expect(result).toBeFalse();
    });

    it('should return false there are two manual conversions converting to and from common units', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'crate', multiplier: 2 },
          { name: 'kg', multiplier: 4 },
        ],
      ]);
      expect(result).toBeFalse();
    });

    it('should return true if a conversion is to and from itself', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'l', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular via an intermediate custom unit', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'crate', multiplier: 2 },
          { name: 'l', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular via common units', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'kg', multiplier: 4 },
        ],
        [
          { name: 'kg', multiplier: 2 },
          { name: 'l', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular across more than one intermediate unit', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'crate', multiplier: 2 },
          { name: 'box', multiplier: 4 },
        ],
        [
          { name: 'crate', multiplier: 2 },
          { name: 'kg', multiplier: 4 },
        ],
        [
          { name: 'kg', multiplier: 2 },
          { name: 'l', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular by providing a conversion from a common unit to a synonym', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'litres', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular by providing synonyms across multiple common conversions', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'l', multiplier: 2 },
          { name: 'kg', multiplier: 4 },
        ],
        [
          { name: 'mgs', multiplier: 2 },
          { name: 'ml', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });

    it('should return true if a conversion is circular across manual conversions only', () => {
      const result = service.areManualConversionsCircular([
        [
          { name: 'box', multiplier: 2 },
          { name: 'crate', multiplier: 4 },
        ],
        [
          { name: 'crate', multiplier: 2 },
          { name: 'box', multiplier: 4 },
        ],
      ]);
      expect(result).toBeTrue();
    });
  });
});
