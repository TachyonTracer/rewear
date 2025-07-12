import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db.js';
import { withAuth } from '../../../../lib/middleware.js';

async function handlePOST(request) {
  try {
    const body = await request.json();
    const { productId, paymentMethod, pointsUsed } = body;
    const userId = request.user.id;

    // Processing purchase with ownership transfer
    console.log('Processing purchase:', { productId, paymentMethod, pointsUsed, userId });

    // Validate required fields
    if (!productId || !paymentMethod) {
      return NextResponse.json(
        { error: 'Product ID and payment method are required' },
        { status: 400 }
      );
    }

    // Get product details
    const productResult = await query(
      'SELECT * FROM products WHERE id = $1 AND status = $2',
      [productId, 'active']
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      );
    }

    const product = productResult.rows[0];
    console.log('Product found:', { id: product.id, title: product.title, price: product.price });
    
    // Check if user is trying to buy their own product
    if (product.seller_id === userId) {
      return NextResponse.json(
        { error: 'You cannot purchase your own product' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'points') {
      // Validate points payment
      if (!pointsUsed || pointsUsed <= 0) {
        return NextResponse.json(
          { error: 'Invalid points amount' },
          { status: 400 }
        );
      }

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

      const userPoints = userResult.rows[0].points_balance || 0;
      const pointsNeeded = Math.ceil(product.price);

      // Check if user has enough points
      if (userPoints < pointsNeeded) {
        return NextResponse.json(
          { error: `Insufficient points. You need ${pointsNeeded} points but only have ${userPoints}` },
          { status: 400 }
        );
      }

      // Check if provided points match required points
      if (pointsUsed !== pointsNeeded) {
        return NextResponse.json(
          { error: `Points mismatch. Required: ${pointsNeeded}, Provided: ${pointsUsed}` },
          { status: 400 }
        );
      }

      // Start transaction
      await query('BEGIN');

      try {
        console.log('🔄 Starting transaction for points purchase...');

        // Transfer product ownership from seller to buyer FIRST
        console.log(`📝 Transferring ownership: Product ${productId} from user ${product.seller_id} to user ${userId}`);
        
        const ownershipResult = await query(
          'UPDATE products SET seller_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING seller_id, updated_at',
          [userId, productId]
        );

        if (ownershipResult.rows.length === 0) {
          throw new Error('Failed to transfer product ownership');
        }

        console.log(`✅ Ownership transferred successfully:`, ownershipResult.rows[0]);
        console.log(`🎉 Product ${productId} now owned by user ${userId} (previously owned by ${product.seller_id})`);

        // Create the order/purchase record
        console.log('💾 Creating order record...');
        const orderResult = await query(`
          INSERT INTO orders (
            buyer_id, 
            seller_id, 
            product_id, 
            total_amount, 
            payment_method, 
            status,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING id
        `, [
          userId,
          product.seller_id,
          productId,
          product.price,
          'points',
          'paid'
        ]);

        const orderId = orderResult.rows[0].id;
        console.log(`✅ Order created with ID: ${orderId}`);

        // Deduct points from buyer
        console.log(`💰 Deducting ${pointsUsed} points from user ${userId}...`);
        await query(
          'UPDATE users SET points_balance = points_balance - $1 WHERE id = $2',
          [pointsUsed, userId]
        );

        // Add points transaction record
        await query(`
          INSERT INTO points_transactions (
            user_id, 
            points_amount, 
            transaction_type, 
            description, 
            reference_id, 
            reference_type,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
          userId,
          -pointsUsed,
          'redeemed',
          `Purchased: ${product.title}`,
          orderId,
          'purchase'
        ]);

        // Award points to seller (optional - 10% of product price)
        const sellerPoints = Math.ceil(product.price * 0.1);
        await query(
          'UPDATE users SET points_balance = points_balance + $1 WHERE id = $2',
          [sellerPoints, product.seller_id]
        );

        // Add seller points transaction
        await query(`
          INSERT INTO points_transactions (
            user_id, 
            points_amount, 
            transaction_type, 
            description, 
            reference_id, 
            reference_type,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        `, [
          product.seller_id,
          sellerPoints,
          'earned',
          `Sale bonus: ${product.title}`,
          orderId,
          'sale'
        ]);

        // Commit transaction
        console.log('💾 Committing transaction...');
        await query('COMMIT');

        return NextResponse.json({
          success: true,
          message: 'Purchase completed successfully! You now own this product.',
          data: {
            orderId: orderId,
            pointsUsed: pointsUsed,
            remainingPoints: userPoints - pointsUsed,
            sellerPointsAwarded: sellerPoints,
            productTitle: product.title,
            ownershipTransferred: true
          }
        });

      } catch (error) {
        // Rollback transaction on error
        await query('ROLLBACK');
        throw error;
      }

    } else {
      return NextResponse.json(
        { error: 'Unsupported payment method' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error processing purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handlePOST);
