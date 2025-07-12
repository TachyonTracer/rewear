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
    
    // Fetch user's swaps (both sent and received)
    const swapsResult = await query(`
      SELECT 
        s.id,
        s.status,
        s.message,
        s.created_at,
        s.updated_at,
        -- Requester info
        s.requester_id,
        ru.name as requester_name,
        rp.title as requester_product_title,
        rp.image_urls as requester_product_images,
        -- Target info  
        s.target_user_id,
        tu.name as target_user_name,
        tp.title as target_product_title,
        tp.image_urls as target_product_images,
        -- Determine if this user is the requester or target
        CASE 
          WHEN s.requester_id = $1 THEN 'outgoing'
          ELSE 'incoming'
        END as swap_type
      FROM swaps s
      JOIN users ru ON s.requester_id = ru.id
      JOIN users tu ON s.target_user_id = tu.id
      JOIN products rp ON s.requester_product_id = rp.id
      JOIN products tp ON s.target_product_id = tp.id
      WHERE s.requester_id = $1 OR s.target_user_id = $1
      ORDER BY s.created_at DESC
    `, [userId]);

    // Transform the data for frontend
    const swaps = swapsResult.rows.map(swap => ({
      id: swap.id,
      requester_id: swap.requester_id,
      target_user_id: swap.target_user_id,
      status: swap.status,
      message: swap.message,
      created_at: swap.created_at,
      updated_at: swap.updated_at,
      // Product information
      offered_product_name: swap.swap_type === 'outgoing' ? swap.requester_product_title : swap.target_product_title,
      requested_product_name: swap.swap_type === 'outgoing' ? swap.target_product_title : swap.requester_product_title,
      // User information
      other_user_name: swap.swap_type === 'outgoing' ? swap.target_user_name : swap.requester_name,
      // Legacy fields for backward compatibility
      itemOffered: swap.swap_type === 'outgoing' ? swap.requester_product_title : swap.target_product_title,
      itemRequested: swap.swap_type === 'outgoing' ? swap.target_product_title : swap.requester_product_title,
      otherUser: swap.swap_type === 'outgoing' ? swap.target_user_name : swap.requester_name,
      date: new Date(swap.created_at).toISOString().split('T')[0],
      type: swap.swap_type,
      offeredImage: swap.swap_type === 'outgoing' 
        ? (swap.requester_product_images?.[0] || null)
        : (swap.target_product_images?.[0] || null),
      requestedImage: swap.swap_type === 'outgoing' 
        ? (swap.target_product_images?.[0] || null)
        : (swap.requester_product_images?.[0] || null)
    }));

    return NextResponse.json({
      success: true,
      swaps: swaps
    });

  } catch (error) {
    console.error('Error fetching swaps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    const body = await request.json();
    const { requested_product_id, offered_product_id, message } = body;

    // Validate required fields
    if (!requested_product_id || !offered_product_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user is trying to swap with themselves by checking product ownership
    const targetProductCheck = await query(
      'SELECT seller_id FROM products WHERE id = $1',
      [requested_product_id]
    );

    if (targetProductCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Requested product not found' },
        { status: 404 }
      );
    }

    const targetUserId = targetProductCheck.rows[0].seller_id;

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot swap with yourself' },
        { status: 400 }
      );
    }

    // Check if the user owns the product they're offering
    const userProductCheck = await query(
      'SELECT id FROM products WHERE id = $1 AND seller_id = $2',
      [offered_product_id, userId]
    );

    if (userProductCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'You do not own this product' },
        { status: 403 }
      );
    }

    // Check if swap request already exists
    const existingSwap = await query(
      'SELECT id FROM swaps WHERE requester_id = $1 AND requester_product_id = $2 AND target_product_id = $3 AND status = $4',
      [userId, offered_product_id, requested_product_id, 'pending']
    );

    if (existingSwap.rows.length > 0) {
      return NextResponse.json(
        { error: 'Swap request already exists' },
        { status: 409 }
      );
    }

    // Create swap request
    const swapResult = await query(`
      INSERT INTO swaps (requester_id, requester_product_id, target_user_id, target_product_id, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [userId, offered_product_id, targetUserId, requested_product_id, message || null]);

    return NextResponse.json({
      success: true,
      swap: {
        id: swapResult.rows[0].id,
        createdAt: swapResult.rows[0].created_at
      }
    });

  } catch (error) {
    console.error('Error creating swap request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
