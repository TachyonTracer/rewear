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
    
    // Fetch user's uploaded items from database
    const queryText = `
      SELECT 
        p.id,
        p.title,
        p.price,
        p.condition_rating,
        p.status,
        p.views_count,
        p.likes_count,
        p.image_urls,
        p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await query(queryText, [userId]);
    
    // Format the products for frontend
    const formattedItems = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category_name,
      price: item.price,
      condition: item.condition_rating?.replace(/_/g, ' ') || 'Unknown',
      status: item.status === 'active' ? 'Available' : 'Unavailable',
      views: item.views_count || 0,
      likes: item.likes_count || 0,
      image: item.image_urls && item.image_urls.length > 0 
        ? item.image_urls[0] 
        : `https://placehold.co/100x100/4169E1/ffffff?text=${encodeURIComponent(item.title)}`,
      dateAdded: new Date(item.created_at).toISOString().split('T')[0]
    }));

    return NextResponse.json({
      success: true,
      items: formattedItems
    });

  } catch (error) {
    console.error('Error fetching user items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
