import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request) {
  try {
    console.log('Creating swaps table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS swaps (
        id SERIAL PRIMARY KEY,
        requester_id INT NOT NULL,
        requester_product_id INT NOT NULL,
        target_user_id INT NOT NULL,
        target_product_id INT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (requester_product_id) REFERENCES products(id),
        FOREIGN KEY (target_user_id) REFERENCES users(id),
        FOREIGN KEY (target_product_id) REFERENCES products(id)
      )
    `;
    
    await query(createTableSQL);
    console.log('Swaps table created/verified');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_swaps_requester ON swaps(requester_id)',
      'CREATE INDEX IF NOT EXISTS idx_swaps_target_user ON swaps(target_user_id)',
      'CREATE INDEX IF NOT EXISTS idx_swaps_status ON swaps(status)',
      'CREATE INDEX IF NOT EXISTS idx_swaps_created_at ON swaps(created_at)'
    ];
    
    for (const indexSQL of indexes) {
      await query(indexSQL);
      console.log('Index created/verified');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Swaps table and indexes created successfully'
    });
    
  } catch (error) {
    console.error('Error creating swaps table:', error);
    return NextResponse.json(
      { error: 'Failed to create swaps table', details: error.message },
      { status: 500 }
    );
  }
}
