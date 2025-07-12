// app/api/admin/award-points/route.js
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    const { userId, points, description } = await request.json();
    
    if (!userId || !points) {
      return NextResponse.json(
        { error: 'User ID and points amount are required' },
        { status: 400 }
      );
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Add points to user balance
      await query(
        'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
        [points, userId]
      );
      
      // Record points transaction
      await query(`
        INSERT INTO points_transactions (user_id, points_amount, transaction_type, description, reference_type)
        VALUES ($1, $2, 'bonus', $3, 'admin_award')
      `, [userId, points, description || `Admin awarded ${points} bonus points`]);
      
      // Get updated balance
      const balanceResult = await query(
        'SELECT points_balance FROM users WHERE id = $1',
        [userId]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `Successfully awarded ${points} points to user ${userId}`,
        newBalance: balanceResult.rows[0]?.points_balance || 0
      });
      
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
