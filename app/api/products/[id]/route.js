import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function GET(request, { params }) {
  try {
    const { id } = await params; // Await params in Next.js 15
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.original_price,
        p.condition_rating,
        p.size,
        p.color,
        p.image_urls,
        p.tags,
        p.is_negotiable,
        p.created_at,
        p.updated_at,
        c.name as category_name,
        c.id as category_id,
        p.seller_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = result.rows[0];
    
    // Format the product data
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: parseFloat(product.price),
      original_price: product.original_price ? parseFloat(product.original_price) : null,
      condition_rating: product.condition_rating,
      size: product.size,
      color: product.color,
      image_urls: product.image_urls || [],
      tags: product.tags || [],
      is_negotiable: product.is_negotiable || false,
      category_name: product.category_name,
      category_id: product.category_id,
      seller_id: product.seller_id,
      created_at: product.created_at,
      updated_at: product.updated_at
    };

    return NextResponse.json({
      success: true,
      product: formattedProduct
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
