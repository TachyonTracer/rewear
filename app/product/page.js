// app/product/page.js
'use client';

import React, { useState } from 'react';
import { Search, ArrowLeft, Heart, Share2, MapPin, Star, ShoppingBag, Repeat, User, Camera, Edit3 } from 'lucide-react';

const ProductDetailPage = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Sample product data
  const product = {
    id: 1,
    title: "Vintage Denim Jacket",
    price: 25,
    originalPrice: 45,
    condition: "Excellent",
    size: "Medium",
    brand: "Levi's",
    category: "Jackets",
    description: "Classic vintage denim jacket in excellent condition. Perfect for layering and adding a timeless touch to any outfit. Features original button closure, chest pockets, and minimal wear. This jacket has been lovingly maintained and is ready for its next adventure.",
    features: [
      "100% Cotton Denim",
      "Classic blue wash",
      "Button closure",
      "Chest and side pockets",
      "Vintage 1990s style",
      "Machine washable"
    ],
    seller: {
      name: "Sarah Johnson",
      rating: 4.8,
      totalSales: 23,
      location: "New York, NY",
      memberSince: "2023"
    },
    images: [
      "/api/placeholder/400/500",
      "/api/placeholder/400/500",
      "/api/placeholder/400/500",
      "/api/placeholder/400/500"
    ],
    availability: "Available for Swap",
    swapPreferences: ["Sweaters", "Blouses", "Dresses"],
    pointsValue: 50
  };

  // Sample previous listings from the same seller
  const previousListings = [
    { id: 1, title: "Summer Floral Dress", price: 18, image: "/api/placeholder/150/150", status: "Sold" },
    { id: 2, title: "Cotton White T-Shirt", price: 12, image: "/api/placeholder/150/150", status: "Sold" },
    { id: 3, title: "Silk Evening Scarf", price: 15, image: "/api/placeholder/150/150", status: "Sold" },
    { id: 4, title: "High-Waisted Jeans", price: 22, image: "/api/placeholder/150/150", status: "Available" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b w-full">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-green-600">ReWear</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search for clothes..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-80"
                />
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <User className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
          {/* Left Column - Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-[4/5] bg-gray-200 rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-gray-300 rounded-lg flex items-center justify-center">
                  <Camera className="h-16 w-16 text-gray-400" />
                </div>
              </div>
              <div className="absolute top-6 right-6 flex space-x-3">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-3 rounded-full ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white text-gray-600'} shadow-lg hover:shadow-xl transition-all`}
                >
                  <Heart className="h-6 w-6" />
                </button>
                <button className="p-3 bg-white text-gray-600 rounded-full shadow-lg hover:shadow-xl transition-all">
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Thumbnail Images */}
            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square bg-gray-200 rounded-lg overflow-hidden border-3 transition-all ${
                    selectedImage === index ? 'border-green-500 shadow-lg' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded flex items-center justify-center">
                      <Camera className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-8">
            {/* Product Info */}
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  {product.condition}
                </span>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                  {product.category}
                </span>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{product.title}</h1>
              <div className="flex items-center space-x-6 mb-6">
                <span className="text-3xl font-bold text-green-600">${product.price}</span>
                <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
                <span className="text-base text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                </span>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Product Details</h3>
              <div className="grid grid-cols-2 gap-6 text-base">
                <div>
                  <span className="text-gray-600">Brand:</span>
                  <span className="ml-3 font-medium">{product.brand}</span>
                </div>
                <div>
                  <span className="text-gray-600">Size:</span>
                  <span className="ml-3 font-medium">{product.size}</span>
                </div>
                <div>
                  <span className="text-gray-600">Condition:</span>
                  <span className="ml-3 font-medium">{product.condition}</span>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <span className="ml-3 font-medium">{product.category}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Description</h3>
              <p className="text-gray-700 leading-relaxed mb-6 text-base">{product.description}</p>
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Features:</h4>
                <ul className="text-base text-gray-600 space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Seller Information</h3>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{product.seller.name}</h4>
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-base text-gray-600">{product.seller.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-base text-gray-600">
                    <span>{product.seller.totalSales} successful swaps</span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {product.seller.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 bg-green-50 rounded-xl">
                <div>
                  <span className="text-base text-gray-600">Status:</span>
                  <span className="ml-3 font-medium text-green-600 text-lg">{product.availability}</span>
                </div>
                <div>
                  <span className="text-base text-gray-600">ReWear Points:</span>
                  <span className="ml-3 font-bold text-green-600 text-lg">{product.pointsValue}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-lg font-medium">
                  <Repeat className="h-6 w-6 mr-3" />
                  Request Swap
                </button>
                <button className="flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium">
                  <ShoppingBag className="h-6 w-6 mr-3" />
                  Buy with Points
                </button>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-base text-gray-600 mb-4">Preferred swap items:</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {product.swapPreferences.map((item, index) => (
                    <span key={index} className="px-4 py-2 bg-gray-100 text-gray-700 text-base rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Listings Section */}
        <div className="mt-16 w-full px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">More from {product.seller.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
            {previousListings.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-200 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-lg font-bold text-green-600 mb-2">${item.price}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;