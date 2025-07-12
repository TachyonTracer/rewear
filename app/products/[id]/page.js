'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useAuth } from '../../../hooks/useAuth.js';
import { fetchWithAuth } from '../../../lib/api.js';

export default function ItemDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [selectedUserProduct, setSelectedUserProduct] = useState(null);
  const [swapMessage, setSwapMessage] = useState('');
  const [submittingSwap, setSubmittingSwap] = useState(false);
  const [userPoints, setUserPoints] = useState(null); // null initially to show loading state

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch user points when user is available
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (user) {
        try {
          const pointsData = await fetchWithAuth('/api/points');
          setUserPoints(pointsData.data?.pointsBalance || 0);
        } catch (error) {
          console.error('Error fetching user points:', error);
          setUserPoints(0);
        }
      }
    };

    fetchUserPoints();
  }, [user]);

  const fetchUserProducts = async () => {
    try {
      const data = await fetchWithAuth('/api/user/products');
      setUserProducts(data.products || []);
    } catch (err) {
      console.error('Error fetching user products:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load your products',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleSwapRequest = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Fetch user's products for swap
      const response = await fetchWithAuth('/api/products/user');
      const userProductsData = response.data?.products || [];
      
      if (userProductsData.length === 0) {
        Swal.fire({
          title: 'No Products Available',
          text: 'You need to have at least one product listed to request a swap.',
          icon: 'info',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Add a Product',
          showCancelButton: true,
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/dashboard/user');
          }
        });
        return;
      }

      setUserProducts(userProductsData);
      setShowSwapModal(true);
    } catch (err) {
      console.error('Error fetching user products:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load your products. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  const handleSwapSubmit = async () => {
    if (!selectedUserProduct) {
      Swal.fire({
        title: 'Error',
        text: 'Please select one of your products to swap',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      return;
    }

    setSubmittingSwap(true);
    try {
      const data = await fetchWithAuth('/api/swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requested_product_id: parseInt(productId),
          offered_product_id: selectedUserProduct,
          message: swapMessage
        })
      });

      Swal.fire({
        title: 'Success!',
        text: 'Your swap request has been sent successfully',
        icon: 'success',
        confirmButtonColor: '#3085d6'
      });

      setShowSwapModal(false);
      setSelectedUserProduct(null);
      setSwapMessage('');
    } catch (err) {
      console.error('Error creating swap request:', err);
      Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setSubmittingSwap(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Fetch user's current points - always get fresh data
      const pointsData = await fetchWithAuth('/api/points');
      const currentBalance = pointsData.data?.pointsBalance || 0;
      setUserPoints(currentBalance);
      
      // Calculate points needed (1 point = 1 rupee)
      const pointsNeeded = Math.ceil(product.price);
      
      if (currentBalance < pointsNeeded) {
        Swal.fire({
          title: 'Insufficient Points',
          html: `
            <div class="text-left">
              <p class="mb-2">You don't have enough points to purchase this item.</p>
              <p class="mb-2"><strong>Points Required:</strong> ${pointsNeeded}</p>
              <p class="mb-2"><strong>Your Current Balance:</strong> ${currentBalance}</p>
              <p class="mb-2"><strong>Points Needed:</strong> ${pointsNeeded - currentBalance}</p>
              <p class="text-sm text-gray-600 mt-4">Earn more points by uploading items, completing swaps, or redeeming rewards!</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Got it',
          showCancelButton: true,
          cancelButtonText: 'Earn Points',
          cancelButtonColor: '#10b981'
        }).then((result) => {
          if (result.dismiss === Swal.DismissReason.cancel) {
            // Redirect to points earning page
            router.push('/redeem-points');
          }
        });
        return;
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Purchase with Points?',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Product:</strong> ${product.title}</p>
            <p class="mb-2"><strong>Price:</strong> ₹${product.price}</p>
            <p class="mb-2"><strong>Points Required:</strong> ${pointsNeeded}</p>
            <p class="mb-2"><strong>Your Points Balance:</strong> ${currentBalance}</p>
            <p class="mb-2"><strong>Balance After Purchase:</strong> ${currentBalance - pointsNeeded}</p>
            <p class="text-sm text-gray-600 mt-4">This action cannot be undone.</p>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Purchase Now',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        // Process the points purchase
        const purchaseResponse = await fetchWithAuth('/api/products/purchase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: productId,
            paymentMethod: 'points',
            pointsUsed: pointsNeeded
          })
        });

        if (purchaseResponse.success) {
          Swal.fire({
            title: 'Purchase Successful!',
            html: `
              <div class="text-left">
                <p class="mb-2">🎉 You have successfully purchased <strong>${product.title}</strong></p>
                <p class="mb-2"><strong>Points Used:</strong> ${pointsNeeded}</p>
                <p class="mb-2"><strong>Remaining Balance:</strong> ${currentBalance - pointsNeeded} points</p>
                <div class="mt-4 p-3 bg-green-50 rounded-lg">
                  <p class="text-sm text-green-700 font-medium">✅ You now own this product!</p>
                  <p class="text-xs text-green-600 mt-1">Check your dashboard to manage your new item</p>
                </div>
              </div>
            `,
            icon: 'success',
            confirmButtonColor: '#10b981'
          }).then(() => {
            router.push('/dashboard/user');
          });
        } else {
          throw new Error(purchaseResponse.error || 'Purchase failed');
        }
      }
    } catch (error) {
      console.error('Error processing points purchase:', error);
      Swal.fire({
        title: 'Purchase Failed',
        text: error.message || 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-8 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-t-8 border-gray-900 mx-auto absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="mt-8 space-y-2">
            <p className="text-xl font-semibold text-gray-900">Loading product...</p>
            <p className="text-gray-600">Please wait while we fetch the details</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{error || 'The product you are looking for does not exist or has been removed.'}</p>
          <div className="space-y-4">
            <Link 
              href="/"
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg"
            >
              🏠 Back to Home
            </Link>
            <Link 
              href="/products"
              className="inline-flex items-center justify-center w-full bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              🔍 Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : [`https://placehold.co/600x400/6B8E23/ffffff?text=${encodeURIComponent(product.title)}`];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Clean Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                ReWear
              </Link>
              <nav className="hidden md:flex space-x-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Browse
                </Link>
                <Link href="/sell" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Sell
                </Link>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  About
                </Link>
              </nav>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm text-gray-500">Points Balance</p>
                  <p className="font-semibold text-gray-900">
                    {userPoints !== null ? `${userPoints} pts` : 'Loading...'}
                  </p>
                </div>
                <Link 
                  href="/dashboard/user"
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link href={`/?category=${product.category_name}`} className="text-gray-500 hover:text-gray-700 transition-colors">
                  {product.category_name}
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium truncate">{product.title}</li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Product Images - Left Column */}
          <div className="lg:col-span-7">
            <div className="sticky top-8">
              <div className="space-y-6">
                {/* Main Image */}
                <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 relative group">
                  <Image
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    width={800}
                    height={800}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                  {/* Zoom indicator */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
                
                {/* Image Thumbnails */}
                {images.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          selectedImageIndex === index 
                            ? 'border-gray-900 shadow-lg scale-105' 
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${product.title} view ${index + 1}`}
                          width={120}
                          height={120}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information - Right Column */}
          <div className="lg:col-span-5">
            <div className="space-y-8">
              {/* Title and Price */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{product.title}</h1>
                  <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                    <svg className="w-6 h-6 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">₹{product.price}</span>
                  {product.original_price && product.original_price > product.price && (
                    <>
                      <span className="text-xl text-gray-400 line-through">₹{product.original_price}</span>
                      <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                    {/* Product Badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium border border-green-200 hover:bg-green-200 transition-colors animate-pulse">
                  ✓ Authentic
                </span>
                {product.is_negotiable && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200 hover:bg-blue-200 transition-colors">
                    💬 Negotiable
                  </span>
                )}
                <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm font-medium border border-purple-200 hover:bg-purple-200 transition-colors">
                  🚚 Fast Shipping
                </span>
              </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="space-y-4">
                  {/* Points Display */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">Points Required</p>
                        <p className="text-2xl font-bold text-gray-900">{Math.ceil(product.price)} pts</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">Your Balance</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {user ? (userPoints !== null ? `${userPoints} pts` : 'Loading...') : (
                            <Link href="/login" className="text-blue-600 underline">Sign In</Link>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {user && user.id !== product.seller_id ? (
                      <>
                        <button
                          onClick={handleSwapRequest}
                          className="w-full py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          🔄 Request Swap
                        </button>
                        
                        <button
                          onClick={handleRedeemPoints}
                          disabled={userPoints !== null && userPoints < Math.ceil(product.price)}
                          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg transform hover:-translate-y-0.5 ${
                            userPoints !== null && userPoints < Math.ceil(product.price)
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none transform-none'
                              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl'
                          }`}
                        >
                          {userPoints !== null && userPoints < Math.ceil(product.price)
                            ? `💎 Need ${Math.ceil(product.price) - userPoints} More Points`
                            : '💎 Buy with Points'}
                        </button>
                      </>
                    ) : user && user.id === product.seller_id ? (
                      <div className="text-center py-6">
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <p className="text-gray-600 mb-2 font-medium">This is your item</p>
                          <p className="text-sm text-gray-500">You own this product</p>
                        </div>
                        <Link 
                          href="/dashboard/user"
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                        >
                          📊 Go to Dashboard
                        </Link>
                      </div>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="w-full block py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl font-semibold text-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          🔐 Sign in to Request Swap
                        </Link>
                        <Link
                          href="/register"
                          className="w-full block py-4 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          ✨ Create Account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Product Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-500 font-medium">Condition</span>
                    <p className="font-semibold text-gray-900 capitalize mt-1">
                      {product.condition_rating?.replace(/_/g, ' ') || 'Unknown'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-sm text-gray-500 font-medium">Category</span>
                    <p className="font-semibold text-gray-900 mt-1">{product.category_name}</p>
                  </div>
                  {product.size && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-500 font-medium">Size</span>
                      <p className="font-semibold text-gray-900 mt-1">{product.size}</p>
                    </div>
                  )}
                  {product.color && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-sm text-gray-500 font-medium">Color</span>
                      <p className="font-semibold text-gray-900 mt-1">{product.color}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed text-base">{product.description}</p>
              </div>

              {/* Seller Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Seller
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-gray-800 to-gray-900 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">
                      {product.seller_name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{product.seller_name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        ✓ Verified
                      </span>
                      <span className="text-sm text-gray-500">Member since 2024</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Features */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Why Choose ReWear?
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Quality Assured</h4>
                      <p className="text-sm text-gray-600">All items verified for authenticity</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Easy Returns</h4>
                      <p className="text-sm text-gray-600">7-day return policy</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Support 24/7</h4>
                      <p className="text-sm text-gray-600">Round-the-clock customer service</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <div className="bg-white rounded-full shadow-2xl border border-gray-200 p-1">
          <div className="flex space-x-2">
            {user && user.id !== product.seller_id ? (
              <>
                <button
                  onClick={handleSwapRequest}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3 rounded-full hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
                <button
                  onClick={handleRedeemPoints}
                  disabled={userPoints !== null && userPoints < Math.ceil(product.price)}
                  className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                    userPoints !== null && userPoints < Math.ceil(product.price)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </button>
              </>
            ) : !user ? (
              <Link
                href="/login"
                className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3 rounded-full hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Swap Request Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Request Swap</h3>
              <button
                onClick={() => {
                  setShowSwapModal(false);
                  setSelectedUserProduct(null);
                  setSwapMessage('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Select one of your products to offer in exchange for &quot;{product?.title}&quot;
              </p>
              
              {userProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You don&apos;t have any products listed yet.</p>
                  <button
                    onClick={() => router.push('/dashboard/user')}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Add a product to start swapping
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {userProducts.map((userProduct) => (
                    <div
                      key={userProduct.id}
                      onClick={() => setSelectedUserProduct(userProduct.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedUserProduct === userProduct.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {userProduct.image_urls && userProduct.image_urls.length > 0 && (
                          <Image
                            src={userProduct.image_urls[0]}
                            alt={userProduct.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{userProduct.name}</h4>
                          <p className="text-sm text-gray-600">{userProduct.category_name}</p>
                          <p className="text-sm text-green-600 font-medium">₹{userProduct.price}</p>
                        </div>
                        {selectedUserProduct === userProduct.id && (
                          <div className="text-green-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {userProducts.length > 0 && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={swapMessage}
                    onChange={(e) => setSwapMessage(e.target.value)}
                    placeholder="Add a message to your swap request..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowSwapModal(false);
                      setSelectedUserProduct(null);
                      setSwapMessage('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={submittingSwap}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSwapSubmit}
                    disabled={!selectedUserProduct || submittingSwap}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {submittingSwap ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
