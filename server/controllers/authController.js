import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minimumPasswordLength = 6;

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured. Add it to server/.env.');
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
};

const validateCredentials = ({ name, email, password, role }, isRegistration = false) => {
  const errors = {};

  if (isRegistration && (!name || !name.trim())) {
    errors.name = 'Name is required.';
  }

  if (!email || !emailPattern.test(email)) {
    errors.email = 'A valid email is required.';
  }

  if (!password || password.length < minimumPasswordLength) {
    errors.password = `Password must be at least ${minimumPasswordLength} characters.`;
  }

  if (isRegistration && role && !['employee', 'manager'].includes(role)) {
    errors.role = 'Role must be employee or manager.';
  }

  return errors;
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  const errors = validateCredentials({ name, email, password, role }, true);

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(400).json({ message: 'An account with that email already exists.' });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'employee',
    });

    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'An account with that email already exists.' });
    }
    throw error;
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const errors = validateCredentials({ email, password });

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed.', errors });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  const validPassword = user && await user.comparePassword(password);

  if (!validPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  return res.status(200).json({ user, token: createToken(user) });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.status(200).json({ user });
};
