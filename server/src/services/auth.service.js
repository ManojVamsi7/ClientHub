const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');
const { UnauthorizedError, ConflictError } = require('../utils/errors');

const SALT_ROUNDS = 10;

const register = async (userData) => {
  // Check for existing user
  const existing = await db('users')
    .where('email', userData.email)
    .orWhere('username', userData.username)
    .whereNull('deleted_at')
    .first();

  if (existing) {
    if (existing.email === userData.email) {
      throw new ConflictError('Email already registered');
    }
    throw new ConflictError('Username already taken');
  }

  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  const [user] = await db('users')
    .insert({
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'viewer',
    })
    .returning(['id', 'username', 'email', 'role', 'created_at']);

  return user;
};

const login = async (email, password) => {
  const user = await db('users')
    .where('email', email)
    .whereNull('deleted_at')
    .first();

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { register, login };
