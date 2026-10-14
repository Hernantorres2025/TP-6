const { isParkOpenOn } = require('./visitDate');

const TIME_ZONE = 'America/Argentina/Buenos_Aires';

class VisitDateError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'VisitDateError';
    this.code = code;
  }
}

function dateInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function isValidIsoDate(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

function addOneCalendarMonth(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const lastDayOfNextMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const clampedDay = Math.min(day, lastDayOfNextMonth);
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

function assertVisitDateAllowed({ visitDate, now, timeZone = TIME_ZONE }) {
  if (!isValidIsoDate(visitDate)) {
    throw new VisitDateError('INVALID_VISIT_DATE', 'Visit date must be a valid YYYY-MM-DD date.');
  }

  if (!isParkOpenOn(visitDate)) {
    throw new VisitDateError('PARK_CLOSED', 'The park is closed on the selected date.');
  }

  const localNow = dateInTimeZone(now, timeZone);
  const today = `${localNow.year}-${localNow.month}-${localNow.day}`;
  if (visitDate < today) {
    throw new VisitDateError('VISIT_DATE_IN_PAST', 'Visit date cannot be in the past.');
  }

  if (visitDate > addOneCalendarMonth(today)) {
    throw new VisitDateError('VISIT_DATE_TOO_FAR', 'Visit date cannot be more than one month away.');
  }

  if (visitDate === today) {
    const minutesNow = Number(localNow.hour) * 60 + Number(localNow.minute);
    if (minutesNow > 17 * 60 + 30) {
      throw new VisitDateError('SAME_DAY_SALES_CLOSED', 'Same-day tickets are sold until 17:30.');
    }
  }
}

module.exports = { assertVisitDateAllowed, VisitDateError };
