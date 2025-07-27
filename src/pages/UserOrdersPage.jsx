import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ORDERS_PER_PAGE = 5;

const UserOrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    });

    return () => unsubscribe();
  }, [user]);

  const cancelOrder = async (orderId) => {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status: 'Cancelled' });
  };

  const exportInvoice = (order) => {
  const docPDF = new jsPDF();

  const address = order.address || {};
  const addressText = `
${address.fullName || ""}
${address.address || ""}
${address.city || ""} - ${address.postalCode || ""}
${address.country || ""}
Email: ${address.email || ""}
`.trim();

  // HEADER
  docPDF.setFontSize(18);
  docPDF.text("WishlistCart", 10, 15);

  docPDF.setFontSize(12);
  docPDF.text(`Invoice`, 150, 15);
  docPDF.setFontSize(10);
  docPDF.text(`Order ID: ${order.id}`, 150, 22);
  docPDF.text(
    `Date: ${order.createdAt?.toDate?.()?.toLocaleString?.() || ""}`,
    150,
    28
  );

  // SHIPPING INFO
  docPDF.setFontSize(12);
  docPDF.text("Shipping Address:", 10, 30);
  docPDF.setFontSize(10);
  const lines = docPDF.splitTextToSize(addressText, 180);
  docPDF.text(lines, 10, 36);

  // TABLE
  const tableData = (order.items || []).map((item) => [
    item.name,
    item.quantity,
    `₹${item.price}`,
    `₹${item.quantity * item.price}`,
  ]);

  autoTable(docPDF, {
    startY: 50 + lines.length * 5,
    head: [["Item", "Qty", "Unit Price", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [22, 160, 133] },
  });

  const finalY = docPDF.lastAutoTable.finalY || 100;

  // TOTAL
  docPDF.setFontSize(12);
  docPDF.setTextColor(0);
  docPDF.text(`Total Amount Paid: ₹${order.total}`, 10, finalY + 10);

  // FOOTER
  docPDF.setFontSize(9);
  docPDF.setTextColor(100);
  docPDF.text(
    "Thank you for shopping with WishlistCart. For support, visit wishlistcart.com/support",
    10,
    finalY + 20
  );

  docPDF.save(`Invoice_Order_${order.id}.pdf`);
};


  const paginatedOrders = orders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);

  if (!user) {
    return (
      <div className="container mx-auto py-20 text-center">
        Please log in to view your orders.
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto py-20 text-center">
        No orders found.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold mb-6">My Orders</h2>
      <div className="space-y-8">
        {paginatedOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-md p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">Order #{order.id}</div>
              <div
                className={`text-sm px-3 py-1 rounded-full ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {order.status}
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
  <div>
    <strong>Date:</strong>{' '}
    {order.createdAt?.toDate?.()?.toLocaleString?.() || ''}
  </div>
  <div>
    <strong>Shipping Address:</strong>
    <div className="ml-2">
      <div>{order.address?.fullName}</div>
      <div>{order.address?.email}</div>
      <div>{order.address?.address}</div>
      <div>{order.address?.city} - {order.address?.postalCode}</div>
      <div>{order.address?.country}</div>
    </div>
  </div>
</div>


            <div className="space-y-2">
              <strong className="block text-md mb-1">Items:</strong>
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-right text-lg font-bold">
              Total: ₹{order.total}
            </div>

            <div className="mt-4">
              <strong className="block mb-1">Delivery Status:</strong>
              <div className="flex items-center gap-2 text-sm">
                {['Ordered', 'Shipped', 'Delivered'].map((step) => (
                  <>
                    <span
                      key={step}
                      className={`px-2 py-1 rounded ${
                        ['Ordered', 'Shipped', 'Delivered'].indexOf(order.status) >=
                        ['Ordered', 'Shipped', 'Delivered'].indexOf(step)
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step}
                    </span>
                    {step !== 'Delivered' && '➡️'}
                  </>
                ))}
              </div>
            </div>

            {order.trackingUrl && (
              <div className="mt-4 text-sm">
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Track Order
                </a>
              </div>
            )}

            <div className="flex justify-end items-center gap-4 mt-4">
              {order.status === 'Ordered' && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Cancel Order
                </button>
              )}
              <button
                onClick={() => exportInvoice(order)}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Download Invoice (PDF)
              </button>
            </div>

            <div className="mt-6 text-sm text-gray-600 border-t pt-4">
              Having an issue with this order?{' '}
              <a
                href="/support"
                className="text-blue-600 hover:underline font-medium"
              >
                Contact Support
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 rounded border text-sm ${
                currentPage === idx + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserOrdersPage;