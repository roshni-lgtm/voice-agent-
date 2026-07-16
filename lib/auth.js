import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Validate JWT secrets are configured
if (!process.env.JWT_SECRET) {
  console.error('WARNING: JWT_SECRET is not configured in environment variables!');
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.error('WARNING: JWT_REFRESH_SECRET is not configured in environment variables!');
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-this-in-production';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateAccessToken(user) {
  return jwt.sign(
    { 
      userId: user.id || user._id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { 
      userId: user.id || user._id, 
      email: user.email 
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return verifyAccessToken(token);
}
