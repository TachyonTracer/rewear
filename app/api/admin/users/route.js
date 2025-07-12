import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';
import { query } from '../../../../lib/db';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    var where = "";
    if (!decoded || decoded.type == 'admin')
    {
      where = "WHERE type != 'admin'";
    }

    // Get all users with their details
    const users = await query(`
      SELECT 
        id,
        name,
        email,
        type,
        created_at,
        updated_at
      FROM users ${where}
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ users: users.rows });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
