import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import { Link as LinkIcon, Tag, Bell, Plus } from 'lucide-react';

const WishlistIntegrationPage = () => {
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToWishlist } = useWishlist();

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!url) {
      toast({
        title: "URL Required",
        description: "Please paste a product URL to fetch details.",
        variant: "destructive",
      });
      return;
    }

    setIsFetching(true);
    setFetchedData(null);

    try {
     const scrapingApiUrl = `https://scrapeproduct-sa566smtjq-uc.a.run.app/?url=${encodeURIComponent(url)}`;
const res = await fetch(`http://localhost:3001/proxy?url=${encodeURIComponent(scrapingApiUrl)}`);


      if (!res.ok) throw new Error("Failed to fetch product details.");
      const data = await res.json();

      const parsed = {
        title: data.title || "Unknown Product",
        price: data.price || 0,
        image: data.image,
        platform: data.platform || "Unknown",
        tags: [],
      };

      setFetchedData(parsed);
      setTags("");
      toast({
        title: "✔ Product Fetched",
        description: `Fetched product from ${parsed.platform}`,
      });
    } catch (err) {
      toast({
        title: "Fetch Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddToWishlist = () => {
    if (!fetchedData) return;
    const newItem = {
      ...fetchedData,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
    };
    addToWishlist(newItem);
    toast({
      title: "Item Added!",
      description: `${fetchedData.title} has been added to your wishlist.`,
    });
    setTimeout(() => navigate('/dashboard'), 800);
  };

  return (
    <>
      <Helmet>
        <title>Add to Wishlist - Wishlist2Cart</title>
        <meta
          name="description"
          content="Add new items to your wishlist by pasting a URL from any e-commerce platform."
        />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto max-w-3xl px-4 py-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Add a New Wish</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Paste a product link to get started.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-950/30 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
          <form onSubmit={handleFetch} className="space-y-6">
            <div className="relative">
              <Label htmlFor="url" className="text-lg font-medium">
                Product URL
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Paste a link from Amazon, Flipkart, Myntra, etc.
              </p>
              <LinkIcon className="absolute left-3 top-[58px] h-5 w-5 text-gray-400" />
              <Input
                id="url"
                type="url"
                placeholder="https://www.example-store.com/product/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isFetching}
            >
              {isFetching ? 'Fetching...' : 'Fetch Product Details'}
            </Button>
          </form>

          {fetchedData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-2xl font-semibold mb-4">Product Preview</h2>
              <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <img
                  src={fetchedData.image}
                  alt={fetchedData.title}
                  className="w-full md:w-32 h-32 object-contain rounded-lg bg-white"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{fetchedData.title}</h3>
                  <p className="text-2xl font-bold text-violet-500 dark:text-violet-400">
                    ₹{fetchedData.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From: {fetchedData.platform}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="relative">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Tag className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <Input
                    id="tags"
                    type="text"
                    placeholder="e.g., electronics, gift, birthday"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="reminder">Set Reminder</Label>
                  <Bell className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                  <Input id="reminder" type="date" className="pl-10" />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-6"
                onClick={handleAddToWishlist}
              >
                <Plus className="mr-2 h-5 w-5" /> Add to My Wishlist
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default WishlistIntegrationPage;
