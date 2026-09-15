const cron = require('node-cron');
const COF = require('../models/COF');

function startCofExpiryJob() {
  // Runs once a day at 00:15 server time.
  cron.schedule('15 0 * * *', async () => {
    try {
      const result = await COF.updateMany(
        { status: 'APPROVED', expiryDate: { $lte: new Date() } },
        { status: 'EXPIRED' }
      );
      if (result.modifiedCount) {
        // eslint-disable-next-line no-console
        console.log(`[cof-expiry-job] Expired ${result.modifiedCount} COF record(s).`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cof-expiry-job] Failed:', err.message);
    }
  });
}

module.exports = { startCofExpiryJob };
