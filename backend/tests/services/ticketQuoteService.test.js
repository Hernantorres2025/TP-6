const { createTicketQuoteService } = require('../../src/services/ticketQuoteService');

describe('ticket quote service', () => {
  const service = createTicketQuoteService({ clock: () => new Date('2026-10-14T15:00:00.000Z') });

  test('returns the server-calculated total for the selected visitors', () => {
    expect(service({ visitDate: '2026-10-14', visitors: [
      { age: 3, passType: 'vip' },
      { age: 4, passType: 'common' },
      { age: 30, passType: 'vip' },
    ] })).toMatchObject({ ticketCount: 3, total: 25000 });
  });

  test('rejects a quote for a date when the park is closed', () => {
    expect(() => service({ visitDate: '2026-10-19', visitors: [{ age: 30, passType: 'common' }] }))
      .toThrow(expect.objectContaining({ code: 'PARK_CLOSED' }));
  });
});

