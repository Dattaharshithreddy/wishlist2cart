// src/pages/CustomProductsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, ShoppingCart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';

// Categories
const brandCategories = [
  'Trending',
  'Apparel',
  'Tech Gadgets',
  'Accessories',
  'Gifting',
  'Home',
];

// Mock data, replace with API/Firestore fetch
async function fetchBrandProducts() {
  await new Promise((r) => setTimeout(r, 500));
    return [
    {
      id: 'p1',
      title: 'Wishlist2Cart Premium Hoodie',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
      price: 3499,
      description: 'Ultra-soft cotton hoodie for all seasons.',
      category: 'Apparel',
      tags: ['bestseller', 'new'],
      createdAt: '2023-12-01T10:00:00Z',
      isCustom: true,
      affiliateUrl: null,
    },
    {
      id: 'p2',
      title: 'Wireless Pro Earbuds',
      image: 'https://images.unsplash.com/photo-1512499617640-c2f999098c01',
      price: 1999,
      description: 'Crystal clear audio, all-day battery.',
      category: 'Tech Gadgets',
      tags: ["editor's pick"],
      createdAt: '2023-11-20T12:30:00Z',
      isCustom: true,
      affiliateUrl: null,
    },
    {
      id: 'p3',
      title: 'Sleek Timepiece',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca',
      price: 4599,
      description: 'Modern design meets classic style.',
      category: 'Accessories',
      tags: [],
      createdAt: '2023-11-25T08:15:00Z',
      isCustom: true,
      affiliateUrl: null,
    },
    {
      id: 'p4',
      title: 'Signature Candle Set',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      price: 799,
      description: 'For cozy, inviting spaces.',
      category: 'Home',
      tags: ['gift'],
      createdAt: '2023-10-30T07:45:00Z',
      isCustom: true,
      affiliateUrl: null,
    },
  ];
}

export default function CustomProductsPage() {
  const [category, setCategory] = useState('Trending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('newest'); // 'newest', 'price_asc', 'price_desc'
  const [products, setProducts] = useState([]);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchBrandProducts()
      .then(setProducts)
      .catch(() =>
        toast({
          title: 'Failed to load products',
          description: 'Please try again later',
          variant: 'destructive',
        }),
      );
  }, [toast]);

  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ['title', 'description', 'tags'],
        ignoreLocation: true,
        threshold: 0.35,
      }),
    [products],
  );

  const filteredByCategory = useMemo(() => {
    if (category === 'Trending') return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  const searchedProducts = useMemo(() => {
    if (!searchTerm.trim()) return filteredByCategory;
    const results = fuse.search(searchTerm.trim());
    return results
      .map((r) => r.item)
      .filter((p) => filteredByCategory.includes(p));
  }, [searchTerm, fuse, filteredByCategory]);

  const sortedProducts = useMemo(() => {
    let sorted = [...searchedProducts];
    switch (sortKey) {
      case 'price_asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
    }
    return sorted;
  }, [searchedProducts, sortKey]);

  const handleAddToCart = (product) => {
    if (!product.isCustom && product.affiliateUrl) {
      window.open(product.affiliateUrl, '_blank', 'noopener');
      return;
    }
    addToCart(product);
    toast({
      title: 'Added to cart',
      description: `${product.title} has been added to your cart.`,
    });
  };

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
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Wishlist2Cart Brands</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              A curated selection of essentials by Wishlist2Cart.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
              aria-label="Search products"
            />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="Sort products"
              className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
                  <div className="flex flex-wrap gap-3 mb-8">
          {brandCategories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'ghost'}
              className="capitalize"
              onClick={() => setCategory(cat)}
              size="sm"
              aria-pressed={category === cat}
            >
              {cat}
            </Button>
          ))}
        </div>

        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-800/50 shadow-lg border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col group hover:border-violet-500"
              >
                <div className="relative mb-4 h-52">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="object-cover h-full w-full rounded-xl"
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2 space-x-1 flex">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-md shadow"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">{product.title}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-3">{product.description}</p>
                <div className="flex-1" />
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400 capitalize">{product.category}</span>
                </div>
                <div className="text-xl font-bold text-violet-600 mb-4">
                  ₹{product.price.toLocaleString()}
                </div>
                <Button size="lg" className="w-full" onClick={() => handleAddToCart(product)}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {product.isCustom ? 'Add to Cart' : 'Buy Now'}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}

