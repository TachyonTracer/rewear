'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../hooks/useAuth.js";
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AboutPage from '../components/about.js';
import ContactForm  from '../components/contact.js';
import authClient from '../lib/auth-client.js';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [liveProductCount, setLiveProductCount] = useState(null);

  // Get appropriate dashboard path based on user account type
  const getDashboardPath = () => {
    if (!user) return '/dashboard/user';
    
    const dashboardRoutes = {
      admin: '/dashboard/admin',
      user: '/dashboard/user'
    };
    
    return dashboardRoutes[user.account_type] || '/dashboard/user';
  };

  // Handle logout with SweetAlert
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    try {
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

      if (result.isConfirmed) {
        setIsLoggingOut(true);
        
        try {
          await logout();
          
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
      }
    } catch (error) {
      console.error('SweetAlert error:', error);
      setIsLoggingOut(false);
      
      // Fallback to native confirm if SweetAlert fails
      const confirmed = confirm('Are you sure you want to logout?');
      if (confirmed) {
        try {
          setIsLoggingOut(true);
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

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(['All', ...data.categories.map(cat => cat.name)]);
        } else {
          // Fallback to mock categories
          setCategories(['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear']);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fallback to mock categories
        setCategories(['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear']);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          limit: '20',
          page: '1'
        });
        
        if (activeCategory !== 'All') {
          params.append('category', activeCategory);
        }
        
        if (debouncedSearchTerm) {
          params.append('search', debouncedSearchTerm);
        }

        const response = await fetch(`/api/products?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        
        if (data.products) {
          // Format products for display
          const formattedProducts = data.products.map(product => ({
            id: product.id,
            name: product.title,
            title: product.title,
            price: `₹${product.price}`,
            originalPrice: product.original_price ? `₹${product.original_price}` : null,
            image: product.image_urls && product.image_urls.length > 0 
              ? product.image_urls[0] 
              : `https://placehold.co/400x300/6B8E23/ffffff?text=${encodeURIComponent(product.title)}`,
            category: product.category_name,
            description: product.description || 'No description available',
            seller: product.seller_name,
            condition: product.condition_rating,
            size: product.size,
            color: product.color,
            views: product.views_count,
            likes: product.likes_count,
            isNegotiable: product.is_negotiable,
            createdAt: product.created_at,
            // Additional display properties
            isNew: (Date.now() - new Date(product.created_at).getTime()) < (7 * 24 * 60 * 60 * 1000),
            discount: product.original_price && product.original_price > product.price 
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : null
          }));
          
          setProducts(formattedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, debouncedSearchTerm]);

  // Live product count polling
  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        let headers = {};
        authClient.initializeFromStorage();
        if (authClient.isAuthenticated()) {
          headers = { 'Authorization': `Bearer ${authClient.token}` };
        }
        const res = await fetch('/api/products?limit=1', { headers });
        if (!res.ok) throw new Error('Failed to fetch product count');
        const data = await res.json();
        if (isMounted) setLiveProductCount(data.pagination?.total || 0);
      } catch {
        if (isMounted) setLiveProductCount(null);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  // No need for client-side filtering since API handles it
  const filteredProducts = products;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                ReWear
              </Link>
              
              {/* Enhanced Search Bar */}
              <div className="hidden md:flex relative">
                <div className="relative w-80 lg:w-96">
                  <input
                    type="text"
                    placeholder="Search sustainable fashion..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-700">Welcome back!</p>
                    <p className="text-xs text-gray-500">{user.name}</p>
                  </div>
                  
                  <Link 
                    href={getDashboardPath()}
                    className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-4 py-2 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg"
                  >
                    Dashboard
                  </Link>
                  
                  <Link 
                    href="/add-item"
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Add Item
                  </Link>
                  
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50"
                    title="Logout"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-2 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 min-h-[85vh] flex items-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
          </div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                <div className="mb-8">
                  <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                    <span className="text-green-400 text-sm font-medium">🌱 Sustainable Fashion</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                    Give Your Clothes a
                    <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      Second Life
                    </span>
                  </h1>
                  <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl">
                    Join thousands of fashion-conscious individuals who are making a difference. 
                    Buy, sell, and swap pre-loved clothing while building a sustainable future.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {!user ? (
                    <>
                      <Link
                        href="/register"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-2xl transform hover:scale-105"
                      >
                        Start Shopping
                      </Link>
                      <Link
                        href="#"
                        className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20"
                      >
                        Learn More
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/products"
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-2xl transform hover:scale-105"
                      >
                        Browse Products
                      </Link>
                      <Link
                        href="/add-item"
                        className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20"
                      >
                        Sell Your Items
                      </Link>
                    </>
                  )}
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-white/10">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">10K+</div>
                    <div className="text-sm text-slate-400">Happy Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">
                      {liveProductCount === null ? '—' : liveProductCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-slate-400">Items Listed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white mb-1">2M+</div>
                    <div className="text-sm text-slate-400">CO₂ Saved</div>
                  </div>
                </div>
              </div>
              
              {/* Right Content - Visual */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Floating Cards */}
                  <div className="absolute -top-8 -right-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform rotate-12 hover:rotate-6 transition-transform duration-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl mb-3"></div>
                    <div className="text-white font-semibold">Vintage Jacket</div>
                    <div className="text-slate-300 text-sm">₹1,299</div>
                  </div>
                  
                  <div className="absolute -bottom-8 -left-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl mb-3"></div>
                    <div className="text-white font-semibold">Designer Bag</div>
                    <div className="text-slate-300 text-sm">₹2,499</div>
                  </div>
                  
                  {/* Main Image */}
                  <div className="relative bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
                    <div className="w-full h-96 bg-gradient-to-br from-green-200 to-emerald-300 rounded-2xl flex items-center justify-center">
                      <div className="text-6xl">♻️</div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-white font-semibold text-lg">Sustainable Fashion</div>
                      <div className="text-slate-300 text-sm">Join the movement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-emerald-400 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose ReWear?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We&apos;re revolutionizing fashion by making sustainable choices accessible, 
                affordable, and stylish for everyone.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Eco-Friendly</h3>
                <p className="text-gray-600">Reduce fashion waste and carbon footprint by giving clothes a second life.</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Affordable</h3>
                <p className="text-gray-600">Get designer and quality clothes at a fraction of the original price.</p>
              </div>
              
              <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality Assured</h3>
                <p className="text-gray-600">Every item is carefully inspected and verified for quality and authenticity.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Search */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sustainable fashion..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent bg-gray-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Categories Section */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Browse Categories</h2>
              <p className="text-xl text-gray-600">Find exactly what you&apos;re looking for</p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`group relative p-6 rounded-2xl transition-all duration-300 ${
                    activeCategory === category 
                      ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white transform scale-105 shadow-2xl' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-xl border border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 mx-auto transition-all duration-300 ${
                    activeCategory === category 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m-4 8h4m10-4h4m-4 0V8m0 8v-4m-6 4h.01M12 8h.01M12 12h.01M12 16h.01M12 20h.01M18 16h.01"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">{category}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Products Section */}
          <section id="products-section">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Featured Items</h2>
                <p className="text-gray-600">Discover unique pieces from our community</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm text-gray-500">Showing {filteredProducts.length} items</span>
              </div>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-gray-900 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                  <p className="mt-4 text-gray-600 font-medium">Loading amazing items...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h4>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    {/* Product Image */}
                    <div className="relative overflow-hidden">
                      {/* Badges */}
                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        {product.isNew && (
                          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            New
                          </span>
                        )}
                        {product.discount && (
                          <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                            -{product.discount}%
                          </span>
                        )}
                      </div>
                      
                      {/* Like Button */}
                      <button className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-lg">
                        <svg className="w-5 h-5 text-gray-600 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      </button>
                      
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                        unoptimized
                      />
                      
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Link 
                          href={`/products/${product.id}`}
                          className="bg-white text-gray-900 px-6 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Quick View
                        </Link>
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{product.name}</h4>
                        {product.isNegotiable && (
                          <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                            Negotiable
                          </span>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-xl font-bold text-gray-900">{product.price}</span>
                        {product.originalPrice && product.originalPrice !== product.price && (
                          <span className="text-gray-400 text-sm line-through">{product.originalPrice}</span>
                        )}
                      </div>
                      
                      {/* Quick Details */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Condition:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.condition === 'new' ? 'bg-green-100 text-green-800' :
                            product.condition === 'like_new' ? 'bg-green-100 text-green-800' :
                            product.condition === 'very_good' ? 'bg-yellow-100 text-yellow-800' :
                            product.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                            product.condition === 'fair' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product.condition?.replace(/_/g, ' ') || 'Unknown'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium text-gray-900">{product.category}</span>
                        </div>
                        
                        {product.size && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium text-gray-900">{product.size}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Seller Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span>by {product.seller}</span>
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            {product.views || 0}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                            </svg>
                            {product.likes || 0}
                          </span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <Link 
                        href={`/products/${product.id}`}
                        className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white py-3 px-4 rounded-xl font-medium hover:from-gray-800 hover:to-gray-600 transition-all duration-200 text-center block shadow-lg"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No products found</h4>
                <p className="text-gray-600 mb-6">Try adjusting your search or browse different categories</p>
                <button 
                  onClick={() => {
                    setActiveCategory('All');
                    setSearchTerm('');
                  }}
                  className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-3 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg"
                >
                  Show All Products
                </button>
              </div>
            )}
          </section>
        </div>
        
        {/* Call to Action Section */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-700 py-20 mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of fashion lovers who are already making sustainable choices. 
              Start your journey today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-2xl"
                  >
                    Get Started Today
                  </Link>
                  <Link
                    href="/login"
                    className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  href="/add-item"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-2xl"
                >
                  Start Selling
                </Link>
              )}
            </div>
          </div>
        </section>
        
        <AboutPage />
        <ContactForm />
      </main>

      {/* Modern Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ReWear
              </h4>
              <p className="text-gray-400 mb-4 max-w-md">
                Making sustainable fashion accessible to everyone. Join our community of conscious consumers 
                and make a positive impact on the planet.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.219-.359-1.219c0-1.142.662-1.995 1.488-1.995.219 0 .444.164.444.664 0 .401-.286 1.002-.433 1.558-.123.219-.219.498-.219.219 0-.957.578-1.723 1.699-1.723 2.004 0 3.5 2.165 3.5 5.226 0 2.739-1.946 4.651-4.738 4.651-3.281 0-5.226-2.456-5.226-4.89 0-.957.371-1.99.835-2.552.219-.266.025-.445-.078-.445-.896 0-1.652.67-1.652 1.613 0 .445.183.93.183 1.376v.1c0 .498-.25.830-.830.83-.498 0-.913-.333-.913-.913 0-.58.415-1.047.913-1.047.415 0 .83.332.83.83v-.085c0-.498-.415-.745-.415-1.376 0-.708.58-1.265 1.376-1.265.498 0 .913.415.913.913 0 .415-.415.83-.913.83-.415 0-.83-.415-.83-.83z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 ReWear. All rights reserved. Made with ❤️ for the planet.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
