// app/api/products/route.js
import { NextResponse } from 'next/server';
import { withOptionalAuth } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

// --- In-memory cache for product list ---
const productListCache = {
  data: null,
  key: '',
  timestamp: 0,
  ttl: 60 * 1000 // 1 minute
};

function getCacheKey({ category, search, page, limit }) {
  return `${category || ''}|${search || ''}|${page || 1}|${limit || 20}`;
}

async function handler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // --- Caching logic ---
    const cacheKey = getCacheKey({ category, search, page, limit });
    if (
      productListCache.data &&
      productListCache.key === cacheKey &&
      Date.now() - productListCache.timestamp < productListCache.ttl
    ) {
      return NextResponse.json(productListCache.data);
    }

    let queryText = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.price,
        p.condition_rating,
        p.size,
        p.color,
        p.views_count,
        p.likes_count,
        p.created_at,
        p.image_urls,
        p.tags,
        u.name as seller_name,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      JOIN users u ON p.seller_id = u.id
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Exclude current user's products if user is authenticated
    if (request.user) {
      queryText += ` AND p.seller_id != $${paramIndex}`;
      queryParams.push(request.user.id);
      paramIndex++;
    }
    
    if (category) {
      queryText += ` AND c.name = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }
    
    if (search) {
      queryText += ` AND (
        p.title ILIKE $${paramIndex} OR 
        p.description ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex} OR
        b.name ILIKE $${paramIndex} OR
        $${paramIndex + 1} = ANY(p.tags)
      )`;
      queryParams.push(`%${search}%`, search);
      paramIndex += 2;
    }
    
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await query(queryText, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.status = 'active'
    `;
    
    const countParams = [];
    let countParamIndex = 1;

    // Exclude current user's products if user is authenticated (fix)
    if (request.user) {
      countQuery += ` AND p.seller_id != $${countParamIndex}`;
      countParams.push(request.user.id);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND c.name = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    
    if (search) {
      countQuery += ` AND (
        p.title ILIKE $${countParamIndex} OR 
        p.description ILIKE $${countParamIndex} OR
        c.name ILIKE $${countParamIndex} OR
        b.name ILIKE $${countParamIndex} OR
        $${countParamIndex + 1} = ANY(p.tags)
      )`;
      countParams.push(`%${search}%`, search);
    }
    
    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total);
    const responseData = {
      products: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      user: request.user || null
    };
    // --- Set cache ---
    productListCache.data = responseData;
    productListCache.key = cacheKey;
    productListCache.timestamp = Date.now();
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withOptionalAuth(handler);

// POST handler for creating new products
import { withAuth } from '../../../lib/middleware.js';

async function handlePOST(request) {
  try {
    const body = await request.json();
    
    const {
      title,
      description,
      price,
      original_price,
      condition_rating,
      size,
      color,
      category_id,
      image_urls,
      tags,
      is_negotiable
    } = body;

    // --- Strong validation ---
    const errors = [];
    if (!title || typeof title !== 'string' || title.length < 3 || title.length > 100) {
      errors.push('Title is required (3-100 chars).');
    }
    if (!description || typeof description !== 'string' || description.length < 10 || description.length > 1000) {
      errors.push('Description is required (10-1000 chars).');
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
      errors.push('Price must be a positive number.');
    }
    if (original_price && (isNaN(Number(original_price)) || Number(original_price) < Number(price))) {
      errors.push('Original price must be greater than or equal to price.');
    }
    if (!category_id || typeof category_id !== 'string') {
      errors.push('Category is required.');
    }
    if (image_urls && (!Array.isArray(image_urls) || image_urls.length === 0)) {
      errors.push('At least one image URL is required.');
    }
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(' ') }, { status: 400 });
    }

    const seller_id = request.user.id;

    const insertQuery = `
      INSERT INTO products (
        title, description, price, original_price, condition_rating, 
        size, color, category_id, seller_id, image_urls, tags, is_negotiable, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
      RETURNING id, title, price, created_at
    `;

    const values = [
      title,
      description,
      price,
      original_price,
      condition_rating || 'good',
      size,
      color,
      category_id,
      seller_id,
      image_urls || [],
      tags || [],
      is_negotiable || false
    ];

    const result = await query(insertQuery, values);
    const product = result.rows[0];
    
    // Award points for product upload
    try {
      await fetch(`${request.url.split('/api')[0]}/api/points/earn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || request.headers.get('authorization')
        },
        body: JSON.stringify({
          action: 'product_upload',
          referenceId: product.id,
          referenceType: 'product'
        })
      });
    } catch (pointsError) {
      console.error('Error awarding points:', pointsError);
      // Don't fail product creation if points awarding fails
    }
    
    // Invalidate product list cache
    productListCache.data = null;
    productListCache.key = '';
    productListCache.timestamp = 0;

    return NextResponse.json({
      success: true,
      message: 'Product created successfully! You earned 10 points.',
      product: product
    }, { status: 201 });

  } catch (error) {
    let message = 'Internal server error';
    if (error instanceof SyntaxError) {
      message = 'Invalid JSON in request body.';
    }
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
