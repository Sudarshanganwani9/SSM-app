const asyncHandler = require('express-async-handler');
const AuditLog = require('../models/AuditLog');

// GET /api/audit-logs (Admin)
const listAuditLogs = asyncHandler(async (req, res) => {
  const { targetModel, adminId, page = 1, limit = 25 } = req.query;
  const query = {};
  if (targetModel) query.targetModel = targetModel;
  if (adminId) query.admin = adminId;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('admin', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

module.exports = { listAuditLogs };
