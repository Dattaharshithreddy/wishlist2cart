import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import {
  Link as LinkIcon,
  Tag,
  Plus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { shootConfetti } from '@/lib/utils';
import useSound from 'use-sound';
import confettiSfx from '@/assets/success.mp3';

const blockedDomains = [
  'yourw2cstore.com',
  'your-affiliate-domain.com',
];

const WishlistIntegrationPage = () => {
  const [pageState, setPageState] = useState('idle'); // 'idle' | 'fetching' | 'preview' | 'error'
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [fetchedData, setFetchedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToWishlist } = useWishlist();
  const [playConfetti] = useSound(confettiSfx, { volume: 0.5 });

  // Check if URL is from blocked domains
  const isInternalOrAffiliateUrl = (inputUrl) => {
    try {
      const hostname = new URL(inputUrl).hostname.toLowerCase();
      return blockedDomains.some(domain => hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleFetch = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({ title: 'URL Required', description: 'Please paste a product URL.', variant: 'destructive' });
      return;
    }

    try {
      new URL(url);
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid URL.', variant: 'destructive' });
      return;
    }

    setPageState('fetching');
    setFetchedData(null);
    setErrorMessage('');

    const PROXY_URL = 'https://my-cors-proxy-671248690215.asia-south.proxy.app/?url=';
    const urlToScrape = url;

    try {
      const response = await fetch(PROXY_URL + encodeURIComponent(urlToScrape));
      if (!response.ok) {
        throw new Error('Failed to fetch the page. The site may be down or the CORS proxy may be unavailable.');
      }

      const htmlString = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');

      let scrapedTitle, scrapedPrice, scrapedImage;
      const scrapedStore = new URL(urlToScrape).hostname.replace('www.', '');

      // Priority 1: JSON-LD Schema
      const jsonLdScript = doc.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript) {
        try {
          const jsonData = JSON.parse(jsonLdScript.textContent);
          const productSchema = Array.isArray(jsonData)
            ? jsonData.find(item => item['@type'] === 'Product')
            : (jsonData['@type'] === 'Product' ? jsonData : null);
          if (productSchema) {
            scrapedTitle = productSchema.name;
            scrapedImage = Array.isArray(productSchema.image) ? productSchema.image[0] : productSchema.image;
            const offer = Array.isArray(productSchema.offers)
              ? productSchema.offers[0]
              : productSchema.offers;
            if (offer) scrapedPrice = offer.price;
          }
        } catch {
          // Continue silently if JSON-LD parse fails
        }
      }

      // Priority 2: Open Graph Tags
      if (!scrapedTitle || !scrapedPrice || !scrapedImage) {
        const getMeta = (prop) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content');
        scrapedTitle = scrapedTitle || getMeta('og:title');
        scrapedImage = scrapedImage || getMeta('og:image');
        scrapedPrice = scrapedPrice || getMeta('product:price:amount') || getMeta('og:price:amount');
      }

      // Priority 3: Site-specific scrapers
      if (!scrapedTitle || !scrapedPrice || !scrapedImage) {
        const hostname = new URL(urlToScrape).hostname.toLowerCase();
        const siteScrapers = {
          'amazon.in': {
            title: () => doc.getElementById('productTitle')?.innerText.trim(),
            price: () =>
              doc.querySelector('.a-price .a-price-whole')?.innerText.trim() ||
              doc.querySelector('#priceblock_ourprice')?.innerText.trim() ||
              doc.querySelector('#priceblock_dealprice')?.innerText.trim(),
            image: () => doc.getElementById('landingImage')?.src,
          },
          'flipkart.com': {
            title: () => doc.querySelector('span.B_NuCI')?.innerText.trim(),
            price: () => doc.querySelector('div._30jeq3._16J6g6')?.innerText.trim(),
            image: () => doc.querySelector('img._396cs4._3exPp9')?.src,
          },
          // Add more scrapers if needed
        };
        let scraper = null;
        if (hostname.includes('amazon')) scraper = siteScrapers['amazon.in'];
        else if (hostname.includes('flipkart')) scraper = siteScrapers['flipkart.com'];

        if (scraper) {
          scrapedTitle = scrapedTitle || scraper.title();
          scrapedPrice = scrapedPrice || scraper.price();
          scrapedImage = scrapedImage || scraper.image();
        }
      }

      if (!scrapedTitle || !scrapedPrice || !scrapedImage) {
        throw new Error('Could not automatically find product details. Please try another link or add manually.');
      }

      const priceNum = parseFloat(String(scrapedPrice).replace(/[^\d.]/g, ''));
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Invalid price detected. Please check the product URL.');
      }

      const product = {
        id: urlToScrape,
        title: scrapedTitle,
        price: priceNum,
        image: scrapedImage,
        store: scrapedStore,
        url: urlToScrape,
        sourceType: 'marketplace',
        addedAt: new Date().toISOString(),
      };

      setFetchedData(product);
      setPageState('preview');
      toast({ title: '✔️ Product found!', description: `Fetched from ${product.store}.` });

    } catch (error) {
      setErrorMessage(error.message || 'Failed to fetch product data.');
      setPageState('error');
    }
  };

  const handleAdd = () => {
    if (!fetchedData) return;
    if (isInternalOrAffiliateUrl(fetchedData.url)) {
      toast({
        title: '❌ Cannot add product',
        description: 'This product is part of our internal catalog and cannot be added here.',
        variant: 'destructive',
      });
      return;
    }

    const itemToAdd = {
      ...fetchedData,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      inCart: false,
    };

    addToWishlist(itemToAdd, 'universal');
    shootConfetti();
    playConfetti();
    toast({
      title: '🎉 Wish added!',
      description: `Added "${itemToAdd.title}" to your Wishlist.`,
    });

    setTimeout(() => {
      navigate('/dashboard');
    }, 800);
  };

  const resetPage = () => {
    setUrl('');
    setTags('');
    setFetchedData(null);
    setErrorMessage('');
    setPageState('idle');
  };

  return (
    <>
      <Helmet>
        <title>Add to Wishlist | Wishlist Integration</title>
        <meta name="description" content="Add products to your wishlist from any online store." />
      </Helmet>

      <main className="flex flex-col min-h-[calc(100vh-4rem)] max-w-xl mx-auto px-4 py-16">
        <div className="text-center mb-10 select-none">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Add to Wishlist
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Paste a product link from any supported online store below.
          </p>
        </div>

        <div className="flex-grow min-h-0">
          <AnimatePresence mode="wait" initial={false}>
            {pageState === 'idle' && (
              <motion.form
                key="idle"
                onSubmit={handleFetch}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-4 py-2 shadow">
                  <LinkIcon className="text-gray-400 w-5 h-5 mr-2" />
                  <Input
                    type="url"
                    placeholder="Paste product URL here"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    required
                    className="bg-transparent border-none focus:ring-0"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  <Button type="submit" className="ml-2 rounded-full" size="lg">
                    Fetch Details
                  </Button>
                </div>
              </motion.form>
            )}

            {pageState === 'fetching' && (
              <motion.div
                key="fetching"
                className="flex flex-col items-center justify-center p-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Analyzing link…</p>
                <p className="text-gray-500 dark:text-gray-400">Fetching product details...</p>
              </motion.div>
            )}

            {pageState === 'error' && (
              <motion.div
                key="error"
                className="rounded-xl bg-red-50 dark:bg-red-900/20 p-8 text-center border border-red-200 dark:border-red-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-600 dark:text-red-400" />
                <h2 className="text-2xl font-semibold text-red-700 dark:text-red-300 mb-2">Oops! Something went wrong.</h2>
                <p className="text-red-600 dark:text-red-400 max-w-md mx-auto">
                  {errorMessage || 'Unable to fetch product information.'}
                </p>
                <Button onClick={resetPage} variant="outline" size="lg" className="mt-6">
                  <RefreshCw className="inline mr-2 h-5 w-5" /> Try Again
                </Button>
              </motion.div>
            )}

            {pageState === 'preview' && fetchedData && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="max-w-xl mx-auto space-y-6 bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-md p-6 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="w-28 h-28 rounded-lg bg-white dark:bg-gray-800 shadow-md overflow-hidden flex items-center justify-center p-2">
                    <img src={fetchedData.image} alt={fetchedData.title} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">From {fetchedData.store}</p>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{fetchedData.title}</h2>
                    <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">₹{fetchedData.price.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags" className="block mb-1 font-semibold text-gray-700 dark:text-gray-200">Add Tags (optional)</Label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <Input
                      id="tags"
                      type="text"
                      placeholder="Separate tags with commas"
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      className="pl-10"
                      spellCheck={false}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={resetPage} variant="outline" size="lg" className="flex-1">
                    <RefreshCw className="mr-2 h-5 w-5" /> Reset
                  </Button>
                  <Button onClick={handleAdd} size="lg" className="flex-1" disabled={!fetchedData}>
                    <Plus className="mr-2 h-5 w-5" /> Add to Wishlist
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
};

export default WishlistIntegrationPage;
