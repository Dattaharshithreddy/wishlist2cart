import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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

const WishlistContext = createContext();

const UNIVERSAL_COLLECTION = 'wishlist_items';
const W2C_COLLECTION = 'wishlist_w2c';

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [w2cItems, setW2cItems] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setWishlistItems([]);
        setW2cItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Fetch universal wishlist
        const qUniversal = query(
          collection(db, UNIVERSAL_COLLECTION),
          where('uid', '==', user.uid)
        );
        const snapUniversal = await getDocs(qUniversal);
        const universalData = snapUniversal.docs.map((docSnap) => ({
          ...docSnap.data(),
          _docId: docSnap.id,
        }));

        // Fetch W2C wishlist
        const qW2C = query(collection(db, W2C_COLLECTION), where('uid', '==', user.uid));
        const snapW2C = await getDocs(qW2C);
        const w2cData = snapW2C.docs.map((docSnap) => ({
          ...docSnap.data(),
          _docId: docSnap.id,
        }));

        setWishlistItems(universalData);
        setW2cItems(w2cData);
      } catch (error) {
        console.error('[WishlistProvider] Failed to fetch wishlists:', error);
        setWishlistItems([]);
        setW2cItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addToWishlist = useCallback(
    async (product) => {
      if (!user) throw new Error('Not logged in');
      setWishlistItems((prev) => {
        // Prevent duplicates
        if (prev.find((i) => i.id === product.id)) return prev;
        return prev; // We'll update after Firestore operation
      });

      try {
        const data = {
          ...product,
          uid: user.uid,
          quantity: product.quantity || 1,
          addedAt: serverTimestamp(),
          sourceType: 'universal',
        };
        const docRef = doc(collection(db, UNIVERSAL_COLLECTION));
        await setDoc(docRef, data);
        // Update state using functional update
        setWishlistItems((prev) => [...prev, { ...data, _docId: docRef.id }]);
      } catch (error) {
        console.error('[WishlistProvider] addToWishlist error:', error);
        throw error;
      }
    },
    [user]
  );

  const addToW2C = useCallback(
    async (product) => {
      if (!user) throw new Error('Not logged in');
      setW2cItems((prev) => {
        if (prev.find((i) => i.id === product.id)) return prev;
        return prev;
      });
      try {
        const data = {
          ...product,
          uid: user.uid,
          quantity: product.quantity || 1,
          addedAt: serverTimestamp(),
          sourceType: 'w2c',
        };
        const docRef = doc(collection(db, W2C_COLLECTION));
        await setDoc(docRef, data);
        setW2cItems((prev) => [...prev, { ...data, _docId: docRef.id }]);
      } catch (error) {
        console.error('[WishlistProvider] addToW2C error:', error);
        throw error;
      }
    },
    [user]
  );

  const removeFromWishlist = useCallback(
    async (itemId, source = 'universal') => {
      if (!user) throw new Error('Not logged in');
      const list = source === 'universal' ? wishlistItems : w2cItems;
      const exists = list.find((i) => i.id === itemId);
      if (!exists) return;
      try {
        const collectionName = source === 'universal' ? UNIVERSAL_COLLECTION : W2C_COLLECTION;
        await deleteDoc(doc(db, collectionName, exists._docId));

        if (source === 'universal') {
          setWishlistItems((prev) => prev.filter((i) => i.id !== itemId));
        } else {
          setW2cItems((prev) => prev.filter((i) => i.id !== itemId));
        }
      } catch (error) {
        console.error(`[WishlistProvider] removeFromWishlist error (${source}):`, error);
        throw error;
      }
    },
    [user, wishlistItems, w2cItems]
  );

  const updateItem = useCallback(
    async (itemId, updatedFields, source = 'universal') => {
      if (!user) throw new Error('Not logged in');
      const list = source === 'universal' ? wishlistItems : w2cItems;
      const exists = list.find((i) => i.id === itemId);
      if (!exists) return;
      try {
        const collectionName = source === 'universal' ? UNIVERSAL_COLLECTION : W2C_COLLECTION;
        await updateDoc(doc(db, collectionName, exists._docId), updatedFields);

        if (source === 'universal') {
          setWishlistItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, ...updatedFields } : i))
          );
        } else {
          setW2cItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, ...updatedFields } : i))
          );
        }
      } catch (error) {
        console.error(`[WishlistProvider] updateItem error (${source}):`, error);
        throw error;
      }
    },
    [user, wishlistItems, w2cItems]
  );

  const updateQuantity = useCallback(
    (itemId, quantity, source = 'universal') => {
      if (quantity < 1) return;
      updateItem(itemId, { quantity }, source);
    },
    [updateItem]
  );

  const toggleCartStatus = useCallback(
    async (itemId, source = 'universal') => {
      if (!user) throw new Error('Not logged in');
      const list = source === 'universal' ? wishlistItems : w2cItems;
      const item = list.find((i) => i.id === itemId);
      if (!item) return;
      try {
        await updateItem(itemId, { inCart: !item.inCart }, source);
      } catch (error) {
        console.error(`[WishlistProvider] toggleCartStatus error (${source}):`, error);
        throw error;
      }
    },
    [user, wishlistItems, w2cItems, updateItem]
  );

  const clearWishlist = useCallback(
    async (source = 'universal') => {
      if (!user) throw new Error('Not logged in');
      const collectionName = source === 'universal' ? UNIVERSAL_COLLECTION : W2C_COLLECTION;
      const list = source === 'universal' ? wishlistItems : w2cItems;
      try {
        await Promise.all(list.map((item) => deleteDoc(doc(db, collectionName, item._docId))));

        if (source === 'universal') {
          setWishlistItems([]);
        } else {
          setW2cItems([]);
        }
      } catch (error) {
        console.error(`[WishlistProvider] clearWishlist error (${source}):`, error);
        throw error;
      }
    },
    [user, wishlistItems, w2cItems]
  );

  const value = useMemo(
    () => ({
      wishlistItems,
      w2cItems,
      addToWishlist,
      addToW2C,
      removeFromWishlist,
      updateItem,
      updateQuantity,
      toggleCartStatus,
      clearWishlist,
      loading,
      user,
    }),
    [
      wishlistItems,
      w2cItems,
      addToWishlist,
      addToW2C,
      removeFromWishlist,
      updateItem,
      updateQuantity,
      toggleCartStatus,
      clearWishlist,
      loading,
      user,
    ]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
