const MAX_TICKETS_PER_USER_AND_DATE = 10;

class TicketLimitError extends Error {
  constructor() {
    super(`A user can buy at most ${MAX_TICKETS_PER_USER_AND_DATE} tickets for one visit date.`);
    this.name = 'TicketLimitError';
    this.code = 'TICKET_LIMIT_EXCEEDED';
  }
}

function assertTicketCountAllowed({ previousCount, newCount }) {
  if (previousCount + newCount > MAX_TICKETS_PER_USER_AND_DATE) {
    throw new TicketLimitError();
  }
}

module.exports = { assertTicketCountAllowed, MAX_TICKETS_PER_USER_AND_DATE, TicketLimitError };
