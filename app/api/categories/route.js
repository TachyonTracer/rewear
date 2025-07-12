// app/api/categories/route.js
import { NextResponse } from 'next/server';
import { query } from '../../../lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';
    
    let queryText = `
      SELECT 
        id,
        name,
        slug,
        description,
        parent_id,
        image_url,
        is_active,
        created_at,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.status = 'active') as product_count
      FROM categories c
    `;
    
    if (!includeInactive) {
      queryText += ' WHERE is_active = true';
    }
    
    queryText += ' ORDER BY name ASC';
    
    const result = await query(queryText);
    
    // Format categories for frontend
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      parentId: row.parent_id,
      imageUrl: row.image_url,
      isActive: row.is_active,
      productCount: parseInt(row.product_count),
      createdAt: row.created_at
    }));
    
    return NextResponse.json({
      success: true,
      categories,
      total: categories.length
    });
    
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create new category (for admins)
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, slug, description, parentId, imageUrl, isActive = true } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: name, slug' 
        },
        { status: 400 }
      );
    }

    const queryText = `
      INSERT INTO categories (name, slug, description, parent_id, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, slug, description, parent_id, image_url, is_active, created_at
    `;

    const values = [name, slug, description, parentId, imageUrl, isActive];
    const result = await query(queryText, values);
    const newCategory = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        parentId: newCategory.parent_id,
        imageUrl: newCategory.image_url,
        isActive: newCategory.is_active,
        createdAt: newCategory.created_at
      }
    });

  } catch (error) {
    console.error('Error creating category:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category slug already exists' 
        },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
