// src/pages/OrderDetailPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const ORDER_STATUS_FLOW = ['Ordered', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'];

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simple role check — improve as needed
  const isAdmin = user?.email === 'admin@example.com';

  useEffect(() => {
    async function fetchOrder() {
      try {
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setOrder({ id: docSnap.id, ...docSnap.data() });
        else setError('Order not found.');
      } catch {
        setError('Failed to load order.');
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const updateStatus = useCallback(async newStatus => {
    if (!order) return;
    if (newStatus === 'Cancelled' && ['Shipped', 'Delivered'].includes(order.status)) {
      alert('Cannot cancel an order already shipped or delivered.');
      return;
    }
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { status: newStatus });
      setOrder(prev => ({ ...prev, status: newStatus }));
      alert('Status updated.');
    } catch {
      alert('Failed to update status.');
    }
  }, [order]);

  if (loading) return <p className="p-6">Loading order...</p>;
  if (error) return <p className="text-red-600 p-6">{error}</p>;
  if (!order) return <p className="p-6">No order found.</p>;

  const createdAtFormatted = order.createdAt?.toDate ? format(order.createdAt.toDate(), 'PPPp') : '';
  const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 underline">← Back to Orders</button>

      <h1 className="text-2xl font-bold">Order #{order.id}</h1>

      <section>
        <div className="text-sm text-gray-700 mb-4">
          <strong>Order Date:</strong> {createdAtFormatted}
        </div>

        <div className="flex items-center gap-2 text-sm flex-wrap mb-6" role="list" aria-label="Order delivery progress">
          {ORDER_STATUS_FLOW.map((step, i) => {
            const completed = i <= statusIndex;
            return (
              <React.Fragment key={step}>
                <span
                  role="listitem"
                  aria-current={order.status === step ? 'step' : undefined}
                  className={`px-3 py-1 rounded font-semibold whitespace-nowrap ${completed ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}
                >
                  {step}
                </span>
                {i !== ORDER_STATUS_FLOW.length - 1 && <span aria-hidden="true">➡️</span>}
              </React.Fragment>
            );
          })}
        </div>

        {order.estimatedDelivery && (
          <p><strong>Estimated Delivery:</strong> {order.estimatedDelivery.toDate ? format(order.estimatedDelivery.toDate(), 'PPP') : new Date(order.estimatedDelivery).toLocaleDateString()}</p>
        )}

        {order.trackingUrl && (
          <p>
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Track Order</a>
          </p>
        )}

        <div className="mt-4">
          <h2 className="font-semibold">Shipping Address</h2>
          <address className="not-italic ml-2 space-y-1">
            <div>{order.address?.fullName}</div>
            <div>{order.address?.email}</div>
            <div>{order.address?.address}</div>
            <div>{order.address?.city} - {order.address?.postalCode}</div>
            <div>{order.address?.country}</div>
          </address>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-2">Items</h2>
          <ul className="list-disc list-inside space-y-1">
            {order.items?.map(item => (
              <li key={item.id || item.name}>
                {item.name} — Qty: {item.quantity} — ₹{(item.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 font-bold text-lg">Total Paid: ₹{order.total.toFixed(2)}</p>
      </section>

      {isAdmin && (
        <section className="mt-6">
          <h2 className="font-semibold mb-2">Admin: Update Order Status</h2>
          <select
            value={order.status}
            onChange={e => updateStatus(e.target.value)}
            disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
            className="border p-2 rounded"
          >
            {ORDER_STATUS_FLOW.map(status => (
              <option key={status} value={status} disabled={order.status === 'Cancelled'}>
                {status}
              </option>
            ))}
          </select>
        </section>
      )}
    </main>
  );
}
