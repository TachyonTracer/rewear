// app/api/points/earn/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/middleware.js';
import { query } from '../../../../lib/db.js';

async function handlePOST(request) {
  try {
    const userId = request.user.id;
    const { action, referenceId, referenceType } = await request.json();
    
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // Define points earning rules
    const pointsRules = {
      'product_upload': { points: 10, description: 'Points earned for uploading a product' },
      'product_sold': { points: 50, description: 'Points earned for selling a product' },
      'swap_completed': { points: 25, description: 'Points earned for completing a swap' },
      'profile_completed': { points: 20, description: 'Points earned for completing profile' },
      'first_purchase': { points: 100, description: 'Welcome bonus for first purchase' },
      'referral': { points: 200, description: 'Points earned for successful referral' },
      'review_written': { points: 5, description: 'Points earned for writing a review' },
      'daily_login': { points: 2, description: 'Daily login bonus' },
      'weekly_active': { points: 15, description: 'Weekly activity bonus' }
    };
    
    const rule = pointsRules[action];
    if (!rule) {
      return NextResponse.json(
        { error: 'Invalid action for earning points' },
        { status: 400 }
      );
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Check if points already earned for this action (prevent duplicates)
      if (referenceId && referenceType) {
        const existingTransaction = await query(`
          SELECT id FROM points_transactions 
          WHERE user_id = $1 
          AND reference_id = $2 
          AND reference_type = $3 
          AND transaction_type = 'earned'
        `, [userId, referenceId, referenceType]);
        
        if (existingTransaction.rows.length > 0) {
          await query('ROLLBACK');
          return NextResponse.json(
            { error: 'Points already earned for this action' },
            { status: 400 }
          );
        }
      }
      
      // Add points to user balance
      await query(
        'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
        [rule.points, userId]
      );
      
      // Record points transaction
      await query(`
        INSERT INTO points_transactions (user_id, points_amount, transaction_type, description, reference_id, reference_type)
        VALUES ($1, $2, 'earned', $3, $4, $5)
      `, [userId, rule.points, rule.description, referenceId, referenceType]);
      
      // Get updated balance
      const balanceResult = await query(
        'SELECT points_balance FROM users WHERE id = $1',
        [userId]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `You earned ${rule.points} points!`,
        data: {
          pointsEarned: rule.points,
          totalBalance: balanceResult.rows[0].points_balance,
          action: action,
          description: rule.description
        }
      });
      
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error earning points:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
