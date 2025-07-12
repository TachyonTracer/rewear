import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.account_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with their details
    const users = await db.query(`
      SELECT 
        id,
        name,
        email,
        account_type,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ users: users.rows });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
