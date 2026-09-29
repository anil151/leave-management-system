import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { calculateLeaveBalances } from '../services/leaveBalanceService.js';

const allowedStatuses = ['pending', 'approved', 'rejected'];

const parsePagination = (query) => {
  const page = Number.parseInt(query.page || '1', 10);
  const limit = Number.parseInt(query.limit || '10', 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    const error = new Error('Page must be at least 1 and limit must be between 1 and 100.');
    error.statusCode = 400;
    throw error;
  }

  return { page, limit };
};

const ensureValidId = (id, message) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error(message);
    error.statusCode = 404;
    throw error;
  }
};

const populateRequest = (query) => query
  .populate('employee', 'name email')
  .populate('leaveType', 'name');

const getPaginatedRequests = async (filters, page, limit) => {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    populateRequest(LeaveRequest.find(filters))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filters),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const getPendingRequest = async (id) => {
  ensureValidId(id, 'Leave request not found.');
  const leaveRequest = await LeaveRequest.findById(id);

  if (!leaveRequest) {
    const error = new Error('Leave request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (leaveRequest.status !== 'pending') {
    const error = new Error('Only pending leave requests can be decided.');
    error.statusCode = 400;
    throw error;
  }

  return leaveRequest;
};

export const approveLeaveRequest = async (req, res) => {
  const leaveRequest = await getPendingRequest(req.params.id);
  const balances = await calculateLeaveBalances(leaveRequest.employee.toString());
  const balance = balances.find(
    ({ leaveType }) => leaveType._id.toString() === leaveRequest.leaveType.toString(),
  );

  if (!balance) {
    return res.status(404).json({ message: 'Leave type not found.' });
  }

  if (leaveRequest.daysRequested > balance.daysRemaining) {
    return res.status(400).json({
      message: 'Leave request exceeds the employee\'s remaining balance.',
      daysRemaining: balance.daysRemaining,
    });
  }

  leaveRequest.status = 'approved';
  leaveRequest.decidedBy = req.user.id;
  leaveRequest.decidedAt = new Date();
  await leaveRequest.save();
  await leaveRequest.populate([
    { path: 'employee', select: 'name email' },
    { path: 'leaveType', select: 'name' },
  ]);

  return res.status(200).json({ data: leaveRequest });
};

export const rejectLeaveRequest = async (req, res) => {
  const leaveRequest = await getPendingRequest(req.params.id);
  const { reason } = req.body || {};

  if (reason !== undefined && typeof reason !== 'string') {
    return res.status(400).json({ message: 'Rejection reason must be a string.' });
  }

  leaveRequest.status = 'rejected';
  leaveRequest.decidedBy = req.user.id;
  leaveRequest.decidedAt = new Date();
  if (reason !== undefined) {
    leaveRequest.reason = reason.trim();
  }
  await leaveRequest.save();
  await leaveRequest.populate([
    { path: 'employee', select: 'name email' },
    { path: 'leaveType', select: 'name' },
  ]);

  return res.status(200).json({ data: leaveRequest });
};

export const listMyLeaveRequests = async (req, res) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ message: 'Only employees can view their own leave requests.' });
  }

  const { page, limit } = parsePagination(req.query);
  const filters = { employee: req.user.id };

  if (req.query.status !== undefined) {
    if (!allowedStatuses.includes(req.query.status)) {
      return res.status(400).json({ message: 'Status must be pending, approved, or rejected.' });
    }
    filters.status = req.query.status;
  }

  return res.status(200).json(await getPaginatedRequests(filters, page, limit));
};

export const getLeaveBalances = async (req, res) => {
  const employeeId = req.user.role === 'manager' && req.query.employee
    ? req.query.employee
    : req.user.id;

  ensureValidId(employeeId, 'Employee not found.');
  const employeeExists = await User.exists({ _id: employeeId });

  if (!employeeExists) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  return res.status(200).json({ data: await calculateLeaveBalances(employeeId) });
};

