const { createDb } = require('../../src/db');
const { createPurchaseRepository } = require('../../src/repositories/purchaseRepository');

const purchase = (overrides = {}) => ({
  id: 'purchase-1',
  userId: 1,
  email: 'visitante@ecoharmony.com',
  visitDate: '2026-10-14',
  paymentMethod: 'cash',
  status: 'pending',
  total: 10000,
  createdAt: '2026-10-14T15:00:00.000Z',
  tickets: [{ id: 'ticket-1', age: 30, passType: 'common', price: 10000 }],
  ...overrides,
});

describe('purchase repository', () => {
  let db;
  let repository;

  beforeEach(() => {
    db = createDb(':memory:');
    repository = createPurchaseRepository(db);
  });

  afterEach(() => db.close());

  test('persists a purchase and counts its tickets by visitor and visit date', () => {
    repository.savePurchase(purchase());

    expect(repository.countTicketsForUserAndDate({ userId: 1, visitDate: '2026-10-14' })).toBe(1);
    expect(repository.findPurchaseById('purchase-1').tickets[0]).toMatchObject({ age: 30, passType: 'common' });
  });

  test('does not count cancelled purchases against the date limit', () => {
    repository.savePurchase(purchase({ status: 'cancelled' }));

    expect(repository.countTicketsForUserAndDate({ userId: 1, visitDate: '2026-10-14' })).toBe(0);
  });

  test('writes the purchase and its tickets atomically', () => {
    expect(() => repository.savePurchase(purchase({
      tickets: [
        { id: 'duplicate', age: 30, passType: 'common', price: 10000 },
        { id: 'duplicate', age: 31, passType: 'vip', price: 20000 },
      ],
    }))).toThrow();

    expect(repository.findPurchaseById('purchase-1')).toBeNull();
  });
});
