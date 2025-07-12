// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { createUser, generateToken } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, address, city, state, type } = body;
    
    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Create user
    const user = await createUser({
      email,
      password,
      name,
      phone,
      address,
      city,
      state,
      type: type || 'user'
    });
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    });
    
    // Create response
    const response = NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        account_type: user.type, // Map 'type' to 'account_type' for frontend consistency
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      token
    });
    
    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message === 'User already exists with this email') {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
