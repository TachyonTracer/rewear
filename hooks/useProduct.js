'use client';

import { useState, useEffect } from 'react';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
        } else {
          throw new Error(data.error || 'Failed to fetch products');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}

export default useProducts;
