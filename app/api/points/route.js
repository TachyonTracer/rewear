// app/api/points/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '../../../lib/middleware.js';
import { query } from '../../../lib/db.js';

async function handleGET(request) {
  try {
    const userId = request.user.id;
    
    // Get user's current points balance
    const userResult = await query(
      'SELECT points_balance FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const pointsBalance = userResult.rows[0].points_balance || 0;
    
    // Get recent points transactions
    const transactionsResult = await query(`
      SELECT 
        id,
        points_amount,
        transaction_type,
        description,
        created_at
      FROM points_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 20
    `, [userId]);
    
    // Get available redemption options
    const redemptionsResult = await query(`
      SELECT 
        id,
        title,
        description,
        points_required,
        reward_type,
        reward_value,
        max_redemptions_per_user,
        total_available,
        total_redeemed
      FROM redemption_options 
      WHERE is_active = true 
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
      AND (total_available IS NULL OR total_redeemed < total_available)
      ORDER BY points_required ASC
    `);
    
    // Get user's active redemptions
    const userRedemptionsResult = await query(`
      SELECT 
        ur.id,
        ur.reward_code,
        ur.points_used,
        ur.is_used,
        ur.expires_at,
        ur.created_at,
        ro.title,
        ro.description,
        ro.reward_type,
        ro.reward_value
      FROM user_redemptions ur
      JOIN redemption_options ro ON ur.redemption_option_id = ro.id
      WHERE ur.user_id = $1 
      AND ur.is_used = false
      AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
      ORDER BY ur.created_at DESC
    `, [userId]);
    
    return NextResponse.json({
      success: true,
      data: {
        pointsBalance,
        transactions: transactionsResult.rows,
        availableRedemptions: redemptionsResult.rows,
        activeRedemptions: userRedemptionsResult.rows
      }
    });
    
  } catch (error) {
    console.error('Error fetching points data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
