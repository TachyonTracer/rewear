import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    // Extract and verify the token
    const token = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Fetch user's products from the database
    const query = `
      SELECT 
        p.id,
        p.title as name,
        p.price,
        p.description,
        p.condition_rating,
        p.size,
        p.color,
        p.image_urls,
        p.created_at,
        p.status,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `;

    const result = await pool.query(query, [userId]);

    // Format the products data for better compatibility
    const formattedProducts = result.rows.map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      description: product.description,
      condition_rating: product.condition_rating,
      size: product.size,
      color: product.color,
      image_url: product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : null,
      image_urls: product.image_urls || [],
      created_at: product.created_at,
      status: product.status,
      category_name: product.category_name
    }));

    return NextResponse.json({
      success: true,
      data: {
        products: formattedProducts
      }
    });

  } catch (error) {
    console.error('Error fetching user products:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
