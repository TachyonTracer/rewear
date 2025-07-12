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

    // Get all products with seller information
    const products = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category,
        p.condition,
        p.created_at,
        u.name as seller_name,
        u.email as seller_email
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ products: products.rows });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
