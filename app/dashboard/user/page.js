// app/dashboard/user/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useAuth } from '../../../hooks/useAuth.js';
import { fetchWithAuth } from '../../../lib/api.js';

export default function UserDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [points, setPoints] = useState(0); // Real points balance
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Test SweetAlert availability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verify SweetAlert is loaded
      if (!window.Swal && !Swal) {
        console.error('SweetAlert2 is not available');
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && (!user || (user.account_type !== 'user' && user.account_type !== 'seller'))) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Fetch user data from API
  useEffect(() => {
    if (!loading && user) {
      fetchUserData();
    }
  }, [user, loading]);

  const fetchUserData = async () => {
    setDataLoading(true);
    setError(null);
    
    try {
      // Fetch orders, uploaded items, swaps, and points in parallel
      const [ordersRes, itemsRes, swapsRes, pointsRes] = await Promise.all([
        fetchWithAuth('/api/orders'),
        fetchWithAuth('/api/my-items'),
        fetchWithAuth('/api/swaps'),
        fetchWithAuth('/api/points')
      ]);

      setOrders(ordersRes.orders || []);
      setUploadedItems(itemsRes.items || []);
      setSwaps(swapsRes.swaps || []);
      setPoints(pointsRes.data?.pointsBalance || 0);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSwapResponse = async (swapId, action) => {
    try {
      const result = await fetchWithAuth(`/api/swaps/${swapId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (result.success) {
        Swal.fire({
          title: 'Success!',
          html: `
            <div class="text-left">
              <p class="mb-2">${result.message || `Swap request ${action}ed successfully`}</p>
              ${action === 'accept' ? `
                <div class="mt-4 p-3 bg-green-50 rounded-lg">
                  <p class="text-sm text-green-700 font-medium">🔄 Ownership Transfer Complete!</p>
                  <p class="text-xs text-green-600 mt-1">Check your "My Items" tab to see your new product</p>
                </div>
              ` : ''}
            </div>
          `,
          icon: 'success',
          confirmButtonColor: '#3085d6'
        });

        // Refresh swaps data and user items to show ownership changes
        fetchUserData();
      } else {
        throw new Error(result.error || 'Failed to update swap');
      }
    } catch (error) {
      console.error('Error responding to swap:', error);
      Swal.fire({
        title: 'Error',
        text: error.message || 'Failed to update swap',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleAcceptSwap = (swapId) => {
    Swal.fire({
      title: 'Accept Swap Request?',
      text: 'This will complete the swap exchange.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Accept',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSwapResponse(swapId, 'accept');
      }
    });
  };

  const handleDeclineSwap = (swapId) => {
    Swal.fire({
      title: 'Decline Swap Request?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Decline',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        handleSwapResponse(swapId, 'reject');
      }
    });
  };

  const handleEditItem = (itemId) => {
    // Redirect to edit item page
    router.push(`/edit-item/${itemId}`);
  };

  const handleRemoveItem = async (itemId, itemTitle) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to remove "${itemTitle}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg px-4 py-2',
        cancelButton: 'rounded-lg px-4 py-2'
      }
    });

    if (result.isConfirmed) {
      try {
        const response = await fetchWithAuth(`/api/products/${itemId}`, {
          method: 'DELETE'
        });

        if (response.success) {
          // Remove item from local state
          setUploadedItems(uploadedItems.filter(item => item.id !== itemId));
          
          Swal.fire({
            title: 'Removed!',
            text: response.message || 'Your item has been removed successfully.',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            customClass: {
              popup: 'rounded-2xl'
            }
          });
        } else {
          throw new Error(response.error || 'Failed to remove item');
        }
      } catch (error) {
        console.error('Error removing item:', error);
        
        // Check if it's a constraint error (409 status)
        const isConstraintError = error.message && error.message.includes('swap');
        
        let title = 'Error!';
        let text = error.message || 'Failed to remove item. Please try again.';
        
        if (isConstraintError) {
          title = 'Cannot Remove Item';
          // The error message from the backend already contains helpful information
          // about which swaps are preventing deletion
        }
        
        Swal.fire({
          title: title,
          text: text,
          icon: 'error',
          confirmButtonColor: '#3085d6',
          customClass: {
            popup: 'rounded-2xl',
            confirmButton: 'rounded-lg px-4 py-2'
          }
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-orange-100 text-orange-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'in transit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
      console.log('Starting logout process...');
      
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: 'You will be logged out of your account',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, logout',
        cancelButtonText: 'Cancel',
        allowOutsideClick: false,
        allowEscapeKey: true,
        customClass: {
          popup: 'rounded-2xl',
          confirmButton: 'rounded-lg px-4 py-2',
          cancelButton: 'rounded-lg px-4 py-2'
        }
      });

      console.log('SweetAlert result:', result);

      if (result.isConfirmed) {
        setIsLoggingOut(true);
        console.log('User confirmed logout, processing...');
        
        try {
          await logout();
          console.log('Logout successful, showing success message...');
          
          // Show success message and wait for it to complete
          await Swal.fire({
            title: 'Logged out successfully!',
            text: 'You have been logged out of your account',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            timerProgressBar: true,
            customClass: {
              popup: 'rounded-2xl'
            }
          });
          
          console.log('Success message shown, redirecting...');
          // Redirect after success message
          router.push('/');
        } catch (error) {
          console.error('Logout error:', error);
          setIsLoggingOut(false);
          
          await Swal.fire({
            title: 'Error!',
            text: 'Failed to logout. Please try again.',
            icon: 'error',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Try Again',
            customClass: {
              popup: 'rounded-2xl',
              confirmButton: 'rounded-lg px-4 py-2'
            }
          });
        }
      } else {
        console.log('User cancelled logout');
      }
    } catch (error) {
      console.error('SweetAlert error:', error);
      setIsLoggingOut(false);
      
      // Fallback to native confirm if SweetAlert fails
      const confirmed = confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          setIsLoggingOut(true);
          console.log('Using fallback logout...');
          await logout();
          router.push('/');
        } catch (logoutError) {
          console.error('Logout fallback error:', logoutError);
          setIsLoggingOut(false);
          alert('Failed to logout. Please refresh the page and try again.');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-green-600">
                ReWear
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-lg font-medium text-gray-700">User Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-gray-700">{user.name}</span>
              </div>
              <Link
                href="/"
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`font-medium transition-colors ${
                  isLoggingOut 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-red-600 hover:text-red-700'
                }`}
              >
                {isLoggingOut ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </span>
                ) : (
                  'Logout'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section with Points */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600">
                Manage your items, swaps, and account settings from your dashboard.
              </p>
            </div>
            <div className="text-right">
              <div className="bg-green-100 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium">ReWear Points</div>
                <div className="text-2xl font-bold text-green-700">{points}</div>
                <div className="text-xs text-green-600">Available to redeem</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('overview')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('my-items')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-items'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Items
              </button>
              <button
                onClick={() => setActiveTab('swaps')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'swaps'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Swaps
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orders'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
                <button
                  onClick={fetchUserData}
                  className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State */}
            {dataLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your data...</p>
              </div>
            )}

            {/* Tab Content (only show when not loading) */}
            {!dataLoading && (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Items Uploaded</p>
                        <p className="text-2xl font-bold text-green-700">{uploadedItems.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Active Swaps</p>
                        <p className="text-2xl font-bold text-blue-700">{swaps.filter(s => s.status === 'pending').length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Total Orders</p>
                        <p className="text-2xl font-bold text-purple-700">{orders.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">ReWear Points</p>
                        <p className="text-2xl font-bold text-orange-700">{points}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/add-item"
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add New Item</span>
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Browse Items</span>
                    </Link>
                    <button 
                      onClick={() => window.open('/redeem-points', '_blank')}
                      className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span>Redeem Points</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* My Items Tab */}
            {activeTab === 'my-items' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">My Items</h2>
                  <Link
                    href="/add-item"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add New Item
                  </Link>
                </div>
                
                {uploadedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items uploaded yet</h3>
                    <p className="text-gray-600 mb-4">Start by adding your first item to the marketplace</p>
                    <Link
                      href="/add-item"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Add Your First Item
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uploadedItems.map((item) => (
                      <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="w-full h-48 bg-gray-200 overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{item.category}</p>
                          <p className="text-lg font-bold text-green-600 mb-2">₹{item.price}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <span>Condition: {item.condition}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {item.views} views
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {item.likes} likes
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditItem(item.id)}
                              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleRemoveItem(item.id, item.title)}
                              className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Swaps Tab */}
            {activeTab === 'swaps' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Swaps</h2>
                
                {swaps.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No swaps yet</h3>
                    <p className="text-gray-600 mb-4">Browse items and request swaps to get started</p>
                    <Link
                      href="/"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Browse Items
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {swaps.map((swap) => (
                      <div key={swap.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              swap.requester_id === user.id ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {swap.requester_id === user.id ? 'Swap Request Sent' : 'Swap Request Received'}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {swap.created_at ? new Date(swap.created_at).toLocaleDateString() : 'Invalid Date'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              swap.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              swap.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {swap.status ? swap.status.charAt(0).toUpperCase() + swap.status.slice(1) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <strong>
                              {swap.requester_id === user.id ? 'Your Item:' : 'Offered Item:'}
                            </strong>&nbsp;{swap.offered_product_name || 'Unknown Item'}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="flex items-center">
                            <strong>
                              {swap.requester_id === user.id ? 'Requested Item:' : 'Your Item:'}
                            </strong>&nbsp;{swap.requested_product_name || 'Unknown Item'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>With: <strong>{swap.other_user_name || 'Unknown User'}</strong></span>
                        </div>
                        {swap.message && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Message:</span> {swap.message}
                          </div>
                        )}
                        {swap.status === 'pending' && swap.requester_id !== user.id && (
                          <div className="flex space-x-2 mt-4">
                            <button 
                              onClick={() => handleAcceptSwap(swap.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleDeclineSwap(swap.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                  <Link
                    href="/"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Shop More
                  </Link>
                </div>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to see your orders here</p>
                    <Link
                      href="/"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                              <Image
                                src={order.image}
                                alt={order.productTitle}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">{order.productTitle}</p>
                              <p className="text-xs text-gray-500">Sold by: {order.sellerName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{order.total}</p>
                            <p className="text-sm text-gray-600">{order.items} item{order.items > 1 ? 's' : ''}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {order.paymentMethod === 'points' ? '💰 Points' : order.paymentMethod}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {order.date}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => router.push(`/products/${order.productId}`)}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                              View Product
                            </button>
                            <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                              Order Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={user.name || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <input
                        type="text"
                        value={user.account_type || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 capitalize"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <input
                        type="text"
                        value={user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={user.phone || 'Not provided'}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        value={user.address || 'Not provided'}
                        readOnly
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Security</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Keep your account secure with these settings
                    </p>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Change Password
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Two-Factor Authentication
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Notifications</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage how you receive notifications
                    </p>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-600">Email notifications</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" defaultChecked />
                        <span className="ml-2 text-sm text-gray-600">Order updates</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="ml-2 text-sm text-gray-600">Marketing emails</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600 mb-4">
                      These actions cannot be undone
                    </p>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}