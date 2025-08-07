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
    <main className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 flex-1 flex flex-col space-y-4 sm:space-y-6 text-gray-800 dark:text-gray-100">
      {/* Filters */}
      <section className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-stretch sm:items-center mb-4 sm:mb-6">
        <label className="flex items-center gap-2 whitespace-nowrap font-medium">
          <span>Status:</span>
          <select
            className="w-full sm:w-auto border rounded p-1 dark:bg-gray-800 dark:border-gray-600"
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
        <label className="flex items-center gap-2">
          Start Date:
          <input
            type="date"
            className="w-full sm:w-auto border rounded p-1 dark:bg-gray-800 dark:border-gray-600"
            value={dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : ''}
            onChange={(e) =>
              setDateRange((d) => ({
                ...d,
                startDate: e.target.value ? parseISO(e.target.value) : null,
              }))
            }
          />
        </label>
        <label className="flex items-center gap-2">
          End Date:
          <input
            type="date"
            className="w-full sm:w-auto border rounded p-1 dark:bg-gray-800 dark:border-gray-600"
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
          className="ml-0 sm:ml-2 text-blue-600 dark:text-blue-400 underline"
          onClick={() => {
            setStatusFilter('all');
            setDateRange({ startDate: null, endDate: null });
          }}
          type="button"
        >
          Clear Filters
        </button>
      </section>

      {/* Loading and Error States */}
      {loading && orders.length === 0 && (
        <p className="p-10 text-center text-gray-500">Loading orders...</p>
      )}
      {error && (
        <p className="p-10 text-center text-red-600 dark:text-red-400">Error: {error}</p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="p-10 text-center text-gray-600 dark:text-gray-400">No orders found.</p>
      )}

      {/* Orders List */}
      <section className="space-y-5 sm:space-y-8 flex-grow overflow-auto">
        {visibleOrders.map((order) => {
          const createdAtDate = order.createdAt?.toDate
            ? order.createdAt.toDate()
            : new Date(order.createdAt);
          const createdAtFormatted = format(createdAtDate, 'PPP p');
          const statusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

          return (
            <article
              key={order.id}
              className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded shadow space-y-3 sm:space-y-4 border border-gray-200 dark:border-gray-700"
            >
              <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h2 className="text-lg sm:text-xl font-semibold break-all">Order #{order.id}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                    order.status === 'Processing'
                      ? 'bg-indigo-100 dark:bg-indigo-800/30 text-indigo-800 dark:text-indigo-200'
                      : order.status === 'Ordered'
                      ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-200'
                      : order.status === 'Shipped'
                      ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200'
                      : order.status === 'Out For Delivery'
                      ? 'bg-purple-600 text-white'
                      : order.status === 'Delivered'
                      ? 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-200'
                      : order.status === 'Cancelled'
                      ? 'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {order.status}
                </span>
              </header>

              {/* Order Info */}
              <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                <div>
                  <strong>Date:</strong> {createdAtFormatted}
                </div>
                <div>
                  <strong>Shipping Address:</strong>
                  <address className="not-italic ml-1.5 sm:ml-3 space-y-0.5 break-all">
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
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm overflow-x-auto">
                {ORDER_STATUS_FLOW.map((step, i) => (
                  <React.Fragment key={step}>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded font-semibold ${
                        i === statusIndex
                          ? 'bg-purple-600 text-white shadow'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {step}
                    </span>
                    {i !== ORDER_STATUS_FLOW.length - 1 && <span className="text-gray-400">➡️</span>}
                  </React.Fragment>
                ))}
              </div>

              {/* Items List */}
              <div className="space-y-1.5 sm:space-y-2">
                <strong>Items:</strong>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row justify-between bg-gray-50 dark:bg-gray-700 p-2 sm:p-3 rounded"
                  >
                    <div className="flex gap-2 sm:gap-4 items-center max-w-full sm:max-w-xs">
                      <img
                        src={item.image || '/placeholder.jpg'}
                        alt={item.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
                      />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.name}</div>
                        <div className="text-xs sm:text-sm">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="font-semibold mt-1 sm:mt-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right font-bold text-base sm:text-lg">
                Total: ₹{order.total.toFixed(2)}
              </div>

              {order.estimatedDelivery && (
                <div className="text-xs sm:text-sm mt-1.5 sm:mt-2">
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
                <div className="mt-1.5 text-right">
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline"
                  >
                    Track Order
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-end items-stretch sm:items-center w-full">
                <Button
                  disabled={!logoBase64}
                  onClick={() => exportInvoice(order)}
                  className={`w-full sm:w-auto px-4 py-2 ${
                    !logoBase64
                      ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Download Invoice PDF
                </Button>
                {canCancel(order.status) && (
                  <Button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelLoading[order.id]}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    {cancelLoading[order.id] ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center mt-4 sm:mt-6">
          <Button onClick={loadMore} disabled={loadingMore} className="w-full sm:w-auto">
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </main>
  );
}
