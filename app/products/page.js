"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useProductSocket } from "../../components/socketClient";
import authClient from "../../lib/auth-client.js";
import useAuth from "../../hooks/useAuth.js";

export default function BrowseProductsPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceTimeout = useRef(null);

  const PRODUCTS_PER_PAGE = 12;

  // Real-time handlers
  const handleProductNew = useCallback((product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);
  const handleProductRemove = useCallback((productId) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);
  const handleUserCount = useCallback((count) => {
    setOnlineCount(count);
  }, []);

  useProductSocket({
    onProductNew: handleProductNew,
    onProductRemove: handleProductRemove,
    onUserCount: handleUserCount,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Debounce search input
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [search]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [debouncedSearch, category, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: PRODUCTS_PER_PAGE,
        page,
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (category) params.append("category", category);
      let headers = {};
      authClient.initializeFromStorage();
      if (authClient.isAuthenticated()) {
        headers = { 'Authorization': `Bearer ${authClient.token}` };
      }
      const res = await fetch(`/api/products?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 pb-8">
      {/* Navbar */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-lg mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-600 bg-clip-text text-transparent">
                ReWear
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-700">Welcome back!</p>
                    <p className="text-xs text-gray-500">{user.name}</p>
                  </div>
                  <Link href={user.account_type === 'admin' ? '/dashboard/admin' : '/dashboard/user'} className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-4 py-2 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg">Dashboard</Link>
                  <Link href="/add-item" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Add Item</Link>
                  <button onClick={logout} className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200" title="Logout">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">Sign In</Link>
                  <Link href="/register" className="bg-gradient-to-r from-gray-900 to-gray-700 text-white px-6 py-2 rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium shadow-lg">Get Started</Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <nav className="text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="list-reset flex">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-green-700 font-semibold">Browse Products</li>
          </ol>
        </nav>
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-green-700">Browse Products</h1>
          <div className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
            Online users: <span className="font-semibold text-green-800">{onlineCount}</span>
          </div>
        </div>
        {/* Show total product count */}
        <div className="mb-4 text-gray-700 text-sm">
          Total products: <span className="font-semibold">{totalCount}</span>
        </div>
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
              >
                <div className="relative w-full aspect-square bg-gray-100">
                  <Image
                    src={product.image_urls?.[0] || 'https://placehold.co/400x400/9ACD32/ffffff?text=Product'}
                    alt={product.title}
                    fill
                    className="object-cover rounded-t-2xl"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1 truncate">{product.title}</h2>
                  <p className="text-sm text-gray-500 mb-2 truncate">{product.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-green-700 font-bold text-lg">₹{product.price}</span>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs capitalize">{product.condition_rating?.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {/* Pagination Controls */}
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium transition-all duration-200 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
            aria-label="Previous Page"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-gray-700">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium transition-all duration-200 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'}`}
            aria-label="Next Page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
} 