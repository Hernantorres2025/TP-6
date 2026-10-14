function createFakePaymentGateway({ outcome = process.env.FAKE_CARD_OUTCOME || 'approved' } = {}) {
  return {
    async charge({ purchaseId, amount }) {
      return {
        approved: outcome === 'approved',
        reference: `simulated-${purchaseId}-${amount}`,
      };
    },
  };
}

module.exports = { createFakePaymentGateway };
