import {
  toPaise,
  toRupees,
  formatPaiseToINR,
  distributeIntegerPaise,
} from '../src/utils/money.js';

describe('Financial Math & Integer-Paise Precision Utilities', () => {
  describe('toPaise()', () => {
    test('converts whole rupee numbers to integer paise', () => {
      expect(toPaise(100)).toBe(10000);
      expect(toPaise(500000)).toBe(50000000);
      expect(toPaise(0)).toBe(0);
    });

    test('converts decimal rupee string to integer paise without IEEE 754 float drift', () => {
      expect(toPaise('19.99')).toBe(1999);
      expect(toPaise('25000.50')).toBe(2500050);
      expect(toPaise('0.05')).toBe(5);
    });

    test('throws TypeError on non-finite, null, or undefined values', () => {
      expect(() => toPaise(null)).toThrow(TypeError);
      expect(() => toPaise(undefined)).toThrow(TypeError);
      expect(() => toPaise('abc')).toThrow(TypeError);
      expect(() => toPaise(NaN)).toThrow(TypeError);
    });

    test('throws RangeError on negative values unless explicitly allowed', () => {
      expect(() => toPaise(-50)).toThrow(RangeError);
      expect(toPaise(-50, true)).toBe(-5000);
    });
  });

  describe('toRupees()', () => {
    test('converts integer paise to exact 2-decimal rupee string', () => {
      expect(toRupees(10000)).toBe('100.00');
      expect(toRupees(1999)).toBe('19.99');
      expect(toRupees(5)).toBe('0.05');
      expect(toRupees(0)).toBe('0.00');
    });

    test('throws on invalid or non-integer paise', () => {
      expect(() => toRupees(null)).toThrow(TypeError);
      expect(() => toRupees(10.5)).toThrow(TypeError);
    });
  });

  describe('formatPaiseToINR()', () => {
    test('formats paise to Indian Rupee currency standard', () => {
      const formatted = formatPaiseToINR(50000000);
      // Checks Indian numbering grouping (₹5,00,000.00)
      expect(formatted).toContain('5,00,000.00');
    });
  });

  describe('distributeIntegerPaise()', () => {
    test('distributes exact divisible pool equally', () => {
      const result = distributeIntegerPaise(10000, 4);
      expect(result.baseSharePaise).toBe(2500);
      expect(result.remainderPaise).toBe(0);
      expect(result.shares).toEqual([2500, 2500, 2500, 2500]);
    });

    test('allocates odd remainder paise strictly to the last subscriber (zero money creation/loss)', () => {
      // 100 paise divided among 3 people: 33, 33, 34
      const result = distributeIntegerPaise(100, 3);
      expect(result.baseSharePaise).toBe(33);
      expect(result.remainderPaise).toBe(1);
      expect(result.shares).toEqual([33, 33, 34]);

      // Sum of shares must strictly equal total pool
      const sum = result.shares.reduce((acc, v) => acc + v, 0);
      expect(sum).toBe(100);
    });

    test('handles large pool distribution accurately', () => {
      // 20 subscribers dividing ₹23,750.37 (2,375,037 paise)
      const result = distributeIntegerPaise(2375037, 20);
      expect(result.baseSharePaise).toBe(118751);
      expect(result.remainderPaise).toBe(17);
      expect(result.shares.length).toBe(20);
      expect(result.shares[19]).toBe(118751 + 17);

      const sum = result.shares.reduce((acc, v) => acc + v, 0);
      expect(sum).toBe(2375037);
    });

    test('throws RangeError on invalid count or negative total', () => {
      expect(() => distributeIntegerPaise(-100, 5)).toThrow(RangeError);
      expect(() => distributeIntegerPaise(100, 0)).toThrow(RangeError);
      expect(() => distributeIntegerPaise(100, -2)).toThrow(RangeError);
    });
  });
});
