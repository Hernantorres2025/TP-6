const CLOSED_DATES = new Set(['12-25', '01-01']);

function isParkOpenOn(isoDate) {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return false;
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    return false;
  }

  const monthAndDay = isoDate.slice(5);
  return date.getUTCDay() !== 1 && !CLOSED_DATES.has(monthAndDay);
}

module.exports = { isParkOpenOn };
