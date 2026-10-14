function createConsoleMailer({ logger = console } = {}) {
  return {
    async send(message) {
      logger.info(
        `Simulated purchase email: id=${message.purchaseId}, date=${message.visitDate}, `
        + `tickets=${message.ticketCount}, total=${message.total}, status=${message.status}, `
        + `attachment=${message.attachment.filename}`,
      );
    },
  };
}

module.exports = { createConsoleMailer };
