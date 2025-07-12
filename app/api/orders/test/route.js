import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import jwt from 'jsonwebtoken';

// TEST ENDPOINT - Creates sample orders for development/testing
export async function POST(request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Get some products to create orders with
    const productsResult = await query(`
      SELECT id, seller_id, price, title 
      FROM products 
      WHERE seller_id != $1 
      AND status = 'active'
      LIMIT 3
    `, [userId]);

    if (productsResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No products found to create test orders' },
        { status: 400 }
      );
    }

    const orders = [];
    const statuses = ['paid', 'shipped', 'delivered'];
    
    for (let i = 0; i < Math.min(3, productsResult.rows.length); i++) {
      const product = productsResult.rows[i];
      const status = statuses[i] || 'paid';
      
      // Create test order
      const orderResult = await query(`
        INSERT INTO orders (
          buyer_id, 
          seller_id, 
          product_id, 
          total_amount, 
          payment_method, 
          status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 
          CURRENT_TIMESTAMP - INTERVAL '${i + 1} days'
        )
        RETURNING id
      `, [
        userId,
        product.seller_id,
        product.id,
        product.price,
        'points',
        status
      ]);

      orders.push({
        id: orderResult.rows[0].id,
        productTitle: product.title,
        status: status,
        amount: product.price
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${orders.length} test orders`,
      orders: orders
    });

  } catch (error) {
    console.error('Error creating test orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
