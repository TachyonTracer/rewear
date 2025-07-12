// Debug API to check product ownership
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product with owner info
    const result = await query(`
      SELECT 
        p.id,
        p.title,
        p.seller_id,
        u.name as owner_name,
        u.email as owner_email,
        p.updated_at
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `, [productId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching product ownership:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
