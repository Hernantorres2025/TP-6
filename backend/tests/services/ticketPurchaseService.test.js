const { createTicketPurchaseService } = require('../../src/services/ticketPurchaseService');

function createDependencies({ previousTickets = 0, cardApproved = true, mailFails = false } = {}) {
  const savedPurchases = [];
  const repository = {
    countTicketsForUserAndDate: jest.fn(async () => previousTickets),
    savePurchaseWithinLimit: jest.fn(async (purchase) => savedPurchases.push(purchase)),
    updatePurchaseStatus: jest.fn(async (id, status, paymentReference) => {
      const purchase = savedPurchases.find((item) => item.id === id);
      purchase.status = status;
      purchase.paymentReference = paymentReference;
    }),
  };
  const paymentGateway = {
    charge: jest.fn(async () => ({ approved: cardApproved, reference: 'payment-123' })),
  };
  const mailer = {
    send: jest.fn(async () => {
      if (mailFails) throw new Error('mail unavailable');
    }),
  };
  const service = createTicketPurchaseService({
    repository,
    paymentGateway,
    mailer,
    clock: () => new Date('2026-10-14T15:00:00.000Z'),
    createId: () => 'purchase-123',
    createTicketId: (() => {
      let nextId = 0;
      return () => `ticket-${++nextId}`;
    })(),
  });
  return { service, repository, paymentGateway, mailer, savedPurchases };
}

const request = (overrides = {}) => ({
  userId: 1,
  email: 'visitante@ecoharmony.com',
  visitDate: '2026-10-14',
  visitors: [{ age: 30, passType: 'common' }],
  paymentMethod: 'cash',
  ...overrides,
});

describe('ticket purchase service', () => {
  test('keeps cash purchases pending and emails transaction details with an attachment', async () => {
    const { service, paymentGateway, mailer } = createDependencies();

    const purchase = await service(request());

    expect(purchase.status).toBe('pending');
    expect(purchase.total).toBe(10000);
    expect(paymentGateway.charge).not.toHaveBeenCalled();
    expect(mailer.send).toHaveBeenCalledWith(expect.objectContaining({
      purchaseId: 'purchase-123',
      total: 10000,
      attachment: expect.anything(),
    }));
  });

  test('confirms an approved card payment', async () => {
    const { service, paymentGateway, mailer } = createDependencies();

    const purchase = await service(request({ paymentMethod: 'card', visitors: [
      { age: 30, passType: 'common' },
      { age: 4, passType: 'vip' },
    ] }));

    expect(purchase.status).toBe('confirmed');
    expect(purchase.total).toBe(20000);
    expect(paymentGateway.charge).toHaveBeenCalledWith(expect.objectContaining({ amount: 20000 }));
    expect(mailer.send).toHaveBeenCalledTimes(1);
  });

  test('records a rejected card transaction as cancelled without sending mail', async () => {
    const { service, paymentGateway, mailer, savedPurchases } = createDependencies({ cardApproved: false });

    const purchase = await service(request({ paymentMethod: 'card' }));

    expect(purchase.status).toBe('cancelled');
    expect(paymentGateway.charge).toHaveBeenCalledTimes(1);
    expect(savedPurchases[0].status).toBe('cancelled');
    expect(mailer.send).not.toHaveBeenCalled();
  });

  test('keeps an approved purchase confirmed if email delivery fails', async () => {
    const { service, mailer, savedPurchases } = createDependencies({ mailFails: true });

    const purchase = await service(request({ paymentMethod: 'card' }));

    expect(purchase.status).toBe('confirmed');
    expect(savedPurchases[0].status).toBe('confirmed');
    expect(mailer.send).toHaveBeenCalledTimes(1);
  });

  test('applies the 10-ticket limit across purchases for one user and date', async () => {
    const { service, repository } = createDependencies({ previousTickets: 8 });

    await expect(service(request({ visitors: [
      { age: 30, passType: 'common' },
      { age: 40, passType: 'vip' },
      { age: 50, passType: 'vip' },
    ] }))).rejects.toMatchObject({ code: 'TICKET_LIMIT_EXCEEDED' });

    expect(repository.savePurchaseWithinLimit).not.toHaveBeenCalled();
  });
});
