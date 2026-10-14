const { createDb } = require('../../src/db');
const { createPurchaseRepository } = require('../../src/repositories/purchaseRepository');
const { createTicketPurchaseService } = require('../../src/services/ticketPurchaseService');

test('enforces the cumulative per-date limit with persisted purchases', async () => {
  const db = createDb(':memory:');
  const repository = createPurchaseRepository(db);
  let nextId = 0;
  const service = createTicketPurchaseService({
    repository,
    paymentGateway: { charge: async () => ({ approved: true }) },
    mailer: { send: async () => {} },
    clock: () => new Date('2026-10-14T15:00:00.000Z'),
    createId: () => `purchase-${++nextId}`,
    createTicketId: (() => {
      let nextTicketId = 0;
      return () => `ticket-${++nextTicketId}`;
    })(),
  });

  const base = { userId: 1, email: 'visitor@example.com', visitDate: '2026-10-14', paymentMethod: 'cash' };
  try {
    await service({ ...base, visitors: Array.from({ length: 8 }, () => ({ age: 30, passType: 'common' })) });
    await service({ ...base, visitors: Array.from({ length: 2 }, () => ({ age: 30, passType: 'vip' })) });

    await expect(service({ ...base, visitors: [{ age: 30, passType: 'common' }] }))
      .rejects.toMatchObject({ code: 'TICKET_LIMIT_EXCEEDED' });

    expect(repository.countTicketsForUserAndDate({ userId: 1, visitDate: '2026-10-14' })).toBe(10);
  } finally {
    db.close();
  }
});
