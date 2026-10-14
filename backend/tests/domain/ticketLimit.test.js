const { assertTicketCountAllowed } = require('../../src/domain/ticketLimit');

describe('assertTicketCountAllowed', () => {
  test.each([[0, 9], [0, 10], [8, 2]])('allows %i previous tickets and %i new tickets', (previousCount, newCount) => {
    expect(() => assertTicketCountAllowed({ previousCount, newCount })).not.toThrow();
  });

  test.each([[0, 11], [8, 3], [10, 1]])('rejects %i previous tickets and %i new tickets', (previousCount, newCount) => {
    expect(() => assertTicketCountAllowed({ previousCount, newCount })).toThrow(
      expect.objectContaining({ code: 'TICKET_LIMIT_EXCEEDED' }),
    );
  });
});
