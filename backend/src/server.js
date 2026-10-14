const { randomUUID } = require('node:crypto');
const { createApp } = require('./app');
const { createConsoleMailer } = require('./adapters/mailer');
const { createFakePaymentGateway } = require('./adapters/paymentGateway');
const { createDb } = require('./db');
const { createPurchaseRepository } = require('./repositories/purchaseRepository');
const { createTicketPurchaseService } = require('./services/ticketPurchaseService');
const { createTicketQuoteService } = require('./services/ticketQuoteService');

function buildApp() {
  const db = createDb();
  const repository = createPurchaseRepository(db);
  const clock = () => new Date();
  const purchaseTickets = createTicketPurchaseService({
    repository,
    paymentGateway: createFakePaymentGateway(),
    mailer: createConsoleMailer(),
    clock,
    createId: randomUUID,
    createTicketId: randomUUID,
  });
  const quoteTickets = createTicketQuoteService({ clock });
  return { app: createApp({ purchaseTickets, quoteTickets }), db };
}

if (require.main === module) {
  const { app, db } = buildApp();
  const port = Number(process.env.PORT || 3001);
  app.listen(port, () => console.info(`EcoHarmony API listening on http://localhost:${port}`));
  process.on('SIGINT', () => { db.close(); process.exit(0); });
}

module.exports = { buildApp };
