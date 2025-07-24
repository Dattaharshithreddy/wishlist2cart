
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { wishlistItems } = useWishlist();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Update cart items based on wishlist items marked as "in cart"
    const itemsInCart = wishlistItems.filter(item => item.inCart);
    setCartItems(itemsInCart);
  }, [wishlistItems]);

  const getTotalValue = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };

  const getOriginalTotalValue = () => {
    return cartItems.reduce((total, item) => total + (item.originalPrice || item.price), 0);
  };

  const getTotalSavings = () => {
    return getOriginalTotalValue() - getTotalValue();
  };

  const getItemsByPlatform = () => {
    const platforms = {};
    cartItems.forEach(item => {
      if (!platforms[item.platform]) {
        platforms[item.platform] = [];
      }
      platforms[item.platform].push(item);
    });
    return platforms;
  };

  const value = {
    cartItems,
    getTotalValue,
    getOriginalTotalValue,
    getTotalSavings,
    getItemsByPlatform
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
