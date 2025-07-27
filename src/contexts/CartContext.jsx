// src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';

function isSameCatalogProduct(wItem, product) {
  return wItem.catalogId
    ? wItem.catalogId === product.catalogId
    : wItem.id === product.id;
}

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
  const { wishlistItems, updateItem, updateQuantity, addToWishlist } = useWishlist();

  const [cartItems, setCartItems] = useState([]);

  // Sync cartItems from wishlist where inCart = true
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }
    setCartItems(wishlistItems.filter(item => item.inCart));
  }, [wishlistItems, user]);

  // Add product directly to cart (with wishlist syncing)
  const addToCart = useCallback((product) => {
    if (!user) return;
    const itemInWishlist = wishlistItems.find((item) => isSameCatalogProduct(item, product));
    if (itemInWishlist) {
      if (!itemInWishlist.inCart) {
        updateItem(itemInWishlist.id, { inCart: true });
      }
    } else {
      const wishlistItem = {
        ...product,
        id: Date.now().toString(), // unique wishlist item ID
        inCart: true,
        quantity: 1,
        catalogId: product.catalogId || product.id,
      };
      addToWishlist(wishlistItem);
    }
  }, [user, wishlistItems, updateItem, addToWishlist]);

  // Remove product from cart (marks inCart false and reset quantity)
  const removeFromCart = useCallback((wishlistItemId) => {
    if (!user) return;
    updateItem(wishlistItemId, { inCart: false, quantity: 1 });
  }, [user, updateItem]);

  // Update quantity for a cart item
  const setQuantity = useCallback((wishlistItemId, quantity) => {
    if (!user || quantity < 1) return;
    updateQuantity(wishlistItemId, quantity);
  }, [user, updateQuantity]);

  // Compute total value
  const getTotalValue = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + (item.price * (item.quantity || 1)),
      0,
    );
  }, [cartItems]);

  // Compute original total (for savings)
  const getOriginalTotalValue = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + ((item.originalPrice || item.price) * (item.quantity || 1)),
      0,
    );
  }, [cartItems]);

  // Total savings
  const getTotalSavings = useMemo(() =>
    getOriginalTotalValue - getTotalValue
  , [getOriginalTotalValue, getTotalValue]);

  // Grouped items by platform (optional)
  const getItemsByPlatform = useMemo(() => {
    const platforms = {};
    cartItems.forEach((item) => {
      if (!platforms[item.platform]) platforms[item.platform] = [];
      platforms[item.platform].push(item);
    });
    return platforms;
  }, [cartItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    if (!user) return;
    cartItems.forEach((item) => updateItem(item.id, { inCart: false, quantity: 1 }));
  }, [user, cartItems, updateItem]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    setQuantity,
    getTotalValue,
    getOriginalTotalValue,
    getTotalSavings,
    getItemsByPlatform,
    clearCart,
  }), [
    cartItems,
    addToCart,
    removeFromCart,
    setQuantity,
    getTotalValue,
    getOriginalTotalValue,
    getTotalSavings,
    getItemsByPlatform,
    clearCart,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
