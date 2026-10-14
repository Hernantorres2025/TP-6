const { assertVisitDateAllowed } = require('../domain/visitDateRules');
const { priceForVisitor } = require('../domain/ticketPricing');
const { assertTicketCountAllowed } = require('../domain/ticketLimit');

const PAYMENT_METHODS = new Set(['cash', 'card']);

class TicketPurchaseError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TicketPurchaseError';
    this.code = code;
  }
}

function createTicketPurchaseService({ repository, paymentGateway, mailer, clock, createId, createTicketId }) {
  return async function purchaseTickets({ userId, email, visitDate, visitors, paymentMethod }) {
    if (!userId) throw new TicketPurchaseError('USER_REQUIRED', 'A visitor session is required.');
    if (!paymentMethod || !PAYMENT_METHODS.has(paymentMethod)) {
      throw new TicketPurchaseError('PAYMENT_METHOD_REQUIRED', 'Choose cash or card as the payment method.');
    }
    if (!Array.isArray(visitors) || visitors.length === 0) {
      throw new TicketPurchaseError('VISITORS_REQUIRED', 'Add at least one visitor.');
    }

    const purchaseTime = clock();
    assertVisitDateAllowed({ visitDate, now: purchaseTime });

    const previousCount = await repository.countTicketsForUserAndDate({ userId, visitDate });
    assertTicketCountAllowed({ previousCount, newCount: visitors.length });

    let tickets;
    try {
      tickets = visitors.map(({ age, passType }) => ({
        id: createTicketId(),
        age,
        passType,
        price: priceForVisitor({ age, passType }),
      }));
    } catch (error) {
      throw new TicketPurchaseError('INVALID_VISITOR', error.message);
    }

    const total = tickets.reduce((sum, ticket) => sum + ticket.price, 0);
    const purchase = {
      id: createId(),
      userId,
      email,
      visitDate,
      paymentMethod,
      status: 'pending',
      total,
      tickets,
      createdAt: purchaseTime.toISOString(),
    };

    await repository.savePurchaseWithinLimit(purchase);

    if (paymentMethod === 'card') {
      try {
        const transaction = await paymentGateway.charge({
          purchaseId: purchase.id,
          userId,
          amount: total,
        });
        purchase.status = transaction.approved ? 'confirmed' : 'cancelled';
        purchase.paymentReference = transaction.reference || null;
      } catch (_error) {
        purchase.status = 'cancelled';
      }
      await repository.updatePurchaseStatus(purchase.id, purchase.status, purchase.paymentReference);
    }

    if (purchase.status !== 'cancelled') {
      const attachment = Buffer.from(JSON.stringify({
        purchaseId: purchase.id,
        visitDate: purchase.visitDate,
        ticketCount: tickets.length,
        total,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status,
        tickets: tickets.map(({ age, passType, price }) => ({ age, passType, price })),
      }, null, 2));
      try {
        await mailer.send({
          to: email,
          purchaseId: purchase.id,
          visitDate,
          ticketCount: tickets.length,
          total,
          status: purchase.status,
          attachment: {
            filename: `eco-harmony-${purchase.id}.json`,
            contentType: 'application/json',
            content: attachment,
          },
        });
      } catch (_error) {
        // A delivery failure must not change the persisted purchase status.
      }
    }

    return purchase;
  };
}

module.exports = { createTicketPurchaseService, TicketPurchaseError };
