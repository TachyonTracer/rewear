import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { withAuth } from '../../../../lib/middleware.js';

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

    // Validate that ID is a valid integer
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID. Must be a positive integer.' },
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

    const result = await pool.query(query, [productId]);
    
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

// PUT handler for updating products
async function handlePUT(request, { params }) {
  try {
    const { id } = await params; // Await params in Next.js 15
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate that ID is a valid integer
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    const userId = request.user.id;
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
      tags,
      is_negotiable
    } = body;

    // Validate required fields
    if (!title || !description || !price || !category_id || !condition_rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if product exists and belongs to the user
    const checkQuery = 'SELECT seller_id FROM products WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [productId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = checkResult.rows[0];
    
    // Verify the user owns this product
    if (product.seller_id !== userId) {
      return NextResponse.json(
        { error: 'You can only edit your own products' },
        { status: 403 }
      );
    }

    // Update the product
    const updateQuery = `
      UPDATE products 
      SET 
        title = $1,
        description = $2,
        price = $3,
        original_price = $4,
        condition_rating = $5,
        size = $6,
        color = $7,
        category_id = $8,
        tags = $9,
        is_negotiable = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND seller_id = $12
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      title,
      description,
      price,
      original_price,
      condition_rating,
      size,
      color,
      category_id,
      tags,
      is_negotiable,
      productId,
      userId
    ]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    const updatedProduct = updateResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: updatedProduct.id,
        title: updatedProduct.title,
        description: updatedProduct.description,
        price: parseFloat(updatedProduct.price),
        original_price: updatedProduct.original_price ? parseFloat(updatedProduct.original_price) : null,
        condition_rating: updatedProduct.condition_rating,
        size: updatedProduct.size,
        color: updatedProduct.color,
        category_id: updatedProduct.category_id,
        tags: updatedProduct.tags || [],
        is_negotiable: updatedProduct.is_negotiable || false,
        updated_at: updatedProduct.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const DELETE = withAuth(handleDELETE);
export const PUT = withAuth(handlePUT);

// DELETE handler for removing products
async function handleDELETE(request, { params }) {
  try {
    const { id } = await params; // Await params in Next.js 15
    
    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate that ID is a valid integer
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID. Must be a positive integer.' },
        { status: 400 }
      );
    }

    const userId = request.user.id;

    // Check if product exists and belongs to the user
    const checkQuery = 'SELECT seller_id FROM products WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [productId]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const product = checkResult.rows[0];
    
    // Verify the user owns this product
    if (product.seller_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own products' },
        { status: 403 }
      );
    }

    // Check for active or pending swaps involving this product
    const swapCheckQuery = `
      SELECT id, status 
      FROM swaps 
      WHERE (requester_product_id = $1 OR target_product_id = $1) 
      AND status IN ('pending', 'accepted')
    `;
    const swapCheckResult = await pool.query(swapCheckQuery, [productId]);

    if (swapCheckResult.rows.length > 0) {
      const activeSwaps = swapCheckResult.rows;
      const pendingCount = activeSwaps.filter(swap => swap.status === 'pending').length;
      const acceptedCount = activeSwaps.filter(swap => swap.status === 'accepted').length;
      
      let message = 'Cannot delete this product because it has ';
      if (pendingCount > 0 && acceptedCount > 0) {
        message += `${pendingCount} pending and ${acceptedCount} accepted swap(s).`;
      } else if (pendingCount > 0) {
        message += `${pendingCount} pending swap(s).`;
      } else {
        message += `${acceptedCount} accepted swap(s).`;
      }
      message += ' Please complete or cancel these swaps first.';

      return NextResponse.json(
        { error: message },
        { status: 409 } // Conflict status code
      );
    }

    // Check for completed swaps (for informational purposes, but allow deletion)
    const completedSwapQuery = `
      SELECT COUNT(*) as count 
      FROM swaps 
      WHERE (requester_product_id = $1 OR target_product_id = $1) 
      AND status IN ('completed', 'rejected', 'cancelled')
    `;
    const completedSwapResult = await pool.query(completedSwapQuery, [productId]);
    const completedSwapCount = parseInt(completedSwapResult.rows[0].count);

    // Use a transaction to handle the deletion safely
    await pool.query('BEGIN');

    try {
      // If there are completed/historical swaps, update them to remove the product reference
      // We'll set the product reference to NULL for historical records
      if (completedSwapCount > 0) {
        await pool.query(`
          UPDATE swaps 
          SET requester_product_id = NULL 
          WHERE requester_product_id = $1 
          AND status IN ('completed', 'rejected', 'cancelled')
        `, [productId]);

        await pool.query(`
          UPDATE swaps 
          SET target_product_id = NULL 
          WHERE target_product_id = $1 
          AND status IN ('completed', 'rejected', 'cancelled')
        `, [productId]);
      }

      // Now delete the product
      const deleteQuery = 'DELETE FROM products WHERE id = $1 AND seller_id = $2';
      const deleteResult = await pool.query(deleteQuery, [productId, userId]);

      if (deleteResult.rowCount === 0) {
        throw new Error('Product not found or deletion failed');
      }

      // Commit the transaction
      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: completedSwapCount > 0 
          ? `Product deleted successfully. ${completedSwapCount} historical swap record(s) were updated.`
          : 'Product deleted successfully'
      });

    } catch (deleteError) {
      // Rollback the transaction on error
      await pool.query('ROLLBACK');
      throw deleteError;
    }

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
