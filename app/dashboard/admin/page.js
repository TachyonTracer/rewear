'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../../hooks/useAuth.js';

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!loading && (!user || user.account_type !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Mock data for admin overview
  useEffect(() => {
    const mockStats = {
      totalUsers: 1250,
      totalSellers: 85,
      totalProducts: 340,
      totalOrders: 125,
      revenue: '₹45,600',
      growth: '+12.5%'
    };
    setStats(mockStats);

    const mockUsers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        type: 'user',
        status: 'Active',
        joinDate: '2025-01-10',
        orders: 5
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        type: 'seller',
        status: 'Active',
        joinDate: '2025-01-08',
        listings: 12
      },
      {
        id: 3,
        name: 'Bob Wilson',
        email: 'bob@example.com',
        type: 'user',
        status: 'Suspended',
        joinDate: '2025-01-05',
        orders: 2
      }
    ];
    setUsers(mockUsers);

    const mockProducts = [
      {
        id: 1,
        title: 'Vintage Denim Jacket',
        seller: 'Jane Smith',
        price: '₹1,200',
        status: 'Active',
        category: 'Jackets',
        image: 'https://placehold.co/100x100/6B8E23/ffffff?text=Denim',
        dateAdded: '2025-01-08'
      },
      {
        id: 2,
        title: 'Summer Floral Dress',
        seller: 'Sarah Johnson',
        price: '₹650',
        status: 'Pending Review',
        category: 'Dresses',
        image: 'https://placehold.co/100x100/8FBC8F/ffffff?text=Dress',
        dateAdded: '2025-01-10'
      }
    ];
    setProducts(mockProducts);
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
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      case 'Pending Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'seller': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-green-600">
                ReWear
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-lg font-medium text-gray-700">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="text-gray-700">{user.name}</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  Admin
                </span>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Control Center
          </h1>
          <p className="text-gray-600">
            Manage users, products, and system settings for the ReWear platform.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600">{stats.growth}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sellers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
                <p className="text-sm text-green-600">+8 this week</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-sm text-green-600">+25 today</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.revenue}</p>
                <p className="text-sm text-green-600">This month</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
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
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'users'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Product Management
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'reports'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reports
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                System Settings
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">New user registered: John Doe</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Product approved: Vintage Denim Jacket</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Product pending review: Summer Dress</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Review Pending Products
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Generate Revenue Report
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Send Platform Newsletter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    />
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Search
                    </button>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Join Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.type)}`}>
                              {user.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.joinDate}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-green-600 hover:text-green-900 mr-3">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Suspend
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Product Management</h2>
                  <div className="flex space-x-2">
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>All Categories</option>
                      <option>Jackets</option>
                      <option>Dresses</option>
                      <option>T-Shirts</option>
                    </select>
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Pending Review</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                        <Image
                          src={product.image}
                          alt={product.title}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{product.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {product.seller}</p>
                      <p className="text-lg font-bold text-green-600 mb-2">{product.price}</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                        <span className="text-xs text-gray-500">{product.dateAdded}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                          Approve
                        </button>
                        <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm">
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
                
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Reports Coming Soon</h3>
                  <p className="text-gray-600">
                    Get detailed insights about platform performance, user behavior, and financial analytics.
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Platform Configuration</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage platform-wide settings and configurations
                    </p>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Site Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Payment Gateway Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Email Templates
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Security & Compliance</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage security settings and compliance features
                    </p>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Security Policies
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Data Privacy Settings
                      </button>
                      <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                        Audit Logs
                      </button>
                    </div>
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
