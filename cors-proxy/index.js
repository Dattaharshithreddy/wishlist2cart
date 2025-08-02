require('dotenv').config();

const path = require('path'); // keeping in case needed elsewhere
const fs = require('fs');

console.log('[Startup] Initializing application...');
const express = require('express');
const cors = require('cors');
const Razorpay = require("razorpay");
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const crypto = require("crypto");
const nodemailer = require('nodemailer');

// ✅ Correctly extend jsPDF with autoTable
const admin = require("firebase-admin");
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

console.log('[Startup] All dependencies loaded.');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
console.log('[Startup] Firebase initialized.');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
console.log('[Startup] Razorpay client configured.');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
console.log('[Startup] Nodemailer configured.');

const app = express();
const PORT = process.env.PORT || 8080;
app.use(cors());

// Health check
app.get('/', (_, res) => res.send('✅ API is running.'));

// Webhook (before JSON parser)
app.post("/payment-success-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const payload = req.body.toString("utf8");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(payload)
      .digest("hex");

    if (!signature) return res.status(400).send("Missing signature header");

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(signature, 'hex')))
      return res.status(400).send("Invalid signature");

    const webhookBody = JSON.parse(payload);
    const orderId = webhookBody?.payload?.payment?.entity?.order_id;

    if (orderId) {
      await db.collection("orders").doc(orderId).update({
        status: "Ordered",
        paymentId: webhookBody.payload.payment.entity.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Order ${orderId} marked as Ordered`);
    }

    res.status(200).send("Webhook handled");
  } catch (err) {
    console.error("❌ Error in webhook:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.use(express.json());

app.post("/add-item", async (req, res) => {
  try {
    const { userId, url, title, price, image } = req.body;
    if (!userId || !url || !title || !price || !image)
      return res.status(400).send("Missing required product information.");

    const wishlistItem = { url, title, price, image, addedAt: new Date() };
    const wishlistRef = db.collection('wishlists').doc(userId);
    await wishlistRef.set({ items: admin.firestore.FieldValue.arrayUnion(wishlistItem) }, { merge: true });

    res.status(200).json({ message: "Item added to wishlist successfully!" });
  } catch (error) {
    console.error("❌ Error adding item to wishlist:", error);
    res.status(500).send("Failed to add item to wishlist.");
  }
});

app.post("/create-order", async (req, res) => {
  try {
    // ✅ Receive all the data from the frontend
    const { amount, currency = "INR", receipt, items, address, userId } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt
    });

    // ✅ Create ONE document using the Razorpay Order ID as the Firestore Document ID
    await db.collection("orders").doc(order.id).set({
      userId: userId,
      razorpayOrderId: order.id, // Store the ID for easier querying
      amount: amount,
      items: items,
      address: address,
      status: "Pending", // The correct initial status
      createdAt: new Date(),
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).send("Order creation failed");
  }
});

app.post('/send-invoice', async (req, res) => {
  try {
    const { order, email } = req.body;
    if (!order || !email)
      return res.status(400).json({ message: 'Missing order or email' });

    const userName = order.userName || (order.address && order.address.fullName) || 'Valued Customer';
    const address = order.address || {};
    const items = order.items || order.cartItems || [];

    const createdAt =
      order.createdAt && typeof order.createdAt.toDate === 'function'
        ? order.createdAt.toDate().toLocaleString()
        : order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : 'N/A';

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Wishlist2Cart Invoice', 15, 22);

    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id || 'N/A'}`, 15, 32);
    doc.text(`Customer: ${userName}`, 15, 38);
    doc.text(`Date: ${createdAt}`, 15, 44);

    doc.setFontSize(14);
    doc.text('Shipping Address:', 15, 54);
    doc.setFontSize(10);

    const addressLines = [
      address.fullName || '',
      address.streetAddress || address.address || '',
      `${address.city || ''} - ${address.postalCode || ''}`,
      address.country || '',
      address.phone ? `Phone: ${address.phone}` : '',
    ].filter(Boolean);

    doc.text(addressLines.join('\n'), 15, 60);

    const tableRows = items.map(item => [
      item.title || item.name || 'Item',
      item.quantity || 1,
      item.price ? `₹${item.price.toFixed(2)}` : '-',
      item.originalPrice ? `₹${item.originalPrice.toFixed(2)}` : '-',
    ]);

    // ✅ FIXED: Use doc.autoTable
    doc.autoTable({
      startY: 80,
      head: [['Product', 'Qty', 'Price', 'Original Price']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [22, 160, 133] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Order Total Paid: ₹${Number(order.total || 0).toFixed(2)}`, 15, finalY);
    doc.text(`Payment Method: ${order.paymentMethod || '-'}`, 15, finalY + 8);
    doc.text(`Estimated Delivery: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : '-'}`, 15, finalY + 16);

    doc.setFontSize(10);
    doc.text('Thank you for shopping with Wishlist2Cart!', 15, finalY + 28);

    const pdfBuffer = doc.output('arraybuffer');

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Wishlist2Cart <dattaharshithreddy@gmail.com>',
      to: email,
      subject: `Your Wishlist2Cart Invoice - Order #${order.id || ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto;">
          <h2 style="color:#2255A4;"><span style="font-size: 24px;">🛒</span> <strong>${userName}</strong></h2>
          <p>Thank you for your purchase. Please find your invoice attached below.</p>
          <h3>Order Details</h3>
          <ul>
            <li><strong>Order ID:</strong> ${order.id || '-'}</li>
            <li><strong>Total:</strong> ₹${Number(order.total || 0).toFixed(2)}</li>
            <li><strong>Payment Method:</strong> ${order.paymentMethod || '-'}</li>
            <li><strong>Estimated Delivery:</strong> ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : '-'}</li>
          </ul>
          <h3>Shipping Address</h3>
          <p>
            ${address.fullName || ''}<br/>
            ${address.streetAddress || address.address || ''}<br/>
            ${address.city ? address.city + ' - ' : ''}${address.postalCode || ''}<br/>
            ${address.country || ''}<br/>
            ${address.phone ? 'Phone: ' + address.phone : ''}
          </p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>Wishlist2Cart Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice_${order.id || 'order'}.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invoice sent to ${email}`);
    return res.status(200).json({ message: 'Invoice sent successfully' });

  } catch (error) {
    console.error('❌ Error sending invoice:', error.stack || error);
    return res.status(500).json({ message: 'Failed to send invoice', error: error.message });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] ✅ Server is running and listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully.');
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully.');
  server.close(() => process.exit(0));
});
