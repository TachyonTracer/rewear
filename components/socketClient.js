'use client';

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Use env variable for websocket server URL, fallback to localhost:3000 for local dev
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

export function useProductSocket({ onProductNew, onProductRemove, onUserCount }) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    if (onProductNew) {
      socketRef.current.on('product:new', onProductNew);
    }
    if (onProductRemove) {
      socketRef.current.on('product:remove', onProductRemove);
    }
    if (onUserCount) {
      socketRef.current.on('user:count', onUserCount);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onProductNew, onProductRemove, onUserCount]);

  const emitProductNew = (product) => {
    if (socketRef.current) {
      socketRef.current.emit('product:new', product);
    }
  };

  const emitProductRemove = (productId) => {
    if (socketRef.current) {
      socketRef.current.emit('product:remove', productId);
    }
  };

  return { emitProductNew, emitProductRemove };
} 