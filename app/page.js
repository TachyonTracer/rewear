'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../hooks/useAuth.js";
import About from "../components/aboutus.js"; // Assuming you have an AboutUs component

export default function Home() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Mock data for demonstration - in production, this would come from your database
  useEffect(() => {
    const mockCategories = [
      'All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Footwear'
    ];
    const mockProducts = [
      {
        id: 1,
        name: 'Vintage Denim Jacket',
        price: '₹1200',
        image: 'https://placehold.co/400x300/6B8E23/ffffff?text=Denim+Jacket',
        category: 'Outerwear',
        description: 'Classic denim jacket, well-preserved and stylish.',
        seller: 'EcoThreads'
      },
      {
        id: 2,
        name: 'Floral Summer Dress',
        price: '₹850',
        image: 'https://placehold.co/400x300/8FBC8F/ffffff?text=Summer+Dress',
        category: 'Dresses',
        description: 'Light and airy floral dress, perfect for summer days.',
        seller: 'GreenCloset'
      },
      {
        id: 3,
        name: 'Comfortable Cotton Tee',
        price: '₹300',
        image: 'https://placehold.co/400x300/9ACD32/ffffff?text=Cotton+Tee',
        category: 'Tops',
        description: 'Soft cotton t-shirt, great for everyday wear.',
        seller: 'RewearFinds'
      },
      {
        id: 4,
        name: 'High-Waisted Jeans',
        price: '₹950',
        image: 'https://placehold.co/400x300/556B2F/ffffff?text=High-Waisted+Jeans',
        category: 'Bottoms',
        description: 'Stylish high-waisted jeans, comfortable fit.',
        seller: 'SustainableStyle'
      },
      {
        id: 5,
        name: 'Elegant Silk Scarf',
        price: '₹400',
        image: 'https://placehold.co/400x300/2E8B57/ffffff?text=Silk+Scarf',
        category: 'Accessories',
        description: 'Luxurious silk scarf, adds a touch of elegance.',
        seller: 'ChicRecycle'
      },
      {
        id: 6,
        name: 'Leather Ankle Boots',
        price: '₹1800',
        image: 'https://placehold.co/400x300/3CB371/ffffff?text=Ankle+Boots',
        category: 'Footwear',
        description: 'Durable leather ankle boots, minimal wear.',
        seller: 'BootUp'
      },
      {
        id: 7,
        name: 'Striped Polo Shirt',
        price: '₹450',
        image: 'https://placehold.co/400x300/66CDAA/ffffff?text=Polo+Shirt',
        category: 'Tops',
        description: 'Classic striped polo, perfect for casual outings.',
        seller: 'PreLovedPerfection'
      },
      {
        id: 8,
        name: 'Comfy Lounge Pants',
        price: '₹600',
        image: 'https://placehold.co/400x300/32CD32/ffffff?text=Lounge+Pants',
        category: 'Bottoms',
        description: 'Soft and comfy lounge pants, ideal for relaxing.',
        seller: 'RelaxedRewear'
      },
    ];
    setCategories(mockCategories);
    setProducts(mockProducts);
  }, []);

  // Filtered products based on search term and active category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (

    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 text-gray-800">
      {/* Header */}
      
      <header className="bg-white shadow-lg py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between rounded-b-2xl">
        <div className="flex items-center mb-4 md:mb-0">
          <Link href="/" className="text-3xl font-bold text-green-700 mr-8 hover:text-green-800 transition duration-300">
            Rewear
          </Link>
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search for clothes..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300 ease-in-out"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {/* Navigation/User Icons */}
        <nav className="flex items-center space-x-6">
          {user ? (
            <>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.name}!
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {user.account_type}
                </span>
              </div>
              {(user.account_type === 'seller' || user.account_type === 'admin') && (
                <button className="text-green-700 hover:text-green-900 font-medium transition duration-300 ease-in-out">
                  Post Item
                </button>
              )}
              <button className="relative text-green-700 hover:text-green-900 transition duration-300 ease-in-out">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">0</span>
              </button>
              <button 
                onClick={logout}
                className="text-green-700 hover:text-green-900 transition duration-300 ease-in-out"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-green-700 hover:text-green-900 font-medium transition duration-300 ease-in-out"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-green-600 text-white px-4 py-2 rounded-full font-medium hover:bg-green-700 transition duration-300 ease-in-out"
              >
                Sign Up
              </Link>
              <button className="relative text-green-700 hover:text-green-900 transition duration-300 ease-in-out">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </button>
            </>
          )}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-400 to-green-600 rounded-3xl shadow-xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
          <div className="md:w-1/2 text-white z-10 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 drop-shadow-md">
              Give Your Clothes a <br />
              <span className="text-green-900">Second Life!</span>
            </h2>
            <p className="text-lg md:text-xl mb-6 opacity-90 drop-shadow-sm">
              Discover unique pre-loved fashion and contribute to a greener planet.
            </p>
            {!user ? (
              <Link
                href="/register"
                className="bg-white text-green-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-100 transform hover:scale-105 transition duration-300 ease-in-out inline-block"
              >
                Join Now
              </Link>
            ) : (
              <button className="bg-white text-green-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-green-100 transform hover:scale-105 transition duration-300 ease-in-out">
                Shop Now
              </button>
            )}
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center items-center relative z-0">
            {/* Abstract green shapes for visual appeal */}
            <div className="absolute w-48 h-48 bg-green-700 rounded-full opacity-20 -top-10 -right-10 blur-xl"></div>
            <div className="absolute w-64 h-64 bg-green-800 rounded-full opacity-10 -bottom-20 -left-20 blur-xl"></div>
            <Image
              src="https://placehold.co/400x300/4CAF50/ffffff?text=Sustainable+Fashion"
              alt="Sustainable Fashion"
              width={400}
              height={300}
              className="w-full max-w-md h-auto rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 ease-in-out"
              unoptimized
            />
          </div>
        </section>

        {/* Categories Section */}
        <section className="mb-12">
          <h3 className="text-3xl font-bold text-green-800 mb-6 text-center">Browse Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-md transition duration-300 ease-in-out
                  ${activeCategory === category ? 'bg-green-600 text-white transform scale-105 shadow-lg' : 'bg-white text-green-700 hover:bg-green-50 hover:shadow-lg'}`}
              >
                {/* Category icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  activeCategory === category ? 'bg-green-700' : 'bg-green-200'
                }`}>
                  <svg className={`w-6 h-6 ${activeCategory === category ? 'text-white' : 'text-green-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m-4 8h4m10-4h4m-4 0V8m0 8v-4m-6 4h.01M12 8h.01M12 12h.01M12 16h.01M12 20h.01M18 16h.01"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">{category}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Product Listing */}
        <section>
          <h3 className="text-3xl font-bold text-green-800 mb-6 text-center">Featured Items</h3>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 ease-in-out group">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-t-xl group-hover:opacity-90 transition-opacity duration-300"
                    unoptimized
                  />
                  <div className="p-5">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h4>
                    <p className="text-green-600 text-lg font-bold mb-3">{product.price}</p>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 bg-green-50 px-3 py-1 rounded-full">{product.seller}</span>
                      <button className="bg-green-500 text-white px-5 py-2 rounded-full font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-300 ease-in-out">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 text-lg py-10">
              <div className="mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              No products found matching your criteria. Try adjusting your search or category.
            </div>
          )}
        </section>
        <About/>
      </main>

      {/* Footer */}
      <footer className="bg-green-800 text-white py-8 px-6 md:px-12 mt-12 rounded-t-2xl">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <h4 className="text-2xl font-bold mb-2">Rewear</h4>
            <p className="text-sm opacity-80">&copy; 2025 Rewear. All rights reserved.</p>
          </div>
          
          <nav className="flex flex-wrap justify-center md:justify-end space-x-6">
            <a href="#" className="hover:text-green-200 transition duration-300 ease-in-out">About Us</a>
            <a href="#" className="hover:text-green-200 transition duration-300 ease-in-out">How It Works</a>
            <a href="#" className="hover:text-green-200 transition duration-300 ease-in-out">Contact</a>
            <a href="#" className="hover:text-green-200 transition duration-300 ease-in-out">Privacy Policy</a>

          </nav>
        </div>
        
      </footer>
    </div>
  );
}
