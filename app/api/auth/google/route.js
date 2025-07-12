'use server';

import { NextResponse } from 'next/server';
import { createJWT } from '../../../../lib/auth.js';
import { pool } from '../../../../lib/db.js';
import { google } from 'googleapis';

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

// Generate Google OAuth2 URL
export async function GET() {
  try {
    // Generate Google authentication URL
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    // Redirect to Google authentication
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google authentication' }, { status: 500 });
  }
}
