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

const COLLECTION = 'cart_items'; // Your Firestore collection name

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch cart items for the logged-in user
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
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
        console.error('[CartContext] Failed to fetch:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [user]);

  // Add item to cart or increase quantity if exists
  const addToCart = useCallback(
    async (product) => {
      if (!user) throw new Error('Not logged in');
      const existing = cartItems.find(i => i.id === product.id);
      try {
        if (existing) {
          const newQuantity = (existing.quantity || 1) + 1;
          await updateDoc(doc(db, COLLECTION, existing._docId), { quantity: newQuantity });
          setCartItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: newQuantity } : i));
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

  // Remove item from cart
  const removeFromCart = useCallback(
    async (itemId) => {
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

  // Set item quantity
  const setQuantity = useCallback(
    async (itemId, quantity) => {
      if (!user) throw new Error('Not logged in');
      if (quantity < 1) return;
      const existing = cartItems.find(i => i.id === itemId);
      if (!existing) return;
      try {
        await updateDoc(doc(db, COLLECTION, existing._docId), { quantity });
        setCartItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
      } catch (error) {
        console.error('[CartContext] setQuantity error:', error);
        throw error;
      }
    },
    [user, cartItems]
  );

  // Calculate total without coupon discount
  const getTotalValue = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 1), 0);
  }, [cartItems]);

  // Clear cart
  const clearCart = useCallback(async () => {
    if (!user) throw new Error('Not logged in');
    try {
      await Promise.all(cartItems.map(item => deleteDoc(doc(db, COLLECTION, item._docId))));
      setCartItems([]);
    } catch (error) {
      console.error('[CartContext] clearCart error:', error);
    }
  }, [user, cartItems]);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    setQuantity,
    getTotalValue,
    clearCart,
    loading,
  }), [
    cartItems,
    addToCart,
    removeFromCart,
    setQuantity,
    getTotalValue,
    clearCart,
    loading,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
