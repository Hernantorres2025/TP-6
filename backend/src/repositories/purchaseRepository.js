const { MAX_TICKETS_PER_USER_AND_DATE, TicketLimitError } = require('../domain/ticketLimit');

function createPurchaseRepository(db) {
  const countTickets = db.prepare(`
    SELECT COUNT(T.id) AS count
    FROM Tickets T
    INNER JOIN Compras C ON C.id = T.compra_id
    WHERE C.usuario_id = ? AND C.fecha_visita = ? AND C.estado != 'cancelled'
  `);
  const insertPurchase = db.prepare(`
    INSERT INTO Compras (id, usuario_id, email, fecha_visita, metodo_pago, estado, monto_total, referencia_pago, creado_en)
    VALUES (@id, @userId, @email, @visitDate, @paymentMethod, @status, @total, @paymentReference, @createdAt)
  `);
  const insertTicket = db.prepare(`
    INSERT INTO Tickets (id, compra_id, edad_visitante, tipo_pase, precio)
    VALUES (@id, @purchaseId, @age, @passType, @price)
  `);

  function insertPurchaseAndTickets(purchase) {
    insertPurchase.run({
      id: purchase.id,
      userId: purchase.userId,
      email: purchase.email,
      visitDate: purchase.visitDate,
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      total: purchase.total,
      paymentReference: purchase.paymentReference || null,
      createdAt: purchase.createdAt,
    });
    for (const ticket of purchase.tickets) {
      insertTicket.run({ ...ticket, purchaseId: purchase.id });
    }
  }

  const insertPurchaseAndTicketsTransaction = db.transaction(insertPurchaseAndTickets);
  const insertWithinLimit = db.transaction((purchase) => {
    const previousCount = countTickets.get(purchase.userId, purchase.visitDate).count;
    if (previousCount + purchase.tickets.length > MAX_TICKETS_PER_USER_AND_DATE) {
      throw new TicketLimitError();
    }
    insertPurchaseAndTickets(purchase);
  }).immediate;

  return {
    countTicketsForUserAndDate({ userId, visitDate }) {
      return countTickets.get(userId, visitDate).count;
    },

    savePurchase(purchase) {
      insertPurchaseAndTicketsTransaction(purchase);
      return purchase;
    },

    savePurchaseWithinLimit(purchase) {
      insertWithinLimit(purchase);
      return purchase;
    },

    updatePurchaseStatus(id, status, paymentReference = null) {
      db.prepare('UPDATE Compras SET estado = ?, referencia_pago = ? WHERE id = ?')
        .run(status, paymentReference, id);
    },

    findPurchaseById(id) {
      const row = db.prepare('SELECT * FROM Compras WHERE id = ?').get(id);
      if (!row) return null;
      const tickets = db.prepare('SELECT * FROM Tickets WHERE compra_id = ? ORDER BY rowid').all(id)
        .map((ticket) => ({
          id: ticket.id,
          age: ticket.edad_visitante,
          passType: ticket.tipo_pase,
          price: ticket.precio,
        }));
      return {
        id: row.id,
        userId: row.usuario_id,
        email: row.email,
        visitDate: row.fecha_visita,
        paymentMethod: row.metodo_pago,
        status: row.estado,
        total: row.monto_total,
        paymentReference: row.referencia_pago,
        createdAt: row.creado_en,
        tickets,
      };
    },
  };
}

module.exports = { createPurchaseRepository };
