// lib/auth.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Hash password
export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Create user in database
export async function createUser(userData) {
  const { email, password, name, phone, address, city, state, type = 'user' } = userData;
  
  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  
  if (existingUser.rows.length > 0) {
    throw new Error('User already exists with this email');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  
  // Insert new user
  const result = await query(
    `INSERT INTO users (email, password_hash, name, phone, address, city, state, type) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
     RETURNING id, email, name, phone, address, city, state, type, is_verified, created_at`,
    [email, hashedPassword, name, phone, address, city, state, type]
  );
  
  return result.rows[0];
}

// Authenticate user
export async function authenticateUser(email, password) {
  const result = await query(
    'SELECT id, email, password_hash, name, phone, address, city, state, type, is_verified, profile_image FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const user = result.rows[0];
  
  // Check password
  const isPasswordValid = await comparePassword(password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }
  
  // Remove password hash from returned user object
  const { password_hash, ...userWithoutPassword } = user;
  
  return userWithoutPassword;
}

// Get user by ID
export async function getUserById(userId) {
  const result = await query(
    'SELECT id, email, name, phone, address, city, state, type, is_verified, profile_image, created_at FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Get user by email
export async function getUserByEmail(email) {
  const result = await query(
    'SELECT id, email, name, phone, address, city, state, type, is_verified, profile_image, created_at FROM users WHERE email = $1',
    [email]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Update user profile
export async function updateUserProfile(userId, updateData) {
  const { name, phone, address, city, state, profile_image } = updateData;
  
  const result = await query(
    `UPDATE users 
     SET name = COALESCE($2, name), 
         phone = COALESCE($3, phone), 
         address = COALESCE($4, address), 
         city = COALESCE($5, city), 
         state = COALESCE($6, state), 
         profile_image = COALESCE($7, profile_image),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 
     RETURNING id, email, name, phone, address, city, state, type, is_verified, profile_image`,
    [userId, name, phone, address, city, state, profile_image]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}

// Change user password
export async function changeUserPassword(userId, currentPassword, newPassword) {
  // Get current password hash
  const result = await query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const currentPasswordHash = result.rows[0].password_hash;
  
  // Verify current password
  const isCurrentPasswordValid = await comparePassword(currentPassword, currentPasswordHash);
  
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);
  
  await query(
    'UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId, newPasswordHash]
  );
  
  return { success: true };
}

// Verify user email
export async function verifyUserEmail(userId) {
  const result = await query(
    'UPDATE users SET is_verified = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, is_verified',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}
