import { Test, TestingModule } from '@nestjs/testing';
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

  it('should convert between known units (1l -> 1ml)', () => {
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
