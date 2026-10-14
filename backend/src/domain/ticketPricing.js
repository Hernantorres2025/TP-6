const BASE_PRICES = Object.freeze({
  common: 10000,
  vip: 20000,
});

function priceForVisitor({ age, passType }) {
  const basePrice = BASE_PRICES[passType];
  if (!Number.isInteger(age) || age < 0 || basePrice === undefined) {
    throw new TypeError('A valid non-negative age and pass type are required.');
  }

  if (age <= 3) return 0;
  if ((age >= 4 && age <= 15) || age >= 60) return basePrice / 2;
  return basePrice;
}

module.exports = { priceForVisitor };
