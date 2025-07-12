import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

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
    
    // For now, return mock seller orders since we don't have an orders table yet
    // In a real application, you would create an orders table and fetch real data
    const mockOrders = [
      {
        id: 1,
        orderNumber: `ORD-${userId}-001`,
        buyer: 'John Doe',
        item: 'Summer Floral Dress',
        total: 650,
        status: 'Processing',
        date: new Date().toISOString().split('T')[0],
        image: 'https://placehold.co/100x100/8FBC8F/ffffff?text=Dress'
      },
      {
        id: 2,
        orderNumber: `ORD-${userId}-002`,
        buyer: 'Jane Smith',
        item: 'Vintage Denim Jacket',
        total: 1200,
        status: 'Shipped',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        image: 'https://placehold.co/100x100/6B8E23/ffffff?text=Denim'
      }
    ];

    return NextResponse.json({
      success: true,
      orders: mockOrders
    });

  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
