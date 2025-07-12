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
    
    // For now, return empty orders array since we don't have an orders table yet
    // In a real application, you would create an orders table and fetch real data
    const mockOrders = [
      {
        id: 1,
        orderNumber: `ORD-${userId}-001`,
        date: new Date().toISOString().split('T')[0],
        total: 1550,
        status: 'Delivered',
        items: 2,
        image: 'https://placehold.co/100x100/6B8E23/ffffff?text=Order'
      },
      {
        id: 2,
        orderNumber: `ORD-${userId}-002`,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        total: 850,
        status: 'In Transit',
        items: 1,
        image: 'https://placehold.co/100x100/8FBC8F/ffffff?text=Order'
      }
    ];

    return NextResponse.json({
      success: true,
      orders: mockOrders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
