// lib/middleware.js
import { verifyToken, getUserById } from './auth.js';

export function withAuth(handler) {
  return async (req, res) => {
    try {
      // For Next.js 13+ App Router, we need to handle the Request object differently
      let token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        // Try to get from cookies
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => c.split('='))
          );
          token = cookies.token;
        }
      }
      
      if (!token) {
        return new Response(JSON.stringify({ 
          error: 'Access denied. No token provided.' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Verify token
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return new Response(JSON.stringify({ 
          error: 'Invalid token.' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get user from database
      const user = await getUserById(decoded.userId);
      
      if (!user) {
        return new Response(JSON.stringify({ 
          error: 'User not found.' 
        }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Add user to request object
      req.user = user;
      
      return await handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

export function withOptionalAuth(handler) {
  return async (req, res) => {
    try {
      // Get token from Authorization header or cookies
      let token = req.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!token) {
        // Try to get from cookies
        const cookieHeader = req.headers.get('cookie');
        if (cookieHeader) {
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => c.split('='))
          );
          token = cookies.token;
        }
      }
      
      if (token) {
        // Verify token
        const decoded = verifyToken(token);
        
        if (decoded) {
          // Get user from database
          const user = await getUserById(decoded.userId);
          
          if (user) {
            req.user = user;
          }
        }
      }
      
      return await handler(req, res);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Continue without authentication
      return await handler(req, res);
    }
  };
}

export function withRoleAuth(roles) {
  return function(handler) {
    return withAuth(async (req, res) => {
      if (!roles.includes(req.user.type)) {
        return new Response(JSON.stringify({ 
          error: 'Access denied. Insufficient permissions.' 
        }), { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return await handler(req, res);
    });
  };
}
