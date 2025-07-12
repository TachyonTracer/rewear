// app/api/points/redeem/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/middleware.js';
import { query } from '../../../../lib/db.js';

async function handlePOST(request) {
  try {
    const userId = request.user.id;
    const { redemptionOptionId } = await request.json();
    
    if (!redemptionOptionId) {
      return NextResponse.json(
        { error: 'Redemption option ID is required' },
        { status: 400 }
      );
    }
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Get user's current points balance
      const userResult = await query(
        'SELECT points_balance FROM users WHERE id = $1 FOR UPDATE',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const currentPoints = userResult.rows[0].points_balance || 0;
      
      // Get redemption option details
      const redemptionResult = await query(`
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
        WHERE id = $1 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        FOR UPDATE
      `, [redemptionOptionId]);
      
      if (redemptionResult.rows.length === 0) {
        throw new Error('Redemption option not found or not available');
      }
      
      const redemption = redemptionResult.rows[0];
      
      // Check if user has enough points
      if (currentPoints < redemption.points_required) {
        throw new Error(`Insufficient points. You need ${redemption.points_required} points but only have ${currentPoints}`);
      }
      
      // Check if total redemptions limit reached
      if (redemption.total_available && redemption.total_redeemed >= redemption.total_available) {
        throw new Error('This reward is no longer available');
      }
      
      // Check user-specific redemption limit
      if (redemption.max_redemptions_per_user) {
        const userRedemptionCountResult = await query(
          'SELECT COUNT(*) as count FROM user_redemptions WHERE user_id = $1 AND redemption_option_id = $2',
          [userId, redemptionOptionId]
        );
        
        const userRedemptionCount = parseInt(userRedemptionCountResult.rows[0].count);
        if (userRedemptionCount >= redemption.max_redemptions_per_user) {
          throw new Error('You have reached the maximum number of redemptions for this reward');
        }
      }
      
      // Generate reward code
      const rewardCode = generateRewardCode(redemption.reward_type);
      
      // Calculate expiry date (30 days from now for most rewards)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      // Deduct points from user
      await query(
        'UPDATE users SET points_balance = points_balance - $1 WHERE id = $2',
        [redemption.points_required, userId]
      );
      
      // Record points transaction
      await query(`
        INSERT INTO points_transactions (user_id, points_amount, transaction_type, description, reference_id, reference_type)
        VALUES ($1, $2, 'redeemed', $3, $4, 'redemption')
      `, [userId, -redemption.points_required, `Redeemed: ${redemption.title}`, redemptionOptionId]);
      
      // Create user redemption record
      const userRedemptionResult = await query(`
        INSERT INTO user_redemptions (user_id, redemption_option_id, points_used, reward_code, expires_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, reward_code, expires_at, created_at
      `, [userId, redemptionOptionId, redemption.points_required, rewardCode, expiresAt]);
      
      // Update total redeemed count
      await query(
        'UPDATE redemption_options SET total_redeemed = total_redeemed + 1 WHERE id = $1',
        [redemptionOptionId]
      );
      
      // Commit transaction
      await query('COMMIT');
      
      const userRedemption = userRedemptionResult.rows[0];
      
      return NextResponse.json({
        success: true,
        message: 'Reward redeemed successfully!',
        data: {
          redemptionId: userRedemption.id,
          rewardCode: userRedemption.reward_code,
          pointsUsed: redemption.points_required,
          expiresAt: userRedemption.expires_at,
          rewardTitle: redemption.title,
          rewardType: redemption.reward_type,
          rewardValue: redemption.reward_value
        }
      });
      
    } catch (error) {
      // Rollback transaction
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error redeeming points:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRewardCode(rewardType) {
  const prefix = {
    'discount': 'DISC',
    'free_shipping': 'SHIP',
    'voucher': 'VOUCH',
    'physical_reward': 'GIFT'
  }[rewardType] || 'REWARD';
  
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  
  return `${prefix}${randomPart}${timestamp}`;
}

export const POST = withAuth(handlePOST);
