// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '../../../../lib/auth.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Authenticate user
    const user = await authenticateUser(email, password);
    
    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    });
    
    // Create response
    const response = NextResponse.json({
      message: 'Login successful',
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
        profile_image: user.profile_image
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
    console.error('Login error:', error);
    
    if (error.message === 'Invalid email or password' || error.message === 'Invalid credentials') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
