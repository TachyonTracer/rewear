// app/api/users/profile/route.js
import { NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/middleware.js';
import { updateUserProfile } from '../../../../lib/auth.js';

async function handleGET(request) {
  try {
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
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePUT(request) {
  try {
    const body = await request.json();
    const { name, phone, address, city, state, profile_image } = body;
    
    // Update user profile
    const updatedUser = await updateUserProfile(request.user.id, {
      name,
      phone,
      address,
      city,
      state,
      profile_image
    });
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGET);
export const PUT = withAuth(handlePUT);
