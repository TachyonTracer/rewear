'use server';

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createJWT } from '../../../../../lib/auth.js';
import { pool } from '../../../../../lib/db.js';

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
);

export async function GET(request) {
  try {
    // Get authorization code from query
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return generateErrorResponse('Authorization code not provided');
    }

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info using the access token
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });
    
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      return generateErrorResponse('Email not provided by Google');
    }

    // Check if user exists in database
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user exists by email
      const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
      const existingUserResult = await client.query(existingUserQuery, [data.email]);
      
      let user;
      
      if (existingUserResult.rows.length === 0) {
        // User doesn't exist, create a new user
        const createUserQuery = `
          INSERT INTO users (
            email, 
            first_name, 
            last_name, 
            password_hash, 
            account_type, 
            google_id,
            profile_image
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING *
        `;
        
        // Generate a random secure password for Google users
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = 'google_auth_user'; // Since they log in with Google, we don't need a real password
        
        const createUserValues = [
          data.email,
          data.given_name || 'Google',
          data.family_name || 'User',
          hashedPassword,
          'user', // Default account type
          data.id,
          data.picture || null
        ];
        
        const newUserResult = await client.query(createUserQuery, createUserValues);
        user = newUserResult.rows[0];
      } else {
        // User exists, update Google ID if needed
        user = existingUserResult.rows[0];
        
        // Update Google ID if it's not set
        if (!user.google_id) {
          const updateUserQuery = `
            UPDATE users 
            SET google_id = $1,
                profile_image = COALESCE(profile_image, $2)
            WHERE id = $3
            RETURNING *
          `;
          
          const updateResult = await client.query(updateUserQuery, [
            data.id,
            data.picture || null,
            user.id
          ]);
          
          user = updateResult.rows[0];
        }
      }
      
      await client.query('COMMIT');
      
      // Generate JWT token
      const token = await createJWT(user);
      
      // Remove sensitive information
      delete user.password_hash;

      // Ensure first_name and last_name are present
      if ((!user.first_name || user.first_name === '') && user.name) {
        const parts = user.name.split(' ');
        user.first_name = parts[0] || '';
        user.last_name = parts.slice(1).join(' ') || '';
      }
      user.first_name = user.first_name || '';
      user.last_name = user.last_name || '';
      user.email = user.email || '';

      // Debug log
      console.log('Google user for JWT:', user);
      
      // Create HTML response that will send a message to the parent window and close itself
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0fff4;
              text-align: center;
              padding: 20px;
              color: #064e3b;
            }
            .container {
              background-color: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              margin: 0 auto;
            }
            h2 {
              color: #059669;
            }
            .success-icon {
              width: 60px;
              height: 60px;
              margin: 20px auto;
              border-radius: 50%;
              background-color: #10b981;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .success-icon svg {
              width: 30px;
              height: 30px;
              color: white;
            }
          </style>
          <script>
            window.onload = function() {
              // Send message to parent window
              window.opener.postMessage({
                token: "${token}",
                user: ${JSON.stringify(user)}
              }, "${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}");
              
              // Close this window after a short delay
              setTimeout(function() {
                window.close();
              }, 2000);
            };
          </script>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2>Authentication Successful!</h2>
            <p>You are now signed in with Google. This window will close automatically.</p>
          </div>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        }
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database error during Google auth:', error);
      return generateErrorResponse('Authentication failed');
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Google auth callback error:', error);
    return generateErrorResponse('Authentication failed');
  }
}

// Helper function to generate error response
function generateErrorResponse(message, status = 400) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Failed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #fff5f5;
          text-align: center;
          padding: 20px;
          color: #7f1d1d;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          margin: 0 auto;
        }
        h2 {
          color: #e11d48;
        }
        .error-icon {
          width: 60px;
          height: 60px;
          margin: 20px auto;
          border-radius: 50%;
          background-color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .error-icon svg {
          width: 30px;
          height: 30px;
          color: white;
        }
      </style>
      <script>
        window.onload = function() {
          // Send error message to parent window
          if (window.opener) {
            window.opener.postMessage({
              error: "${message}"
            }, "${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}");
          }
          
          // Close this window after a short delay
          setTimeout(function() {
            window.close();
          }, 3000);
        };
      </script>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2>Authentication Failed</h2>
        <p>${message}</p>
        <p>This window will close automatically.</p>
      </div>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    status,
    headers: {
      'Content-Type': 'text/html',
    }
  });
}
