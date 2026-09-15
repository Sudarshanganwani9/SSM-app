const AuditLog = require('../models/AuditLog');

async function recordAudit({ adminId, action, targetModel, targetId, oldValue = null, newValue = null, note = '' }) {
  try {
    await AuditLog.create({ admin: adminId, action, targetModel, targetId, oldValue, newValue, note });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    // eslint-disable-next-line no-console
    console.error('[audit] Failed to record audit log:', err.message);
  }
}

module.exports = { recordAudit };
