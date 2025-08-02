const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const jsPDF = require('jspdf');
require('jspdf-autotable');

// Load Gmail creds from Firebase environment config
require('dotenv').config();

const gmailUser = process.env.EMAIL_USER;
const gmailPass = process.env.EMAIL_PASS;


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  // tls: { rejectUnauthorized: false }, // optional if you face TLS issues
});

exports.sendInvoice = functions.https.onRequest(async (req, res) => {
  const { order, email } = req.body;

  if (!order || !email) {
    return res.status(400).send('Missing order or email.');
  }

  try {
    const address = order.shippingAddress || order.address || {};

    const doc = new jsPDF();

    // PDF Header
    doc.setFontSize(18);
    doc.text('Wishlist2Cart Invoice', 15, 20);
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id}`, 15, 30);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}`, 15, 38);

    // Shipping Address
    doc.setFontSize(14);
    doc.text('Shipping Address:', 15, 48);
    doc.setFontSize(10);
    const addressText = `
${address.fullName || ''}
${address.streetAddress || address.address || ''}
${address.city || ''} - ${address.postalCode || ''}
${address.country || ''}
Phone: ${address.phone || 'N/A'}
`;
    const splitAddress = doc.splitTextToSize(addressText.trim(), 180);
    doc.text(splitAddress, 15, 54);

    // Line items
    const cartItems = Array.isArray(order.cartItems) ? order.cartItems : [];
    const rows = cartItems.map(item => {
      const tax = (item.price * 0.18).toFixed(2);
      const total = ((item.price * item.quantity) + parseFloat(tax)).toFixed(2);
      return [
        item.title || 'Untitled',
        item.quantity || 1,
        `₹${(item.price || 0).toFixed(2)}`,
        `₹${tax}`,
        `₹${total}`,
      ];
    });

    // Table with items
    try {
      doc.autoTable({
        startY: 75 + splitAddress.length * 5,
        head: [['Item', 'Qty', 'Price', 'GST (18%)', 'Total']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [22, 160, 133] },
      });
    } catch (pdfErr) {
      console.error('❌ PDF table generation failed:', pdfErr);
    }

    // Total
    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : 120;
    const totalAmount = order.totalValue ?? order.total ?? 0;
    doc.setFontSize(12);
    doc.text(`Grand Total: ₹${Number(totalAmount).toFixed(2)}`, 15, finalY);

    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for shopping with Wishlist2Cart!', 15, finalY + 15);
    doc.text('For support, visit wishlistcart.com/support', 15, finalY + 22);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const mailOptions = {
      from: `Wishlist2Cart <${gmailUser}>`,
      to: email,
      subject: `Your Wishlist2Cart Invoice - Order #${order.id}`,
      text: `
Dear Customer,

Thank you for your purchase! Please find attached the invoice for your order #${order.id}.

If you have any questions or need assistance, feel free to contact our support team.

Best regards,
Wishlist2Cart Team
      `,
      attachments: [
        {
          filename: `invoice_${order.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Invoice sent to ${email}`);

    return res.status(200).send('Email sent!');
  } catch (error) {
    console.error('❌ Mail error:', error.stack || error.message || error);
    return res.status(500).send('Failed to send email.');
  }
});
