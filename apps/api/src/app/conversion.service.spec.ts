/// <reference types="jest-extended" />

import { Test, TestingModule } from '@nestjs/testing';
import { GRAM_UNITS, LITRE_UNITS, ManualConversion } from '@shoppi/api-interfaces';
import { CannotConvertError } from './cannot-convert.error';
import { ConversionService } from './conversion.service';

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
    it('should convert a unit to itself with identical unitAmounts (1kg -> 1kg)', () => {
      const pricePerUnit = 450;
      const from = { unit: 'kg', unitAmount: 1 };
      const to = { unit: 'kg', unitAmount: 1 };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(450);
    });

    it('should convert a unit to itself without a target unitAmount (10kg -> 1kg)', () => {
      const pricePerUnit = 450;
      const from = { unit: 'kg', unitAmount: 10 };
      const to = { unit: 'kg' };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(45);
    });

    it('should convert a unit to itself with non-standard target unitAmount (10kg -> 100kg)', () => {
      const pricePerUnit = 450;
      const from = { unit: 'kg', unitAmount: 10 };
      const to = { unit: 'kg', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to);

      expect(result).toBe(4500);
    });

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
      const conversions: ManualConversion[] = [
        [
          { name: 'ea', multiplier: 8 },
          { name: 'kg', multiplier: 2 },
        ],
      ];
      const to = { unit: 'kg', unitAmount: 7 };

      const result = service.convert(pricePerUnit, from, to, conversions);

      expect(result).toBe(5600);
    });

    it('should convert when there is a manual conversion and a from conversion is required (100ml -> [l/kg] -> 2kg)', () => {
      // £0.06/100ml [4l/5kg] = £0.60/l = £2.40/4l = £2.40/5kg = £0.48/kg = £0.96/2kg
      const pricePerUnit = 6;
      const from = { unit: 'ml', unitAmount: 100 };
      const conversions: ManualConversion[] = [
        [
          { name: 'l', multiplier: 4 },
          { name: 'kg', multiplier: 5 },
        ],
      ];
      const to = { unit: 'kg', unitAmount: 2 };

      const result = service.convert(pricePerUnit, from, to, conversions);

      expect(result).toBe(96);
    });

    it('should convert when there is a manual conversion and a to conversion is required (1l -> [l/kg] -> 100g)', () => {
      // £6/l [4l/5kg] = £24/4l = £24/5kg = £4.80/kg = £0.48/100g
      const pricePerUnit = 600;
      const from = { unit: 'l', unitAmount: 1 };
      const conversions: ManualConversion[] = [
        [
          { name: 'l', multiplier: 4 },
          { name: 'kg', multiplier: 5 },
        ],
      ];
      const to = { unit: 'g', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to, conversions);

      expect(result).toBe(48);
    });

    it('should convert when there is a manual conversion and a conversion is required on both steps (100ml -> [l/kg] -> 100g)', () => {
      // £0.60/100ml [4l/5kg] = £6/l = £24/4l = £24/5kg = £4.80/kg = £0.48/100g
      const pricePerUnit = 60;
      const from = { unit: 'ml', unitAmount: 100 };
      const conversions: ManualConversion[] = [
        [
          { name: 'l', multiplier: 4 },
          { name: 'kg', multiplier: 5 },
        ],
      ];
      const to = { unit: 'g', unitAmount: 100 };

      const result = service.convert(pricePerUnit, from, to, conversions);

      expect(result).toBe(48);
    });

    it('should convert when a series of manual conversions is required (100ml -> [l/kg] -> 100g -> [g/ea] -> [ea/sht] -> 10sht)', () => {
      // £0.60/100ml [4l/5kg] = £6/l = £24/4l = £24/5kg = £4.80/kg = £0.48/100g
      // (£0.48/100g) [10g/ea] = £0.48/10ea = £0.048/ea
      // (£0.048/ea) [100ea/4sht] = £4.80/4sht = £1.20/sht = £12/10sht
      const pricePerUnit = 60;
      const from = { unit: 'ml', unitAmount: 100 };
      const conversions: ManualConversion[] = [
        [
          { name: 'l', multiplier: 4 },
          { name: 'kg', multiplier: 5 },
        ],
        [
          { name: 'g', multiplier: 10 },
          { name: 'ea', multiplier: 1 },
        ],
        [
          { name: 'ea', multiplier: 100 },
          { name: 'sht', multiplier: 4 },
        ],
      ];
      const to = { unit: 'sht', unitAmount: 10 };

      const result = service.convert(pricePerUnit, from, to, conversions);

      expect(result).toBe(1200);
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
            { name: 'l', multiplier: 1 },
            { name: 'kg', multiplier: 2 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers([...GRAM_UNITS, ...LITRE_UNITS]);
    });

    it('should return all possible conversions if there are multiple manual conversions', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 2 },
            { name: 'crate', multiplier: 4 },
          ],
          [
            { name: 'box', multiplier: 2 },
            { name: 'carton', multiplier: 1 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'crate', 'carton']);
    });

    it('should return all reachable conversions if there are multiple separate manual conversions via an in-between step', () => {
      const result = service.getConvertableUnits(
        ['box'],
        [
          [
            { name: 'box', multiplier: 2 },
            { name: 'carton', multiplier: 1 },
          ],
          [
            { name: 'carton', multiplier: 2 },
            { name: 'bottle', multiplier: 7 },
          ],
        ]
      );

      expect(result).toIncludeSameMembers(['box', 'carton', 'bottle']);
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

  describe('canAddManualConversion()', () => {
    it('should return true if there are no manual conversions and the new conversion is between non-standard units', () => {
      const result = service.canAddManualConversion(
        [],
        [
          {
            name: 'box',
            multiplier: 1,
          },
          {
            name: 'crate',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeTrue();
    });

    it('should return true if there are no manual conversions and the new conversion is between a non-standard and a common unit', () => {
      const result = service.canAddManualConversion(
        [],
        [
          {
            name: 'box',
            multiplier: 1,
          },
          {
            name: 'kg',
            multiplier: 2,
          },
        ]
      );
      expect(result).toBeTrue();
    });

    it('should return true if there are no manual conversions and the new conversion is between distinct common units', () => {
      const result = service.canAddManualConversion(
        [],
        [
          {
            name: 'kg',
            multiplier: 1,
          },
          {
            name: 'ea',
            multiplier: 2,
          },
        ]
      );
      expect(result).toBeTrue();
    });

    it('should return true if existing manual conversions are for other units', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'box',
              multiplier: 1,
            },
            {
              name: 'l',
              multiplier: 4,
            },
          ],
        ],
        [
          {
            name: 'kg',
            multiplier: 1,
          },
          {
            name: 'ea',
            multiplier: 2,
          },
        ]
      );
      expect(result).toBeTrue();
    });

    it('should return true if existing manual conversions do not overlap with the new one', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'box',
              multiplier: 1,
            },
            {
              name: 'l',
              multiplier: 4,
            },
          ],
        ],
        [
          {
            name: 'l',
            multiplier: 1,
          },
          {
            name: 'kg',
            multiplier: 2,
          },
        ]
      );
      expect(result).toBeTrue();
    });

    it('should return false if the new conversion already exists as a common conversion', () => {
      const result = service.canAddManualConversion(
        [],
        [
          {
            name: 'kg',
            multiplier: 1,
          },
          {
            name: 'g',
            multiplier: 1000,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion would introduce a common conversion to itself via existing manual conversions', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'box',
            multiplier: 2,
          },
          {
            name: 'kg',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion would introduce a common conversion to itself via existing manual conversions and an internal common conversion', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'box',
            multiplier: 2,
          },
          {
            name: 'g',
            multiplier: 1000,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion would introduce a common conversion to itself via multiple steps', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
          [
            {
              name: 'box',
              multiplier: 1,
            },
            {
              name: 'l',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'g',
            multiplier: 2,
          },
          {
            name: 'ml',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion directly mirrors an existing manual conversion', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'box',
            multiplier: 2,
          },
          {
            name: 'kg',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion would introduce a manual conversion loop', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
          [
            {
              name: 'box',
              multiplier: 1,
            },
            {
              name: 'crate',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'crate',
            multiplier: 2,
          },
          {
            name: 'kg',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeFalse();
    });

    it('should return false if the new conversion would introduce a loop via common conversions', () => {
      const result = service.canAddManualConversion(
        [
          [
            {
              name: 'kg',
              multiplier: 1,
            },
            {
              name: 'box',
              multiplier: 2,
            },
          ],
          [
            {
              name: 'box',
              multiplier: 1,
            },
            {
              name: 'l',
              multiplier: 2,
            },
          ],
        ],
        [
          {
            name: 'ml',
            multiplier: 2,
          },
          {
            name: 'g',
            multiplier: 1,
          },
        ]
      );
      expect(result).toBeFalse();
    });
  });
});
