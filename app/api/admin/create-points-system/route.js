// app/api/admin/create-points-system/route.js
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';

export async function POST(request) {
  try {
    console.log('Creating points system tables...');
    
    // Create points transactions table
    const createPointsTransactionsSQL = `
      CREATE TABLE IF NOT EXISTS points_transactions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        points_amount INT NOT NULL,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'bonus', 'refund')),
        description VARCHAR(255) NOT NULL,
        reference_id INT,
        reference_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `;
    
    await query(createPointsTransactionsSQL);
    console.log('Points transactions table created/verified');
    
    // Create redemption options table
    const createRedemptionOptionsSQL = `
      CREATE TABLE IF NOT EXISTS redemption_options (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        points_required INT NOT NULL,
        reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('discount', 'free_shipping', 'voucher', 'physical_reward')),
        reward_value DECIMAL(10, 2),
        reward_code VARCHAR(100),
        max_redemptions_per_user INT DEFAULT NULL,
        total_available INT DEFAULT NULL,
        total_redeemed INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await query(createRedemptionOptionsSQL);
    console.log('Redemption options table created/verified');
    
    // Create user redemptions table
    const createUserRedemptionsSQL = `
      CREATE TABLE IF NOT EXISTS user_redemptions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        redemption_option_id INT NOT NULL,
        points_used INT NOT NULL,
        reward_code VARCHAR(100),
        is_used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP DEFAULT NULL,
        expires_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (redemption_option_id) REFERENCES redemption_options(id) ON DELETE CASCADE
      )
    `;
    
    await query(createUserRedemptionsSQL);
    console.log('User redemptions table created/verified');
    
    // Add points balance column to users table
    const addPointsBalanceSQL = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0
    `;
    
    await query(addPointsBalanceSQL);
    console.log('Points balance column added to users table');
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(transaction_type)',
      'CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_redemption_options_active ON redemption_options(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_redemption_options_points ON redemption_options(points_required)',
      'CREATE INDEX IF NOT EXISTS idx_user_redemptions_user ON user_redemptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_redemptions_used ON user_redemptions(is_used)',
      'CREATE INDEX IF NOT EXISTS idx_users_points_balance ON users(points_balance)'
    ];
    
    for (const indexSQL of indexes) {
      await query(indexSQL);
      console.log('Index created/verified');
    }
    
    // Insert default redemption options
    const defaultRedemptions = [
      {
        title: '10% Off Next Purchase',
        description: 'Get 10% discount on your next item purchase',
        points_required: 100,
        reward_type: 'discount',
        reward_value: 10.00
      },
      {
        title: '20% Off Next Purchase',
        description: 'Get 20% discount on your next item purchase',
        points_required: 200,
        reward_type: 'discount',
        reward_value: 20.00
      },
      {
        title: 'Free Shipping',
        description: 'Free shipping on your next order',
        points_required: 50,
        reward_type: 'free_shipping',
        reward_value: 0.00
      },
      {
        title: '₹500 ReWear Voucher',
        description: 'Get ₹500 credit to spend on any item',
        points_required: 250,
        reward_type: 'voucher',
        reward_value: 500.00
      },
      {
        title: '₹1000 ReWear Voucher',
        description: 'Get ₹1000 credit to spend on any item',
        points_required: 500,
        reward_type: 'voucher',
        reward_value: 1000.00
      },
      {
        title: '50% Off Next Purchase',
        description: 'Get 50% discount on your next item purchase (Premium Reward)',
        points_required: 750,
        reward_type: 'discount',
        reward_value: 50.00
      }
    ];
    
    for (const redemption of defaultRedemptions) {
      await query(`
        INSERT INTO redemption_options (title, description, points_required, reward_type, reward_value)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [redemption.title, redemption.description, redemption.points_required, redemption.reward_type, redemption.reward_value]);
    }
    
    console.log('Default redemption options inserted');
    
    return NextResponse.json({
      success: true,
      message: 'Points system tables and default data created successfully'
    });
    
  } catch (error) {
    console.error('Error creating points system:', error);
    return NextResponse.json(
      { error: 'Failed to create points system', details: error.message },
      { status: 500 }
    );
  }
}
