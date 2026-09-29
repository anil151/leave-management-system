import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveType from '../models/LeaveType.js';

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

const parseDate = (value) => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    return null;
  }

  return new Date(value);
};

const calendarDay = (date) => Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate(),
);

const getInclusiveDays = (startDate, endDate) => {
  const difference = calendarDay(endDate) - calendarDay(startDate);
  return Math.floor(difference / (24 * 60 * 60 * 1000)) + 1;
};

const validateRequestFields = ({ leaveType, startDate, endDate, reason }) => {
  const errors = {};
  const parsedStartDate = parseDate(startDate);
  const parsedEndDate = parseDate(endDate);

  if (!mongoose.isValidObjectId(leaveType)) {
    errors.leaveType = 'A valid leave type is required.';
  }

  if (!parsedStartDate) {
    errors.startDate = 'A valid start date is required.';
  }

  if (!parsedEndDate) {
    errors.endDate = 'A valid end date is required.';
  }

  if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
    errors.endDate = 'End date must be on or after the start date.';
  }

  if (reason !== undefined && typeof reason !== 'string') {
    errors.reason = 'Reason must be a string.';
  }

  return {
    errors,
    values: {
      leaveType,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason: typeof reason === 'string' ? reason.trim() : '',
      daysRequested: parsedStartDate && parsedEndDate
        ? getInclusiveDays(parsedStartDate, parsedEndDate)
        : null,
    },
  };
};

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Leave request not found.');
    error.statusCode = 404;
    throw error;
  }
};

const populateRequest = (query) => query
  .populate('employee', 'name email')
  .populate('leaveType', 'name');

const isOwner = (leaveRequest, userId) => {
  const employeeId = leaveRequest.employee?._id ?? leaveRequest.employee;
  return employeeId?.toString() === userId;
};

export const createLeaveRequest = async (req, res) => {
  const { errors, values } = validateRequestFields(req.body || {});

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const leaveTypeExists = await LeaveType.exists({ _id: values.leaveType });

  if (!leaveTypeExists) {
    return res.status(404).json({ message: 'Leave type not found.' });
  }

  const leaveRequest = await LeaveRequest.create({
    employee: req.user.id,
    leaveType: values.leaveType,
    startDate: values.startDate,
    endDate: values.endDate,
    daysRequested: values.daysRequested,
    reason: values.reason,
  });

  await leaveRequest.populate([
    { path: 'employee', select: 'name email' },
    { path: 'leaveType', select: 'name' },
  ]);

  return res.status(201).json({ data: leaveRequest });
};

export const listLeaveRequests = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const filters = {};

  if (req.user.role === 'manager') {
    if (req.query.status !== undefined) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: 'Status must be pending, approved, or rejected.' });
      }
      filters.status = req.query.status;
    }

    if (req.query.employee !== undefined) {
      if (!mongoose.isValidObjectId(req.query.employee)) {
        return res.status(400).json({ message: 'Employee must be a valid user id.' });
      }
      filters.employee = req.query.employee;
    }
  } else {
    filters.employee = req.user.id;
  }

  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    populateRequest(LeaveRequest.find(filters))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LeaveRequest.countDocuments(filters),
  ]);

  return res.status(200).json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};

export const getLeaveRequest = async (req, res) => {
  ensureValidId(req.params.id);
  const leaveRequest = await populateRequest(LeaveRequest.findById(req.params.id));

  if (!leaveRequest) {
    return res.status(404).json({ message: 'Leave request not found.' });
  }

  if (req.user.role !== 'manager' && !isOwner(leaveRequest, req.user.id)) {
    return res.status(403).json({ message: 'You do not have permission to view this leave request.' });
  }

  return res.status(200).json({ data: leaveRequest });
};

export const updateLeaveRequest = async (req, res) => {
  ensureValidId(req.params.id);
  const leaveRequest = await LeaveRequest.findById(req.params.id);

  if (!leaveRequest) {
    return res.status(404).json({ message: 'Leave request not found.' });
  }

  if (!isOwner(leaveRequest, req.user.id)) {
    return res.status(403).json({ message: 'Only the owner can update this leave request.' });
  }

  if (leaveRequest.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending leave requests can be updated.' });
  }

  const values = {
    leaveType: req.body.leaveType ?? leaveRequest.leaveType.toString(),
    startDate: req.body.startDate ?? leaveRequest.startDate.toISOString(),
    endDate: req.body.endDate ?? leaveRequest.endDate.toISOString(),
    reason: req.body.reason ?? leaveRequest.reason,
  };
  const { errors, values: validatedValues } = validateRequestFields(values);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  if (validatedValues.leaveType !== leaveRequest.leaveType.toString()) {
    const leaveTypeExists = await LeaveType.exists({ _id: validatedValues.leaveType });
    if (!leaveTypeExists) {
      return res.status(404).json({ message: 'Leave type not found.' });
    }
  }

  leaveRequest.leaveType = validatedValues.leaveType;
  leaveRequest.startDate = validatedValues.startDate;
  leaveRequest.endDate = validatedValues.endDate;
  leaveRequest.daysRequested = validatedValues.daysRequested;
  leaveRequest.reason = validatedValues.reason;
  await leaveRequest.save();
  await leaveRequest.populate([
    { path: 'employee', select: 'name email' },
    { path: 'leaveType', select: 'name' },
  ]);

  return res.status(200).json({ data: leaveRequest });
};

export const deleteLeaveRequest = async (req, res) => {
  ensureValidId(req.params.id);
  const leaveRequest = await LeaveRequest.findById(req.params.id);

  if (!leaveRequest) {
    return res.status(404).json({ message: 'Leave request not found.' });
  }

  if (!isOwner(leaveRequest, req.user.id)) {
    return res.status(403).json({ message: 'Only the owner can delete this leave request.' });
  }

  if (leaveRequest.status !== 'pending') {
    return res.status(400).json({ message: 'Only pending leave requests can be deleted.' });
  }

  await leaveRequest.deleteOne();
  return res.status(200).json({ message: 'Leave request deleted successfully.' });
};
