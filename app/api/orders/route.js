import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import jwt from 'jsonwebtoken';



export async function GET(request) {
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
    
    // Fetch real orders from database
    const ordersResult = await query(`
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.payment_method,
        o.created_at,
        p.title as product_title,
        p.price as product_price,
        p.image_urls[1] as product_image,
        u.name as seller_name,
        p.id as product_id
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.seller_id = u.id
      WHERE o.buyer_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);

    // Transform the data to match the expected format
    const orders = ordersResult.rows.map((order, index) => ({
      id: order.id,
      orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
      date: new Date(order.created_at).toLocaleDateString(),
      total: `₹${parseFloat(order.total_amount).toFixed(2)}`,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      items: 1, // Each order is for one product in this system
      image: order.product_image || `https://placehold.co/100x100/6B8E23/ffffff?text=${encodeURIComponent(order.product_title)}`,
      productTitle: order.product_title,
      productPrice: `₹${parseFloat(order.product_price).toFixed(2)}`,
      sellerName: order.seller_name,
      paymentMethod: order.payment_method,
      productId: order.product_id
    }));

    return NextResponse.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
