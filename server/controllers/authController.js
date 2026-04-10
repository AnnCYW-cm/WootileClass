import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } from '../utils/errors.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new BadRequestError('邮箱和密码不能为空');
  }

  const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    throw new ConflictError('该邮箱已被注册');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, hashedPassword, name || '']
  );

  const user = result.rows[0];
  const token = generateToken(user.id);

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('邮箱和密码不能为空');
  }

  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  const user = result.rows[0];

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  const token = generateToken(user.id);

  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    token
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError('用户');
  }
  res.json(result.rows[0]);
});
