const { priceForVisitor } = require('../../src/domain/ticketPricing');

describe('priceForVisitor', () => {
  test.each([
    [3, 'common', 0],
    [4, 'common', 5000],
    [15, 'common', 5000],
    [16, 'common', 10000],
    [59, 'common', 10000],
    [60, 'common', 5000],
    [3, 'vip', 0],
    [4, 'vip', 10000],
    [16, 'vip', 20000],
    [60, 'vip', 10000],
  ])('prices age %i %s pass at $%i', (age, passType, expectedPrice) => {
    expect(priceForVisitor({ age, passType })).toBe(expectedPrice);
  });
});
