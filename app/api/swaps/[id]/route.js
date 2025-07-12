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
    const { id: swapId } = await params; // Await params in Next.js 15
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

    // Update swap status initially
    const initialStatus = action === 'accept' ? 'accepted' : 'rejected';
    await query(
      'UPDATE swaps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [initialStatus, swapId]
    );

    // Transfer ownership and award points if swap was accepted
    if (action === 'accept') {
      const swap = swapResult.rows[0];
      
      try {
        // Step 1: Transfer product ownership
        console.log('Transferring product ownership...');
        
        // Transfer requester's product to target user
        await query(
          'UPDATE products SET seller_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [userId, swap.requester_product_id]
        );
        
        // Transfer target's product to requester
        await query(
          'UPDATE products SET seller_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [swap.requester_id, swap.target_product_id]
        );
        
        console.log('Product ownership transferred successfully');
        
        // Step 2: Award points to both users
        const baseUrl = request.url.split('/api')[0];
        
        // Award points to requester
        await fetch(`${baseUrl}/api/points/earn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt.sign({ userId: swap.requester_id }, process.env.JWT_SECRET)}`
          },
          body: JSON.stringify({
            action: 'swap_completed',
            referenceId: swapId,
            referenceType: 'swap'
          })
        });
        
        // Award points to target user (current user)
        await fetch(`${baseUrl}/api/points/earn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            action: 'swap_completed',
            referenceId: swapId,
            referenceType: 'swap'
          })
        });
        
        console.log('Points awarded successfully');
        
        // Step 3: Mark swap as completed after successful ownership transfer and points
        await query(
          'UPDATE swaps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['completed', swapId]
        );
        
      } catch (error) {
        console.error('Error in swap completion process:', error);
        
        // If ownership transfer fails, revert the swap status
        if (error.message && (error.message.includes('seller_id') || error.message.includes('products'))) {
          await query(
            'UPDATE swaps SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['pending', swapId]
          );
          
          return NextResponse.json(
            { error: 'Failed to transfer product ownership. Swap reverted.' },
            { status: 500 }
          );
        }
        
        // If only points awarding fails, continue with successful swap
        console.error('Error awarding points for swap:', error);
        // Don't fail the swap if only points awarding fails
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'accept' 
        ? 'Swap completed successfully! Product ownership has been transferred and you both earned 25 points!'
        : 'Swap rejected successfully'
    });

  } catch (error) {
    console.error('Error updating swap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

}