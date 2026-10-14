const express = require('express');

const TEST_USER = Object.freeze({ id: 1, email: 'visitante@ecoharmony.com', name: 'Visitante de prueba' });
const TICKET_TYPES = Object.freeze([
  { id: 'common', name: 'Pase común', price: 10000 },
  { id: 'vip', name: 'Pase VIP', price: 20000 },
]);

function createApp({ purchaseTickets, quoteTickets }) {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/api/me', (_request, response) => response.json(TEST_USER));
  app.get('/api/ticket-types', (_request, response) => response.json(TICKET_TYPES));

  app.post('/api/quote', (request, response, next) => {
    try {
      response.json(quoteTickets(request.body));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/purchases', async (request, response, next) => {
    try {
      const purchase = await purchaseTickets({
        ...request.body,
        userId: TEST_USER.id,
        email: TEST_USER.email,
      });
      const httpStatus = purchase.status === 'cancelled' ? 402 : 201;
      response.status(httpStatus).json({
        id: purchase.id,
        visitDate: purchase.visitDate,
        paymentMethod: purchase.paymentMethod,
        status: purchase.status,
        ticketCount: purchase.tickets.length,
        total: purchase.total,
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _request, response, _next) => {
    const status = error.code === 'TICKET_LIMIT_EXCEEDED' ? 409 : 400;
    response.status(status).json({ error: { code: error.code || 'INVALID_REQUEST', message: error.message } });
  });

  return app;
}

module.exports = { createApp, TEST_USER, TICKET_TYPES };
