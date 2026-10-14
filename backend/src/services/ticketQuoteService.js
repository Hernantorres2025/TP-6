const { assertVisitDateAllowed } = require('../domain/visitDateRules');
const { priceForVisitor } = require('../domain/ticketPricing');
const { TicketPurchaseError } = require('./ticketPurchaseService');

function createTicketQuoteService({ clock }) {
  return function quoteTickets({ visitDate, visitors }) {
    assertVisitDateAllowed({ visitDate, now: clock() });
    if (!Array.isArray(visitors) || visitors.length === 0) {
      throw new TicketPurchaseError('VISITORS_REQUIRED', 'Add at least one visitor.');
    }
    if (visitors.length > 10) {
      throw new TicketPurchaseError('TICKET_LIMIT_EXCEEDED', 'A purchase cannot contain more than 10 tickets.');
    }

    const tickets = visitors.map(({ age, passType }) => ({
      age,
      passType,
      price: priceForVisitor({ age, passType }),
    }));
    return {
      visitDate,
      ticketCount: tickets.length,
      total: tickets.reduce((sum, ticket) => sum + ticket.price, 0),
      tickets,
    };
  };
}

module.exports = { createTicketQuoteService };
