import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserOrders } from '../hooks/useUserOrders';
import { useLogoBase64 } from '../hooks/useLogoBase64';
import { useExportInvoice } from '../hooks/useExportInvoice';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const ORDER_STATUS_FLOW = [
  'Ordered',
  'Processing',
  'Shipped',
  'Out For Delivery',
  'Delivered',
  'Cancelled',
];

export default function UserOrdersPage() {
  const { user } = useAuth();
  const logoBase64 = useLogoBase64('/logo.png');
  const exportInvoice = useExportInvoice();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const filters = useMemo(() => {
    const result = {};
    if (statusFilter && statusFilter.toLowerCase() !== 'all') result.status = statusFilter;
    if (dateRange.startDate) result.startDate = dateRange.startDate;
    if (dateRange.endDate) result.endDate = dateRange.endDate;
    return result;
  }, [statusFilter, dateRange]);

  const {
    orders,
    loading,
    error,
    loadingMore,
    hasMore,
    loadMore,
    cancelOrder,
    cancelLoading,
  } = useUserOrders(user?.uid, filters);

  if (!user) {
    return (
      <div className="text-center mt-10 text-red-500 font-semibold">
        Please log in to view your orders.
      </div>
    );
  }

  const visibleOrders = orders;

  const canCancel = (status) => ['Processing', 'Ordered', 'Shipped'].includes(status);

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelOrder(id);
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been successfully cancelled.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel the order.',
        variant: 'destructive',
      });
    }
  };

  return (
   <main className="w-full max-w-5xl mx-auto p-6 flex-1 flex flex-col space-y-6">
      {/* Filters */}
      <section className="flex flex-wrap gap-4 items-center mb-6">
        <label className="flex items-center gap-2 whitespace-nowrap font-medium">
          <span>Status:</span>
          <select
            className="border rounded p-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            {ORDER_STATUS_FLOW.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Start Date:
          <input
            type="date"
            className="border rounded p-1 ml-1"
            value={dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : ''}
            onChange={(e) =>
              setDateRange((d) => ({
                ...d,
                startDate: e.target.value ? parseISO(e.target.value) : null,
              }))
            }
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            className="border rounded p-1 ml-1"
            value={dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : ''}
            onChange={(e) =>
              setDateRange((d) => ({
                ...d,
                endDate: e.target.value ? parseISO(e.target.value) : null,
              }))
            }
          />
        </label>
        <button
          className="ml-2 text-blue-600 underline"
          onClick={() => {
            setStatusFilter('all');
            setDateRange({ startDate: null, endDate: null });
          }}
          type="button"
        >
          Clear Filters
        </button>
      </section>

      {/* Loading and Error Handling */}
      {loading && orders.length === 0 && (
        <p className="p-10 text-center">Loading orders...</p>
      )}
      {error && (
        <p className="p-10 text-center text-red-600">Error: {error}</p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="p-10 text-center">No orders found.</p>
      )}

      {/* Orders List */}
      <section className="space-y-8 flex-grow overflow-auto">
        {visibleOrders.map((order) => {
          const createdAtDate = order.createdAt?.toDate
            ? order.createdAt.toDate()
            : new Date(order.createdAt);
          const createdAtFormatted = format(createdAtDate, 'PPP p');
          const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

          return (
            <article
              key={order.id}
              className="bg-white p-6 rounded shadow space-y-4"
            >
              <header className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    order.status === 'Processing'
                      ? 'bg-indigo-100 text-indigo-800'
                      : order.status === 'Ordered'
                      ? 'bg-blue-100 text-blue-800'
                      : order.status === 'Shipped'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'Out For Delivery'
                      ? 'bg-purple-600 text-white'
                      : order.status === 'Delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'Cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status}
                </span>
              </header>

              {/* Order Details */}
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>Date:</strong> {createdAtFormatted}
                </div>
                <div>
                  <strong>Shipping Address:</strong>
                  <address className="not-italic ml-3 space-y-0.5">
                    <div>{order.address?.fullName}</div>
                    <div>{order.address?.email}</div>
                    <div>{order.address?.address}</div>
                    <div>
                      {order.address?.city}, {order.address?.postalCode}
                    </div>
                    <div>{order.address?.country}</div>
                  </address>
                </div>
              </div>

              {/* Status Tracker */}
              <div className="flex items-center gap-2 flex-wrap text-sm">
                {ORDER_STATUS_FLOW.map((step, i) => (
                  <React.Fragment key={step}>
                    <span
                      className={`px-3 py-1 rounded font-semibold ${
                        i === statusIndex
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step}
                    </span>
                    {i !== ORDER_STATUS_FLOW.length - 1 && <span>➡️</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <strong>Items:</strong>
                {order.items?.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between bg-gray-50 p-3 rounded"
                  >
                    <div className="flex gap-4 items-center max-w-xs">
                      <img
                        src={item.image || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-sm">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right font-bold text-lg">
                Total: ₹{order.total.toFixed(2)}
              </div>

              {order.estimatedDelivery && (
                <div className="text-sm mt-2">
                  <strong>Estimated Delivery:</strong>{' '}
                  {format(
                    order.estimatedDelivery?.toDate
                      ? order.estimatedDelivery.toDate()
                      : new Date(order.estimatedDelivery),
                    'PPP'
                  )}
                </div>
              )}

              {order.trackingUrl && (
                <div className="mt-2 text-right">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Track Order
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-end items-center">
                <Button
                  disabled={!logoBase64}
                  onClick={() => exportInvoice(order)}
                  className={`px-4 py-2 ${
                    !logoBase64
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Download Invoice PDF
                </Button>

                {canCancel(order.status) && (
                  <Button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelLoading[order.id]}
                    variant="destructive"
                  >
                    {cancelLoading[order.id] ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Load More Button Pagination */}
      {hasMore && (
        <div className="text-center mt-6">
          <Button onClick={loadMore} disabled={loadingMore} className="inline-block">
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </main>
  );
}
