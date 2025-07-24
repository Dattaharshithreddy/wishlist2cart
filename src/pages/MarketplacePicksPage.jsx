import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ExternalLink, Tag, Star } from 'lucide-react';

const marketplaceCategories = [
  "Mobiles", "Fashion", "Home Essentials", "Sports & Fitness"
];

const marketplaceProducts = [
  {
    id: "a1",
    title: "Flagship 5G Smartphone",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
    price: 48999,
    platform: "Amazon",
    category: "Mobiles",
    url: "https://amzn.in/example",
    description: "Vivid AMOLED display, 120Hz, all-day battery.",
    tags: ["top rated"],
    platformLogo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
  {
    id: "a2",
    title: "Streetwear T-shirt",
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
    price: 799,
    platform: "Myntra",
    category: "Fashion",
    url: "https://myntra.com/example",
    description: "100% organic fabric. New arrival.",
    tags: ["exclusive"],
    platformLogo: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg"
  },
  {
    id: "a3",
    title: "Hand Blender Pro",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187",
    price: 2499,
    platform: "Flipkart",
    category: "Home Essentials",
    url: "https://flipkart.com/example",
    description: "Powerful, ergonomic, best for smoothies.",
    tags: [],
    platformLogo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg"
  },
  {
    id: "a4",
    title: "Yoga Mat Deluxe",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    price: 1299,
    platform: "Meesho",
    category: "Sports & Fitness",
    url: "https://meesho.com/example",
    description: "Non-slip, eco-friendly, 1-year warranty.",
    tags: ["editor's pick"],
    platformLogo: "https://upload.wikimedia.org/wikipedia/commons/7/70/Meesho_Logomark.png"
  }
];

export default function MarketplacePicksPage() {
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const shownProducts = marketplaceProducts.filter((p) => p.category === category);

  return (
    <>
      <Helmet>
        <title>Marketplace Picks</title>
        <meta name="description" content="Hottest finds from the web—handpicked for Wishlist2Cart shoppers!" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-12 max-w-7xl"
      >
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Marketplace Picks</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Discover trending deals and curated products from our partner stores.
            </p>
          </div>
        </div>
        <div className="flex gap-4 mb-8">
          {marketplaceCategories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "ghost"}
              className="capitalize"
              onClick={() => setCategory(cat)}
              size="sm"
            >
              {cat}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {shownProducts.length > 0 ? shownProducts.map((product, idx) => (
            <motion.a
              key={product.id}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800/50 shadow-lg border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col group hover:border-green-500 transition"
              title={`Shop ${product.title} on ${product.platform}`}
            >
              <div className="relative mb-4 h-52">
                <img src={product.image} alt={product.title} className="object-cover h-full w-full rounded-xl" />
                {/* Platform Logo */}
                <span className="absolute top-2 left-2 bg-white dark:bg-gray-900 p-1 rounded shadow flex items-center">
                  <img src={product.platformLogo} alt={product.platform} className="h-5 w-16 object-contain" />
                </span>
                <div className="absolute top-2 right-2 space-x-1 flex">
                  {product.tags.map((tag) => (
                    <span key={tag} className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-md shadow">{tag}</span>
                  ))}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">{product.title}</h3>
              <div className="text-gray-500 text-sm mb-2">{product.description}</div>
              <div className="flex-1" />
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-400 capitalize">{product.category}</span>
              </div>
              <div className="text-xl font-bold text-green-600 mb-4">₹{product.price.toLocaleString()}</div>
              <Button size="lg" variant="outline" className="w-full justify-center pointer-events-none">
                <ExternalLink className="mr-2 h-5 w-5" /> Buy on {product.platform}
              </Button>
            </motion.a>
          )) : (
            <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">No products found in this category.</div>
          )}
        </div>
      </motion.div>
    </>
  );
}
