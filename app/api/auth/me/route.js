// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/middleware.js';

async function handler(request) {
  try {
    // User is already attached to the request by the middleware
    return NextResponse.json({
      user: {
        id: request.user.id,
        email: request.user.email,
        name: request.user.name,
        phone: request.user.phone,
        address: request.user.address,
        city: request.user.city,
        state: request.user.state,
        type: request.user.type,
        is_verified: request.user.is_verified,
        profile_image: request.user.profile_image,
        created_at: request.user.created_at
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
