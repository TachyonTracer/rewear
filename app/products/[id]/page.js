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

  const fetchUserProducts = async () => {
    try {
      const response = await fetchWithAuth('/api/user/products');
      if (!response.ok) {
        throw new Error('Failed to fetch your products');
      }
      const data = await response.json();
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
    
    // Fetch user's products and show modal
    await fetchUserProducts();
    setShowSwapModal(true);
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
      const response = await fetchWithAuth('/api/swaps', {
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create swap request');
      }

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

  const handleRedeemPoints = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    // TODO: Implement points redemption
    alert('Points redemption feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The product you are looking for does not exist.'}</p>
          <Link 
            href="/"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const images = product.image_urls && product.image_urls.length > 0 
    ? product.image_urls 
    : [`https://placehold.co/600x400/6B8E23/ffffff?text=${encodeURIComponent(product.title)}`];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-green-600 hover:text-green-700">
            ReWear
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href={`/?category=${product.category_name}`} className="hover:text-green-600">{product.category_name}</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <Image
                src={images[selectedImageIndex]}
                alt={product.title}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            
            {/* Image Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index 
                        ? 'border-green-600' 
                        : 'border-gray-200 hover:border-green-400'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-xl text-gray-400 line-through">₹{product.original_price}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                      {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                    </span>
                  </>
                )}
                {product.is_negotiable && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                    Negotiable
                  </span>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Condition:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    product.condition_rating === 'new' ? 'bg-green-100 text-green-800' :
                    product.condition_rating === 'like_new' ? 'bg-green-100 text-green-800' :
                    product.condition_rating === 'very_good' ? 'bg-yellow-100 text-yellow-800' :
                    product.condition_rating === 'good' ? 'bg-yellow-100 text-yellow-800' :
                    product.condition_rating === 'fair' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.condition_rating?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                </div>
                
                {product.size && (
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="ml-2 font-medium text-gray-900">{product.size}</span>
                  </div>
                )}
                
                {product.color && (
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <span className="ml-2 font-medium text-gray-900">{product.color}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-2 font-medium text-gray-900">{product.category_name}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {product.seller_name?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.seller_name}</p>
                  <p className="text-sm text-gray-600">Verified Seller</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleSwapRequest}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Request Swap
                </button>
                <button
                  onClick={handleRedeemPoints}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Redeem with Points
                </button>
              </div>
              
              {/* Availability Status */}
              <div className="text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Available for Exchange
                </span>
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                Select one of your products to offer in exchange for &quot;{product?.name}&quot;
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
                        {userProduct.image_url && (
                          <Image
                            src={userProduct.image_url}
                            alt={userProduct.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{userProduct.name}</h4>
                          <p className="text-sm text-gray-600">{userProduct.category_name}</p>
                          <p className="text-sm text-green-600 font-medium">₱{userProduct.price}</p>
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
