const { assertVisitDateAllowed } = require('../../src/domain/visitDateRules');

const now = (value) => new Date(value);

describe('assertVisitDateAllowed', () => {
  test.each([
    ['today before cutoff', '2026-10-14T20:29:00.000Z', '2026-10-14'],
    ['today at cutoff', '2026-10-14T20:30:00.000Z', '2026-10-14'],
    ['the one-month limit', '2026-10-14T15:00:00.000Z', '2026-11-14'],
    ['the clamped one-month limit after a long month', '2026-01-31T15:00:00.000Z', '2026-02-28'],
  ])('accepts %s', (_case, clockValue, visitDate) => {
    expect(() => assertVisitDateAllowed({ visitDate, now: now(clockValue) })).not.toThrow();
  });

  test.each([
    ['a past date', '2026-10-14T15:00:00.000Z', '2026-10-13', 'VISIT_DATE_IN_PAST'],
    ['a date beyond one month', '2026-10-14T15:00:00.000Z', '2026-11-15', 'VISIT_DATE_TOO_FAR'],
    ['today after the cutoff', '2026-10-14T20:31:00.000Z', '2026-10-14', 'SAME_DAY_SALES_CLOSED'],
    ['a closed day', '2026-10-14T15:00:00.000Z', '2026-10-19', 'PARK_CLOSED'],
    ['a date beyond the clamped limit', '2026-01-31T15:00:00.000Z', '2026-03-01', 'VISIT_DATE_TOO_FAR'],
  ])('rejects %s', (_case, clockValue, visitDate, code) => {
    expect(() => assertVisitDateAllowed({ visitDate, now: now(clockValue) })).toThrow(
      expect.objectContaining({ code }),
    );
  });
});
