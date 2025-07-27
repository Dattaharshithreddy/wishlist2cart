import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Utility: debounce function for localStorage writes
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

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

  // Universal wishlist: imported marketplace products (Amazon, Flipkart, Myntra, etc)
  const [wishlistItems, setWishlistItems] = useState([]);

  // W2C wishlist: custom/affiliate/dropshipping products
  const [w2cItems, setW2cItems] = useState([]);

  // Load wishlists from localStorage whenever user changes
  useEffect(() => {
    if (user) {
      try {
        // Load Universal wishlist
        const savedWishlist = localStorage.getItem(`wishlist_${user.uid}`);
        if (savedWishlist) {
          setWishlistItems(JSON.parse(savedWishlist));
        } else {
          // Mock/demo data for new users
          setWishlistItems([]); // or mock data
        }

        // Load W2C wishlist
        const savedW2C = localStorage.getItem(`w2c_${user.uid}`);
        if (savedW2C) {
          setW2cItems(JSON.parse(savedW2C));
        } else {
          setW2cItems([]); // or mock data
        }
      } catch (err) {
        console.error('Failed to load wishlists:', err);
        setWishlistItems([]);
        setW2cItems([]);
      }
    } else {
      // Clear when logged out
      setWishlistItems([]);
      setW2cItems([]);
    }
  }, [user]);

  // Persist universal wishlist to localStorage with debounce
  const persistWishlist = useCallback(
    debounce((items) => {
      if (user) {
        try {
          localStorage.setItem(`wishlist_${user.uid}`, JSON.stringify(items));
        } catch (err) {
          console.error('Failed to save wishlist:', err);
        }
      }
    }, 300),
    [user]
  );

  // Persist W2C wishlist similarly
  const persistW2C = useCallback(
    debounce((items) => {
      if (user) {
        try {
          localStorage.setItem(`w2c_${user.uid}`, JSON.stringify(items));
        } catch (err) {
          console.error('Failed to save W2C wishlist:', err);
        }
      }
    }, 300),
    [user]
  );

  // Persist on every change
  useEffect(() => {
    persistWishlist(wishlistItems);
  }, [wishlistItems, persistWishlist]);

  useEffect(() => {
    persistW2C(w2cItems);
  }, [w2cItems, persistW2C]);

  // Add new item, source defines which list
  const addToWishlist = (item, source = 'universal') => {
    const newItem = {
      ...item,
      id: Date.now().toString(), // unique ID
      addedAt: new Date().toISOString(),
      inCart: false,
      quantity: 1,
    };
    if (source === 'universal') {
      setWishlistItems((prev) => [...prev, newItem]);
    } else if (source === 'w2c') {
      setW2cItems((prev) => [...prev, newItem]);
    }
  };

  // Remove item by id from specified wishlist
  const removeFromWishlist = (itemId, source = 'universal') => {
    if (source === 'universal') {
      setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
    } else if (source === 'w2c') {
      setW2cItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // Toggle inCart flag for item by id in specified wishlist
  const toggleCartStatus = (itemId, source = 'universal') => {
    if (source === 'universal') {
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, inCart: !item.inCart } : item
        )
      );
    } else if (source === 'w2c') {
      setW2cItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, inCart: !item.inCart } : item
        )
      );
    }
  };

  // Update arbitrary fields for an item by id in specified wishlist
  const updateItem = (itemId, updatedFields, source = 'universal') => {
    if (source === 'universal') {
      setWishlistItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updatedFields } : item
        )
      );
    } else if (source === 'w2c') {
      setW2cItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updatedFields } : item
        )
      );
    }
  };

  // Update quantity safeguard for specified wishlist
  const updateQuantity = (itemId, quantity, source = 'universal') => {
    if (quantity < 1) return;
    updateItem(itemId, { quantity }, source);
  };

  // Clear entire wishlist for both or specified source
  const clearWishlist = (source = 'universal') => {
    if (source === 'universal') {
      setWishlistItems([]);
      if (user) localStorage.removeItem(`wishlist_${user.uid}`);
    } else if (source === 'w2c') {
      setW2cItems([]);
      if (user) localStorage.removeItem(`w2c_${user.uid}`);
    } else if (source === 'all') {
      setWishlistItems([]);
      setW2cItems([]);
      if (user) {
        localStorage.removeItem(`wishlist_${user.uid}`);
        localStorage.removeItem(`w2c_${user.uid}`);
      }
    }
  };

  // Memoize for performance
  const value = React.useMemo(
    () => ({
      wishlistItems,
      w2cItems,
      addToWishlist,
      removeFromWishlist,
      toggleCartStatus,
      updateItem,
      updateQuantity,
      clearWishlist,
    }),
    [wishlistItems, w2cItems]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
