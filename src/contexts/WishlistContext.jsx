
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    if (user) {
      const savedWishlist = localStorage.getItem(`wishlist_${user.id}`);
      if (savedWishlist) {
        setWishlistItems(JSON.parse(savedWishlist));
      } else {
        // Load mock data for demo
        const mockWishlist = [
          {
            id: '1',
            title: 'iPhone 15 Pro Max',
            price: 1199,
            originalPrice: 1299,
            image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
            platform: 'Amazon',
            url: 'https://amazon.com/iphone-15-pro-max',
            tags: ['electronics', 'phone'],
            addedAt: new Date().toISOString(),
            inCart: false
          },
          {
            id: '2',
            title: 'MacBook Pro 16"',
            price: 2399,
            originalPrice: 2499,
            image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
            platform: 'Apple',
            url: 'https://apple.com/macbook-pro',
            tags: ['electronics', 'laptop'],
            addedAt: new Date().toISOString(),
            inCart: false
          },
          {
            id: '3',
            title: 'Nike Air Jordan 1',
            price: 170,
            originalPrice: 200,
            image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400',
            platform: 'Nike',
            url: 'https://nike.com/air-jordan-1',
            tags: ['shoes', 'fashion'],
            addedAt: new Date().toISOString(),
            inCart: true
          }
        ];
        setWishlistItems(mockWishlist);
        localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(mockWishlist));
      }
    }
  }, [user]);

  const addToWishlist = (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
      inCart: false
    };
    
    const updatedWishlist = [...wishlistItems, newItem];
    setWishlistItems(updatedWishlist);
    
    if (user) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
    }
  };

  const removeFromWishlist = (itemId) => {
    const updatedWishlist = wishlistItems.filter(item => item.id !== itemId);
    setWishlistItems(updatedWishlist);
    
    if (user) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
    }
  };

  const toggleCartStatus = (itemId) => {
    const updatedWishlist = wishlistItems.map(item =>
      item.id === itemId ? { ...item, inCart: !item.inCart } : item
    );
    setWishlistItems(updatedWishlist);
    
    if (user) {
      localStorage.setItem(`wishlist_${user.id}`, JSON.stringify(updatedWishlist));
    }
  };

  const value = {
    wishlistItems,
    addToWishlist,
    removeFromWishlist,
    toggleCartStatus
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
