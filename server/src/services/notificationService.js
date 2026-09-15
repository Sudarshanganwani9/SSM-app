const Notification = require('../models/Notification');
const User = require('../models/User');

async function notifyUser({ recipientId, type, title, message, link = '', relatedId = null }) {
  return Notification.create({ recipient: recipientId, type, title, message, link, relatedId });
}

async function notifyAllAdmins({ type, title, message, link = '', relatedId = null }) {
  const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('_id');
  if (!admins.length) return [];
  return Notification.insertMany(
    admins.map((a) => ({
      recipient: a._id,
      type,
      title,
      message,
      link,
      relatedId,
    }))
  );
}

module.exports = { notifyUser, notifyAllAdmins };
