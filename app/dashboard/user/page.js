// app/dashboard/user/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../../hooks/useAuth.js';

export default function UserDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [uploadedItems, setUploadedItems] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [points, setPoints] = useState(250); // Mock points balance

  useEffect(() => {
    if (!loading && (!user || user.account_type !== 'user')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Mock data for user orders
  useEffect(() => {
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        date: '2025-01-10',
        total: '₹1,550',
        status: 'Delivered',
        items: 2,
        image: 'https://placehold.co/100x100/6B8E23/ffffff?text=Denim'
      },
      {
        id: 2,
        orderNumber: 'ORD-002',
        date: '2025-01-08',
        total: '₹850',
        status: 'In Transit',
        items: 1,
        image: 'https://placehold.co/100x100/8FBC8F/ffffff?text=Dress'
      },
      {
        id: 3,
        orderNumber: 'ORD-003',
        date: '2025-01-05',
        total: '₹300',
        status: 'Processing',
        items: 1,
        image: 'https://placehold.co/100x100/9ACD32/ffffff?text=Tee'
      }
    ];
    setOrders(mockOrders);

    // Mock uploaded items
    const mockUploadedItems = [
      {
        id: 1,
        title: 'Vintage Denim Jacket',
        category: 'Jackets',
        price: '₹1,200',
        condition: 'Very Good',
        status: 'Available',
        views: 45,
        likes: 12,
        image: 'https://placehold.co/100x100/4169E1/ffffff?text=Jacket'
      },
      {
        id: 2,
        title: 'Cotton Summer Dress',
        category: 'Dresses',
        price: '₹800',
        condition: 'Good',
        status: 'Available',
        views: 23,
        likes: 8,
        image: 'https://placehold.co/100x100/FFB6C1/ffffff?text=Dress'
      }
    ];
    setUploadedItems(mockUploadedItems);

    // Mock swaps
    const mockSwaps = [
      {
        id: 1,
        itemOffered: 'Blue Jeans',
        itemRequested: 'Black Hoodie',
        otherUser: 'Sarah M.',
        status: 'Pending',
        date: '2025-01-12',
        type: 'outgoing'
      },
      {
        id: 2,
        itemOffered: 'White Sneakers',
        itemRequested: 'Red Dress',
        otherUser: 'Mike K.',
        status: 'Completed',
        date: '2025-01-08',
        type: 'incoming'
      }
    ];
    setSwaps(mockSwaps);
  }, []);

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
    switch (status) {
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
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
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
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
                        <p className="text-2xl font-bold text-blue-700">{swaps.filter(s => s.status === 'Pending').length}</p>
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
                    <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors">
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
                          <p className="text-lg font-bold text-green-600 mb-2">{item.price}</p>
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
                            <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                              Edit
                            </button>
                            <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
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
                              swap.type === 'outgoing' ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {swap.type === 'outgoing' ? 'Swap Request Sent' : 'Swap Request Received'}
                              </h3>
                              <p className="text-sm text-gray-600">{swap.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              swap.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              swap.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {swap.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <strong>Your Item:</strong>&nbsp;{swap.itemOffered}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span className="flex items-center">
                            <strong>Their Item:</strong>&nbsp;{swap.itemRequested}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span>With: <strong>{swap.otherUser}</strong></span>
                        </div>
                        {swap.status === 'Pending' && (
                          <div className="flex space-x-2 mt-4">
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                              Accept
                            </button>
                            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                              Decline
                            </button>
                            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm">
                              Message
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
                                alt={`Order ${order.orderNumber}`}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">{order.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{order.total}</p>
                            <p className="text-sm text-gray-600">{order.items} item{order.items > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <button className="text-green-600 hover:text-green-700 font-medium text-sm">
                            View Details
                          </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}