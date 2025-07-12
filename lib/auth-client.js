// lib/auth-client.js
'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class AuthClient {
  constructor() {
    this.token = null;
    this.user = null;
    
    // Initialize token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }
  
  // Set authorization header
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` })
    };
  }
  
  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store token and user
      this.token = data.token;
      this.user = data.user;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  // Login user
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      // Store token and user
      this.token = data.token;
      this.user = data.user;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  // Login with Google
  async loginWithGoogle() {
    try {
      // Open Google Auth popup window
      const googleAuthUrl = `${API_BASE_URL}/api/auth/google`;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;
      
      const popup = window.open(
        googleAuthUrl,
        'googleAuthPopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );
      
      if (!popup) {
        throw new Error('Failed to open Google login popup. Please disable popup blocker and try again.');
      }

      // Listen for messages from the popup
      return new Promise((resolve, reject) => {
        const handleMessage = async (event) => {
          // Ensure the message is from our domain
          if (event.origin !== window.location.origin) return;
          
          // Remove event listener to avoid memory leaks
          window.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
            return;
          }
          
          if (!event.data.token || !event.data.user) {
            reject(new Error('Invalid response from Google authentication'));
            return;
          }
          
          // Store token and user
          this.token = event.data.token;
          this.user = event.data.user;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
          }
          
          resolve({ token: this.token, user: this.user });
        };
        
        window.addEventListener('message', handleMessage);
        
        // Check if popup was closed before completing auth
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            reject(new Error('Authentication was canceled'));
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }
  
  // Logout user
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      
      // Clear token and user
      this.token = null;
      this.user = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if API call fails
      this.token = null;
      this.user = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }
  
  // Get current user
  async getCurrentUser() {
    try {
      if (!this.token) {
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it
          this.logout();
          return null;
        }
        throw new Error(data.error || 'Failed to get user');
      }
      
      this.user = data.user;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      
      return this.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }
      
      this.user = data.user;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(this.user));
      }
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Password change failed');
      }
      
      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
  
  // Get user info
  getUser() {
    return this.user;
  }
  
  // Initialize from storage (call this on app start)
  initializeFromStorage() {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken) {
        this.token = storedToken;
      }
      
      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      }
    }
  }
}

// Create singleton instance
const authClient = new AuthClient();
export default authClient;
