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

    // Get admin statistics
    const [userCount, productCount, orderCount] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM products'),
      db.query('SELECT COUNT(*) as count FROM orders WHERE 1=1') // Placeholder for when orders table exists
    ]);

    // Calculate revenue (placeholder - would need actual orders table)
    const revenue = 15420; // Mock value for now

    const stats = {
      totalUsers: parseInt(userCount.rows[0].count),
      totalProducts: parseInt(productCount.rows[0].count),
      totalOrders: 0, // Will be real when orders table exists
      revenue: revenue
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
