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
    
    // For now, return mock swaps since we don't have a swaps table yet
    // In a real application, you would create a swaps table and fetch real data
    const mockSwaps = [
      {
        id: 1,
        itemOffered: 'Blue Jeans',
        itemRequested: 'Black Hoodie',
        otherUser: 'Sarah M.',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        type: 'outgoing'
      },
      {
        id: 2,
        itemOffered: 'White Sneakers',
        itemRequested: 'Red Dress',
        otherUser: 'Mike K.',
        status: 'Completed',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'incoming'
      }
    ];

    return NextResponse.json({
      success: true,
      swaps: mockSwaps
    });

  } catch (error) {
    console.error('Error fetching swaps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
