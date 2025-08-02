import { useEffect, useState } from 'react';

export function useCart() {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem('wishlist2cart-items');
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('wishlist2cart-items', JSON.stringify(cartItems));
  }, [cartItems]);

  // Toggle item in cart
  const toggleCartItem = (item) => {
    setCartItems((prevItems) => {
      const exists = prevItems.find((i) => i.id === item.id);
      if (exists) {
        return prevItems.filter((i) => i.id !== item.id);
      } else {
        return [...prevItems, item];
      }
    });
  };

  // Check if an item is in cart
  const isInCart = (id) => {
    return cartItems.some((item) => item.id === id);
  };

  // Remove a specific item
  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  return {
    cartItems,
    toggleCartItem,
    isInCart,
    removeItem,
    clearCart,
  };
}
