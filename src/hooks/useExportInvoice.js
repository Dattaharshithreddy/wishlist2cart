import { useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// SVG for white cart icon in blue circle
const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
  <circle cx="30" cy="30" r="30" fill="#1976D2"/>
  <g transform="translate(13,13)">
    <path fill="#fff" d="M6 36a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm22.68-5.6l2.74-4.92A1.5 1.5 0 0 0 30 24H18.42l-.46-2H32a1 1 0 0 0 0-2H17.56l-.94-4H11a1 1 0 1 0 0 2h4.38l3.02 12.07A4 4 0 1 0 21 34h10a4 4 0 0 0 3.68-2.6zM23 34a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
  </g>
</svg>`;

// Utility: convert SVG string to PNG Data URL (works in modern browsers)
function svgToPngDataUrl(svgText, width = 60, height = 60) {
  return new Promise((resolve) => {
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new window.Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = url;
  });
}

export function useExportInvoice() {
  return useCallback(async (order) => {
    const docPDF = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    // Render logo (svg as png)
    const pngDataUrl = await svgToPngDataUrl(svgString, 60, 60);
    if (pngDataUrl) {
      docPDF.addImage(pngDataUrl, 'PNG', margin, y, 60, 60);
    }

    // Company name and title
    docPDF.setFontSize(22);
    docPDF.setTextColor('#1976D2');
    docPDF.setFont('helvetica', 'bold');
    docPDF.text('WishlistCart', margin + 70, y + 36);
    y += 70;

    // Greeting
    docPDF.setFontSize(14);
    docPDF.setTextColor('#333');
    docPDF.setFont('helvetica', 'normal');
    docPDF.text('Thank you for shopping with WishlistCart!', margin, y);
    y += 28;

    // Invoice heading
    docPDF.setFontSize(17);
    docPDF.setFont('helvetica', 'bold');
    docPDF.text('Invoice', margin, y);

    // Order ID & Date - right aligned, large enough area
    docPDF.setFontSize(11);
    docPDF.setFont('helvetica', 'normal');
    const rightEdge = docPDF.internal.pageSize.width - margin;
    docPDF.text(`Order ID: ${order.id}`, rightEdge, margin + 30, { align: 'right', maxWidth: 240 });
    const createdAt = order.createdAt?.toDate?.();
    docPDF.text(
      `Date: ${createdAt ? format(createdAt, 'PPPp') : 'N/A'}`,
      rightEdge,
      margin + 50,
      { align: 'right', maxWidth: 240 }
    );
    y += 24;

    // Shipping Address
    const address = order.address || {};
    const addressLines = [
      address.fullName || '',
      address.address || '',
      `${address.city || ''} - ${address.postalCode || ''}`,
      address.country || '',
      address.email ? `Email: ${address.email}` : ''
    ].filter(Boolean);

    docPDF.setFontSize(14);
    docPDF.setFont('helvetica', 'bold');
    docPDF.setTextColor('#222');
    docPDF.text('Shipping Address:', margin, y);
    y += 18;

    docPDF.setFontSize(11);
    docPDF.setFont('helvetica', 'normal');
    docPDF.text(addressLines, margin, y, { maxWidth: 300, lineHeightFactor: 1.2 });
    y += addressLines.length * 14 + 22;

    // Items table
    const items = (order.items || []).map(item => [
      item.name,
      item.quantity?.toString() ?? '',
      `₹${Number(item.price).toFixed(2)}`,
      `₹${(item.price * item.quantity).toFixed(2)}`
    ]);
    autoTable(docPDF, {
      startY: y,
      head: [['Item', 'Qty', 'Unit Price', 'Total']],
      body: items,
      styles: {
        fontSize: 11,
        cellPadding: 6,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'right', cellWidth: 70 },
        3: { halign: 'right', cellWidth: 70 }
      },
      margin: { left: margin, right: margin },
      didDrawPage: () => {
        const footerY = docPDF.internal.pageSize.height - 30;
        docPDF.setFontSize(9);
        docPDF.setTextColor('#888');
        docPDF.text(
          'If you have any questions about your order, please contact support@wishlistcart.com',
          margin,
          footerY,
          { maxWidth: 520 }
        );
      }
    });

    const tableEnd = docPDF.lastAutoTable.finalY || y + 70;
    docPDF.setFontSize(14);
    docPDF.setTextColor('#111');
    docPDF.setFont('helvetica', 'bold');
    docPDF.text(`Total Amount Paid: ₹${Number(order.total).toFixed(2)}`, margin, tableEnd + 36);

    docPDF.save(`WishlistCart_Invoice_Order_${order.id}.pdf`);
  }, []);
}
