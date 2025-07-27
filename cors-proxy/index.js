// server.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const puppeteer     = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotate User‑Agents
const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 ' +
    '(KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
];

// Helper to detect domain
const normalizeHostname = h => {
  h = h.toLowerCase();
  if (h.includes('amazon.') || h.includes('amzn.')) return 'amazon';
  if (h.includes('flipkart.'))                return 'flipkart';
  return 'generic';
};

// Semantic fallback extractor
const semanticScrape = () => {
  const clean = s => s?.replace(/\s+/g, ' ').trim() || '';
  const scoreFor = txt => {
    const t = txt.toLowerCase();
    if (!t) return 0;
    if (/[₹$]\s?\d+/.test(t)) return 5;
    if (t.includes('price') || t.includes('mrp')) return 3;
    if (t.includes('product') || t.includes('name')) return 2;
    return 1;
  };

  let bestTitle = '', bestPrice = '', bestImage = '';
  let titleScore = 0, priceScore = 0;

  document.querySelectorAll('body *').forEach(el => {
    const txt = clean(el.innerText);
    if (txt.length < 2) return;
    const sc = scoreFor(txt);
    const tag = el.tagName.toLowerCase();
    if (tag.startsWith('h') && sc > titleScore) {
      bestTitle = txt; titleScore = sc;
    }
    if (/[₹$]\s?\d+/.test(txt) && sc >= priceScore) {
      bestPrice = txt; priceScore = sc;
    }
  });

  const imgs = Array.from(document.images)
    .filter(i => i.naturalWidth > 100 && i.naturalHeight > 100 && i.src.startsWith('http'))
    .sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
  bestImage = imgs[0]?.src || '';

  return { title: bestTitle, price: bestPrice, image: bestImage };
};

app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL.' });

  let browser, page;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setUserAgent(UAS[Math.floor(Math.random() * UAS.length)]);

    // 1) Navigate and wait for all network calls (including price fetches)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2) JSON‑LD extraction
    const jsonLdData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(s => s.textContent).filter(Boolean);
      for (const txt of scripts) {
        try {
          const obj = JSON.parse(txt);
          if (obj['@type'] === 'Product') return obj;
          if (Array.isArray(obj)) {
            const prod = obj.find(i => i['@type'] === 'Product');
            if (prod) return prod;
          }
        } catch {}
      }
      return null;
    });

    let title = '', price = '', image = '', rating = '', seller = '';

    if (jsonLdData) {
      title = jsonLdData.name || '';
      image = Array.isArray(jsonLdData.image) ? jsonLdData.image[0] : jsonLdData.image || '';
      const offers = Array.isArray(jsonLdData.offers) ? jsonLdData.offers[0] : (jsonLdData.offers || {});
      if (offers.price) {
        price = offers.priceCurrency ? `${offers.priceCurrency} ${offers.price}` : offers.price.toString();
      }
      if (offers.seller?.name) seller = offers.seller.name;
      if (jsonLdData.aggregateRating?.ratingValue) {
        rating = `${jsonLdData.aggregateRating.ratingValue} out of 5`;
      }
    }

    // 3) Domain‑specific fallbacks
    const domain = normalizeHostname(new URL(url).hostname);

    if (domain === 'amazon' && (!title || !price || !image)) {
      // Try all known price selectors in turn
      const priceSelectors = [
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '#price_inside_buybox',
        '#corePrice_feature_div .a-offscreen'
      ];
      for (let sel of priceSelectors) {
        if (price) break;
        try {
          await page.waitForSelector(sel, { timeout: 5000 });
          price = await page.$eval(sel, el => el.textContent.trim());
        } catch {}
      }
      // Meta‑tag fallback
      if (!price) {
        const amt = await page.$eval('meta[property="product:price:amount"]', el => el.content).catch(() => null);
        const cur = await page.$eval('meta[property="product:price:currency"]', el => el.content).catch(() => null);
        if (amt) price = cur ? `${cur} ${amt}` : amt;
      }

      title  = title  || await page.$eval('#productTitle', el => el.textContent.trim()).catch(()=>'');
      image  = image  || await page.$eval(
        '#landingImage, #imgTagWrapperId img[data-old-hires]',
        el => el.src || el.getAttribute('data-old-hires')
      ).catch(()=>'');
      rating = rating || await page.$eval('#acrPopover', el => el.getAttribute('title').trim()).catch(()=>'');
      seller = seller || await page.$eval('#sellerProfileTriggerId', el => el.textContent.trim()).catch(()=>'');
      if (!seller) {
        seller = await page.$eval(
          '#merchant-info',
          el => (el.innerText.match(/Sold by\s+(.*)/) || [])[1]?.trim() || ''
        ).catch(()=>'');
      }
    }
    else if (domain === 'flipkart' && (!title || !price || !image)) {
      await page.waitForSelector('._30jeq3._16Jk6d, ._1vC4OE, span._16Jk6d', { timeout: 15000 });
      title = title || await page.$eval('span.B_NuCI, ._35KyD6', el => el.textContent.trim()).catch(()=>'');
      price = price || await page.$eval(
        '._30jeq3._16Jk6d, ._1vC4OE, span._16Jk6d',
        el => el.textContent.trim()
      ).catch(()=>'');
      image = image || await page.$eval(
        'img._396cs4._2amPTt._3qGmMb, img._2r_T1I, ._2r_T1I img',
        el => el.src
      ).catch(()=>'');
    }

    // 4) Semantic fallback
    if (!title || !price || !image) {
      const sem = await page.evaluate(semanticScrape);
      title = title || sem.title;
      price = price || sem.price;
      image = image || sem.image;
    }

    await browser.close();

    if (!title || !price || !image) {
      return res.status(404).json({
        error: 'Failed to extract required fields.',
        got: { title, price, image, rating, seller }
      });
    }

    return res.json({ title, price, image, rating, seller });
  } catch (err) {
    if (page)    await page.close();
    if (browser) await browser.close();
    console.error('❌ scrape error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/', (_, res) => res.send('✅ Scraper is running.'));
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'dattaharshithreddy@gmail.com',
    pass: process.env.EMAIL_PASS || 'dzez artr xgjc kztl',
  },
});

app.post('/send-invoice', async (req, res) => {
  try {
    const { order, email } = req.body;
    if (!order || !email) return res.status(400).json({ message: 'Missing order or email' });

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

    // ✅ FIX: use autoTable(doc, ...)
    autoTable(doc, {
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

    const logoPath = path.resolve(__dirname, 'logo.png');
    const logoExists = fs.existsSync(logoPath);

    const mailOptions = {
      from: process.env.EMAIL_USER || 'Wishlist2Cart <dattaharshithreddy@gmail.com>',
      to: email,
      subject: `Your Wishlist2Cart Invoice - Order #${order.id || ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin:auto;">
          ${logoExists ? `<img src="cid:whishlistLogo" alt="Wishlist2Cart Logo" style="width:140px; margin-bottom: 20px;" />` : ''}
          <h2 style="color:#2255A4;">Hello, ${userName}</h2>
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
            ${address.fullName}<br/>
            ${address.streetAddress || address.address || ''}<br/>
            ${address.city} - ${address.postalCode}<br/>
            ${address.country}<br/>
            ${address.phone ? 'Phone: ' + address.phone : ''}
          </p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br/>Wishlist2Cart Team</p>
        </div>
      `,
      attachments: [
        ...(logoExists ? [{
          filename: 'logo.png',
          path: logoPath,
          cid: 'whishlistLogo',
        }] : []),
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

const shutdown = async () => {
  if (browser) {
    await browser.close();
    console.log('Browser instance closed');
  }
  process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

