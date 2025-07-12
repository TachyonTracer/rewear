import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '../../../../lib/db';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch user's products
    const result = await query(`
      SELECT 
        p.id,
        p.title as name,
        p.price,
        CASE 
          WHEN array_length(p.image_urls, 1) > 0 THEN p.image_urls[1]
          ELSE NULL
        END as image_url,
        p.condition_rating,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1 
      AND p.status = 'active'
      ORDER BY p.created_at DESC
    `, [userId]);

    return NextResponse.json({
      success: true,
      products: result.rows
    });

  } catch (error) {
    console.error('Error fetching user products:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
