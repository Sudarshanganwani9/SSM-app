require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[seed:admin] MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('[seed:admin] SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[seed:admin] Connected to database.');

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed:admin] An account with email ${email} already exists. No action taken.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await User.hashPassword(password);
  await User.create({
    fullName,
    email,
    mobile: '0000000000',
    passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    profileCompleted: true,
    mustChangePassword: true,
  });

  console.log(`[seed:admin] Initial Admin account created: ${email}`);
  console.log('[seed:admin] IMPORTANT: log in and change this password immediately.');

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed:admin] Failed:', err);
  process.exit(1);
});
