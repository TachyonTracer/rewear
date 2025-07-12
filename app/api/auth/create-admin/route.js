import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request) {
  try {
    // This is a development-only route to create admin users
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const result = await query(`
      INSERT INTO users (email, password_hash, name, type, is_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name, type
    `, [email, hashedPassword, name, 'admin', true]);

    const user = result.rows[0];

    return NextResponse.json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
