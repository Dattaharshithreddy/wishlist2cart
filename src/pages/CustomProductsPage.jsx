import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Tag } from 'lucide-react';

const brandCategories = [
  "Trending", "Apparel", "Tech Gadgets", "Accessories", "Gifting", "Home"
];
const brandProducts = [
  {
    id: "p1",
    title: "Wishlist2Cart Premium Hoodie",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
    price: 3499,
    description: "Ultra-soft cotton hoodie for all seasons.",
    category: "Apparel",
    tags: ["bestseller", "new"],
  },
  {
    id: "p2",
    title: "Wireless Pro Earbuds",
    image: "https://images.unsplash.com/photo-1512499617640-c2f999098c01",
    price: 1999,
    description: "Crystal clear audio, all-day battery.",
    category: "Tech Gadgets",
    tags: ["editor's pick"],
  },
  {
    id: "p3",
    title: "Sleek Timepiece",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
    price: 4599,
    description: "Modern design meets classic style.",
    category: "Accessories",
    tags: [],
  },
  {
    id: "p4",
    title: "Signature Candle Set",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
    price: 799,
    description: "For cozy, inviting spaces.",
    category: "Home",
    tags: ["gift"],
  },
];

export default function CustomProductsPage() {
  const [category, setCategory] = useState("Trending");
  const shownProducts =
    category === "Trending"
      ? brandProducts // Trending shows all for demo
      : brandProducts.filter((p) => p.category === category);

  return (
    <>
      <Helmet>
        <title>Wishlist2Cart Brands</title>
        <meta name="description" content="Shop trending and exclusive Wishlist2Cart products." />
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
            <h1 className="text-4xl font-bold tracking-tight">Wishlist2Cart Brands</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">A curated selection of essentials by Wishlist2Cart.</p>
          </div>
        </div>
        <div className="flex gap-4 mb-8">
          {brandCategories.map((cat) => (
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
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800/50 shadow-lg border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col group hover:border-violet-500"
            >
              <div className="relative mb-4 h-52">
                <img src={product.image} alt={product.title} className="object-cover h-full w-full rounded-xl" />
                <div className="absolute top-2 right-2 space-x-1 flex">
                  {product.tags.map((tag) => (
                    <span key={tag} className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-md shadow">{tag}</span>
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
              <div className="text-xl font-bold text-violet-600 mb-4">₹{product.price.toLocaleString()}</div>
              <Button size="lg" className="w-full">
                <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
              </Button>
            </motion.div>
          )) : (
            <div className="col-span-full text-center py-20 text-gray-500 dark:text-gray-400">No products found in this category.</div>
          )}
        </div>
      </motion.div>
    </>
  );
}
