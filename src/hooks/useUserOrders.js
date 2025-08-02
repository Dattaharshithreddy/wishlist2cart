import { useEffect, useState, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  startAfter,
  limit,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const ORDERS_PER_PAGE = 5;

export function useUserOrders(userId, filters) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cancelLoading, setCancelLoading] = useState({}); // per-order loading state
  const lastDocRef = useRef(null);

  const fetchOrders = useCallback(
    async (isLoadMore = false) => {
      if (!userId) return;

      try {
        isLoadMore ? setLoadingMore(true) : setLoading(true);
        setError(null);

        const constraints = [
          collection(db, 'orders'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
        ];

        if (filters.status && filters.status.toLowerCase() !== 'all') {
          constraints.push(where('status', '==', filters.status));
        }

        if (filters.startDate) {
          constraints.push(where('createdAt', '>=', Timestamp.fromDate(filters.startDate)));
        }
        if (filters.endDate) {
          constraints.push(where('createdAt', '<=', Timestamp.fromDate(filters.endDate)));
        }

        if (isLoadMore && lastDocRef.current) {
          constraints.push(startAfter(lastDocRef.current));
        }

        constraints.push(limit(ORDERS_PER_PAGE));

        const ordersQuery = query(...constraints);
        const snapshot = await getDocs(ordersQuery);

        const newOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (isLoadMore) {
          setOrders(prev => [...prev, ...newOrders]);
        } else {
          setOrders(newOrders);
        }

        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
        setHasMore(snapshot.docs.length === ORDERS_PER_PAGE);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
        console.error(err);
      } finally {
        isLoadMore ? setLoadingMore(false) : setLoading(false);
      }
    },
    [userId, filters]
  );

  useEffect(() => {
    lastDocRef.current = null;
    setOrders([]);
    fetchOrders();
  }, [fetchOrders]);

  const loadMore = () => {
    if (!loadingMore && hasMore) fetchOrders(true);
  };

  const cancelOrder = useCallback(async (orderId) => {
    if (!orderId) return;

    setCancelLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'Cancelled' });

      setOrders(prev =>
        prev.map(order => (order.id === orderId ? { ...order, status: 'Cancelled' } : order))
      );
    } catch (err) {
      console.error('Cancel order failed:', err);
      throw err;
    } finally {
      setCancelLoading(prev => ({ ...prev, [orderId]: false }));
    }
  }, []);

  return {
    orders,
    loading,
    error,
    loadingMore,
    hasMore,
    loadMore,
    cancelOrder,
    cancelLoading,
  };
}
