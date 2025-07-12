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

    // Get admin statistics
    const [userCount, productCount, orderCount, sellersCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT COUNT(*) as count FROM products'),
      query('SELECT COUNT(*) as count FROM orders WHERE 1=1'), 
      query('SELECT COUNT(DISTINCT seller_id) as count FROM products')
    ]);

   
    const revenue = 0; 

    const stats = {
      totalUsers: parseInt(userCount.rows[0].count),
      totalProducts: parseInt(productCount.rows[0].count),
      totalOrders: 0, // Will be real when orders table exists
      activeSellers: parseInt(sellersCount.rows[0].count), // Users who have actually listed products
      revenue: revenue
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
