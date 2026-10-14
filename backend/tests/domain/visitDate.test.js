const { isParkOpenOn } = require('../../src/domain/visitDate');

describe('isParkOpenOn', () => {
  test('accepts a weekday that is not a holiday', () => {
    expect(isParkOpenOn('2026-10-14')).toBe(true);
  });

  test.each([
    ['Monday', '2026-10-12'],
    ['Christmas Day', '2026-12-25'],
    ['New Year’s Day', '2027-01-01'],
  ])('closes the park on %s', (_reason, date) => {
    expect(isParkOpenOn(date)).toBe(false);
  });
});
