// src/contexts/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const CartContext = createContext();

const COLLECTION = 'cart_items'; // Your Firestore cart collection name

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Coupon state
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0); // example 10 for 10%

  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      setCouponApplied(false);
      setCouponDiscountPercent(0);
      return;
    }
    setLoading(true);
    const fetchCart = async () => {
      try {
        const q = query(collection(db, COLLECTION), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        const items = snap.docs.map(docSnap => ({
          ...docSnap.data(),
          _docId: docSnap.id,
        }));
        setCartItems(items);
      } catch (error) {
        console.error('[CartContext] Failed to fetch cart:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  // Existing add/remove/set-quantity methods unchanged
  // ...

  const addToCart = useCallback(
    async product => {
      if (!user) throw new Error('Not logged in');
      const existing = cartItems.find(i => i.id === product.id);
      try {
        if (existing) {
          const newQuantity = (existing.quantity || 1) + 1;
          await updateDoc(doc(db, COLLECTION, existing._docId), { quantity: newQuantity });
          setCartItems(prev =>
            prev.map(i => (i.id === product.id ? { ...i, quantity: newQuantity } : i))
          );
        } else {
          const data = {
            ...product,
            uid: user.uid,
            quantity: product.quantity || 1,
            addedAt: serverTimestamp(),
          };
          const docRef = doc(collection(db, COLLECTION));
          await setDoc(docRef, data);
          setCartItems(prev => [...prev, { ...data, _docId: docRef.id }]);
        }
      } catch (error) {
        console.error('[CartContext] addToCart error:', error);
        throw error;
      }
    },
    [user, cartItems]
  );

  const removeFromCart = useCallback(
    async itemId => {
      if (!user) throw new Error('Not logged in');
      const existing = cartItems.find(i => i.id === itemId);
      if (!existing) return;
      try {
        await deleteDoc(doc(db, COLLECTION, existing._docId));
        setCartItems(prev => prev.filter(i => i.id !== itemId));
      } catch (error) {
        console.error('[CartContext] removeFromCart error:', error);
        throw error;
      }
    },
    [user, cartItems]
  );

  const setQuantity = useCallback(
    async (itemId, quantity) => {
      if (!user) throw new Error('Not logged in');
      if (quantity < 1) return;
      const existing = cartItems.find(i => i.id === itemId);
      if (!existing) return;
      try {
        await updateDoc(doc(db, COLLECTION, existing._docId), { quantity });
        setCartItems(prev => prev.map(i => (i.id === itemId ? { ...i, quantity } : i)));
      } catch (error) {
        console.error('[CartContext] setQuantity error:', error);
        throw error;
      }
    },
    [user, cartItems]
  );

  // Calculate total considering coupon discount
  const getTotalValue = useMemo(() => {
    const total = cartItems.reduce(
      (acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 1),
      0
    );
    if (couponApplied && couponDiscountPercent > 0) {
      return +(total * (1 - couponDiscountPercent / 100)).toFixed(2);
    }
    return total;
  }, [cartItems, couponApplied, couponDiscountPercent]);

  const clearCart = useCallback(async () => {
    if (!user) throw new Error('Not logged in');
    try {
      await Promise.all(cartItems.map(item => deleteDoc(doc(db, COLLECTION, item._docId))));
      setCartItems([]);
      setCouponApplied(false);
      setCouponDiscountPercent(0);
    } catch (error) {
      console.error('[CartContext] clearCart error:', error);
    }
  }, [user, cartItems]);

  // Expose a function to apply coupon (could add validation here)
  const applyCoupon = (percent) => {
    if (!couponApplied) {
      setCouponApplied(true);
      setCouponDiscountPercent(percent);
    }
  };

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      setQuantity,
      getTotalValue,
      clearCart,
      loading,
      couponApplied,
      couponDiscountPercent,
      applyCoupon,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      setQuantity,
      getTotalValue,
      clearCart,
      loading,
      couponApplied,
      couponDiscountPercent,
      applyCoupon,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
