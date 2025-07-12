import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import jwt from 'jsonwebtoken';

export async function PATCH(request, { params }) {
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
    const swapId = params.id;
    const body = await request.json();
    const { action } = body; // 'accept' or 'reject'

    // Validate action
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept or reject' },
        { status: 400 }
      );
    }

    // Check if swap exists and user is the target
    const swapResult = await query(
      'SELECT * FROM swaps WHERE id = $1 AND target_user_id = $2 AND status = $3',
      [swapId, userId, 'pending']
    );

    if (swapResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Swap not found or not authorized' },
        { status: 404 }
      );
    }

    // Update swap status
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await query(
      'UPDATE swaps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, swapId]
    );

    return NextResponse.json({
      success: true,
      message: `Swap ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error updating swap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
