import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import Skeleton from 'react-loading-skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import FancySearchBar from '@/components/FancySearchBar';
import Pagination from '@/components/Pagination';
import { ExternalLink, Heart as HeartIcon, Tag } from 'lucide-react';
import { db } from '../lib/firebase';
import successSfx from '@/assets/success.mp3';

const CATEGORIES = ['Mobiles', 'Fashion', 'Home Essentials', 'Sports & Fitness'];
const TAGS = ['discount', 'bestseller', 'limited', 'new', 'popular', 'recommended'];

export default function MarketplacePicksPage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState([]);
  const [sortKey, setSortKey] = useState('newest');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const { toast } = useToast();
  const { wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(successSfx);
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        toast({ title: 'Failed to load products', description: e.message, variant: 'destructive' });
      }
    })();
  }, [toast]);

  const fuse = useMemo(() => new Fuse(products, { keys: ['title', 'description', 'tags'], threshold: 0.35 }), [products]);

  const filtered = useMemo(() => (
    products
      .filter(p => !category || p.category === category)
      .filter(p => tags.length === 0 || (p.tags && tags.every(t => p.tags.includes(t))))
  ), [products, category, tags]);

  const searched = useMemo(() => {
    if (!searchTerm.trim()) return filtered;
    const results = fuse.search(searchTerm.trim()).map(r => r.item);
    return results.filter(item => filtered.includes(item));
  }, [filtered, searchTerm, fuse]);

  const sorted = useMemo(() => {
    let arr = [...searched];
    switch (sortKey) {
      case 'price_asc': arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0)); break;
      case 'price_desc': arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
      default: arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
    }
    return arr;
  }, [searched, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const pagedProducts = useMemo(() => {
    const startIdx = (page - 1) * itemsPerPage;
    return sorted.slice(startIdx, startIdx + itemsPerPage);
  }, [sorted, page, itemsPerPage]);

  const wishlistIds = useMemo(() => new Set(wishlistItems.map(item => item.id)), [wishlistItems]);

  const handleToggleWishlist = (product) => {
    const isWishlisted = wishlistIds.has(product.id);
    if (isWishlisted) {
      removeFromWishlist(product.id, 'universal');
      toast({ title: 'Removed from wishlist', description: `${product.title} removed.` });
    } else {
      addToWishlist({ ...product, sourceType: 'marketplace', inCart: false, id: product.id }, 'universal');
      playSound();
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      toast({ title: 'Added to wishlist', description: `${product.title} added.` });
    }
  };

  return (
    <>
      <Helmet><title>Curated Collection</title></Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7 }}
        className="container mx-auto px-4 py-12 max-w-7xl bg-gray-50 dark:bg-gray-900 rounded-xl"
      >
        {/* Header/controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-poppins tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700 dark:from-violet-400 dark:to-blue-400 select-none">
              Curated Collection
            </h1>

            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-lg">Handpicked trending deals from trusted partners.</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <FancySearchBar 
              value={searchTerm} 
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
              onClear={() => setSearchTerm('')} 
            />
            <select
  aria-label="Sort products"
  value={sortKey}
  onChange={e => { setSortKey(e.target.value); setPage(1); }}
  className="rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2"
>

              <option value="newest">Newest</option>
              <option value="price_asc">Price - Low to High</option>
              <option value="price_desc">Price - High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(cat => (
            <Button 
              key={cat} 
              variant={cat === category ? 'default' : 'ghost'} 
              className="capitalize font-semibold" 
              onClick={() => { setCategory(cat); setPage(1); }}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TAGS.map(tag => (
            <Button 
              key={tag} 
              size="sm" 
              variant={tags.includes(tag) ? 'default' : 'ghost'} 
              className="uppercase font-semibold" 
              onClick={() => setTags(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])}
            >
              {tag}
            </Button>
          ))}
          {tags.length > 0 && <Button 
  size="sm" 
  variant="ghost" 
  onClick={() => setTags([])}
  className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
>
  Clear
</Button>
}
        </div>

        {/* Product grid */}
        {pagedProducts.length === 0 ? (
          <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="text-lg py-24 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl"
>
  No products found.
</motion.div>

        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {pagedProducts.map(product => {
                const isWishlisted = wishlistIds.has(product.id);
                return (
                 <motion.div
  key={product.id}
  className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-5 shadow-md dark:shadow-none select-none min-h-[400px]"
>

                    <div className="relative h-60 w-full rounded-xl overflow-hidden shadow mb-3">
                      {product.image
                        ? <img src={product.image} alt={product.title} className="w-full h-full object-cover rounded-xl" loading="lazy" />
                        : <Skeleton height={240} />}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.tags?.map(tag => (
                          <span key={tag} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <h3 className="font-black text-lg mb-1 truncate text-gray-900 dark:text-white">{product.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mt-2 mb-4">
                      <span className="flex items-center gap-2 text-gray-400"><Tag className="h-4 w-4" />{product.category}</span>
                      <span className="font-bold text-lg text-green-700 dark:text-green-400 px-1">₹{product.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-auto">
                      <motion.button
                        onClick={e => { e.stopPropagation(); handleToggleWishlist(product); }}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        type="button"
                        className="focus:outline-none bg-transparent p-0"
                      >
                        <HeartIcon
                          size={28}
                          strokeWidth={2.3}
                          fill={isWishlisted ? '#dc2626' : 'none'}
                          stroke={isWishlisted ? '#dc2626' : '#737373'}
                          style={{ transition: 'all 0.25s' }}
                        />
                      </motion.button>
                      <Button
                        size="lg"
                        onClick={e => { e.stopPropagation(); if (product.url) window.open(product.url, '_blank', 'noopener noreferrer'); }}
                        variant="outline"
                        aria-label={`Buy ${product.title} on Marketplace`}
                      >
                        Buy on Marketplace <ExternalLink className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <Pagination page={page} pages={totalPages} onPage={setPage} />
          </>
        )}
      </motion.div>
    </>
  );
}
