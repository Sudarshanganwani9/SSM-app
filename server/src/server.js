require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/db');
const { startCofExpiryJob } = require('./jobs/cofExpiryJob');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  startCofExpiryJob();

  const server = app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] SSM API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled rejection:', err);
    server.close(() => process.exit(1));
  });
}

start();
