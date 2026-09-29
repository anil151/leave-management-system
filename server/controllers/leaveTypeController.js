import mongoose from 'mongoose';
import LeaveType from '../models/LeaveType.js';

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

const validateLeaveType = (body) => {
  const errors = {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = body.description === undefined
    ? ''
    : typeof body.description === 'string'
      ? body.description.trim()
      : null;
  const days = body.defaultDaysPerYear;
  const parsedDays = typeof days === 'number' && Number.isFinite(days)
    ? days
    : typeof days === 'string' && days.trim() !== ''
      ? Number(days)
      : Number.NaN;

  if (!name) {
    errors.name = 'Name is required.';
  }

  if (description === null) {
    errors.description = 'Description must be a string.';
  }

  if (!Number.isFinite(parsedDays) || parsedDays < 0) {
    errors.defaultDaysPerYear = 'Default days per year must be a number of at least 0.';
  }

  return {
    errors,
    values: {
      name,
      description: description ?? '',
      defaultDaysPerYear: parsedDays,
    },
  };
};

const ensureValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Leave type not found.');
    error.statusCode = 404;
    throw error;
  }
};

const duplicateNameResponse = (error, res) => {
  if (error.code === 11000) {
    res.status(400).json({ message: 'A leave type with that name already exists.' });
    return true;
  }

  return false;
};

export const createLeaveType = async (req, res) => {
  const { errors, values } = validateLeaveType(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  try {
    const leaveType = await LeaveType.create(values);
    return res.status(201).json({ data: leaveType });
  } catch (error) {
    if (duplicateNameResponse(error, res)) {
      return undefined;
    }
    throw error;
  }
};

export const listLeaveTypes = async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    LeaveType.find().sort({ name: 1 }).skip(skip).limit(limit),
    LeaveType.countDocuments(),
  ]);

  return res.status(200).json({
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
};

export const getLeaveType = async (req, res) => {
  ensureValidId(req.params.id);
  const leaveType = await LeaveType.findById(req.params.id);

  if (!leaveType) {
    return res.status(404).json({ message: 'Leave type not found.' });
  }

  return res.status(200).json({ data: leaveType });
};

export const updateLeaveType = async (req, res) => {
  ensureValidId(req.params.id);
  const { errors, values } = validateLeaveType(req.body);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const leaveType = await LeaveType.findById(req.params.id);

  if (!leaveType) {
    return res.status(404).json({ message: 'Leave type not found.' });
  }

  leaveType.name = values.name;
  leaveType.description = values.description;
  leaveType.defaultDaysPerYear = values.defaultDaysPerYear;

  try {
    await leaveType.save();
    return res.status(200).json({ data: leaveType });
  } catch (error) {
    if (duplicateNameResponse(error, res)) {
      return undefined;
    }
    throw error;
  }
};

export const deleteLeaveType = async (req, res) => {
  ensureValidId(req.params.id);
  const leaveType = await LeaveType.findByIdAndDelete(req.params.id);

  if (!leaveType) {
    return res.status(404).json({ message: 'Leave type not found.' });
  }

  return res.status(200).json({ message: 'Leave type deleted successfully.' });
};
