import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import Skeleton from 'react-loading-skeleton';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import FancySearchBar from '@/components/FancySearchBar';
import Pagination from '@/components/Pagination';
import { Heart as HeartIcon, ShoppingCart, Tag } from 'lucide-react';
import successSfx from '@/assets/success.mp3';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

const brandCategories = ['Trending', 'Fashion', 'Tech Gadgets', 'Accessories', 'Gifting', 'Home'];
const allTags = ['bestseller', 'new', "editor's pick", 'gift'];

async function fetchBrandProducts() {
  const colRef = collection(db, 'wishlist2cart_brands');
  const q = query(colRef, where('isCustom', '==', true), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
  }));
}

export default function CustomProductsPage() {
  const [category, setCategory] = useState('Trending');
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [products, setProducts] = useState([]);
  const [curPage, setCurPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;

  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const { w2cItems: wishlistItems, addToW2C: addToWishlist, removeFromWishlist: removeFromW2C, user } = useWishlist();

  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(successSfx);
  }, []);

  function playSound() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchBrandProducts()
      .then(setProducts)
      .catch(() =>
        toast({
          title: 'Failed to load products',
          description: 'Please try again later.',
          variant: 'destructive',
        })
      )
      .finally(() => setLoading(false));
  }, [toast]);

  const fuse = useMemo(() => new Fuse(products, {
    keys: ['title', 'description', 'tags'],
    threshold: 0.32,
    ignoreLocation: true,
  }), [products]);

  const filteredByCategory = useMemo(() => category === 'Trending' ? products : products.filter(p => p.category === category), [products, category]);

  const filteredByTags = useMemo(() => {
    if (tags.length === 0) return filteredByCategory;
    return filteredByCategory.filter(p => p.tags && tags.every(tag => p.tags.includes(tag)));
  }, [filteredByCategory, tags]);

  const searchedProducts = useMemo(() => {
    if (!searchTerm.trim()) return filteredByTags;
    return fuse.search(searchTerm.trim()).map(r => r.item).filter(item => filteredByTags.includes(item));
  }, [searchTerm, fuse, filteredByTags]);

  const sortedProducts = useMemo(() => {
    const sorted = [...searchedProducts];
    switch (sortKey) {
      case 'price_asc':
        sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    }
    return sorted;
  }, [searchedProducts, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));
  const pagedProducts = useMemo(() => sortedProducts.slice((curPage - 1) * itemsPerPage, curPage * itemsPerPage), [curPage, sortedProducts]);

  const wishlistIds = useMemo(() => new Set(wishlistItems.map(i => i.id)), [wishlistItems]);
  const cartIds = useMemo(() => new Set(cartItems.map(i => i.id)), [cartItems]);

  const [justAddedIds, setJustAddedIds] = useState(new Set());

  useEffect(() => {
    setJustAddedIds(prev => {
      const newSet = new Set(prev);
      cartItems.forEach(item => newSet.delete(item.id));
      return newSet;
    });
  }, [cartItems]);

  const toggleWishlist = async product => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please log in to manage wishlist.', variant: 'destructive' });
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await removeFromW2C(product.id, 'w2c');
        toast({ title: 'Removed from wishlist', description: `${product.title} removed.` });
      } else {
        await addToWishlist({ ...product, quantity: 1 });
        playSound();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        toast({ title: 'Added to wishlist', description: `${product.title} added.` });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update wishlist. Please try again.', variant: 'destructive' });
      console.error('Wishlist toggle error:', error);
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please log in to add products to cart.', variant: 'destructive' });
      return;
    }
    try {
      await addToCart({ ...product, quantity: 1 });
      setJustAddedIds(prev => new Set(prev).add(product.id));
      playSound();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      toast({ title: 'Added to cart', description: `${product.title} added.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add product to cart. Please try again.', variant: 'destructive' });
      console.error('Add to cart error:', error);
    }
  };

  const handleViewCart = e => {
    if (e) e.stopPropagation();
    navigate('/cart');
  };

  return (
    <>
      <Helmet>
        <title>W2C Originals</title>
        <meta name="description" content="Shop exclusive W2C Originals." />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="container mx-auto px-4 py-12 max-w-7xl bg-gray-50 dark:bg-gray-900 rounded-xl"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-poppins tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700 dark:from-violet-400 dark:to-blue-400 select-none">
              W2C Originals
            </h1>

            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
              A curated selection of custom products.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <FancySearchBar
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurPage(1);
              }}
              onClear={() => {
                setSearchTerm('');
                setCurPage(1);
              }}
            />
            <select
              aria-label="Sort products"
              className="rounded border border-gray-300 dark:border-gray-700 px-3 py-2"
              value={sortKey}
              onChange={e => {
                setSortKey(e.target.value);
                setCurPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-4">
          {brandCategories.map(cat => (
            <Button
              key={cat}
              variant={cat === category ? 'default' : 'ghost'}
              className="capitalize"
              onClick={() => {
                setCategory(cat);
                setCurPage(1);
              }}
              aria-pressed={cat === category}
              type="button"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {allTags.map(tag => (
            <Button
              key={tag}
              size="sm"
              variant={tags.includes(tag) ? 'default' : 'ghost'}
              onClick={() => {
                setCurPage(1);
                setTags(current => {
                  if (current.includes(tag)) return current.filter(t => t !== tag);
                  return [...current, tag];
                });
              }}
              className={`rounded-full px-4 py-1 ${tags.includes(tag) ? 'font-bold ring-2 ring-violet-400' : ''}`}
              aria-pressed={tags.includes(tag)}
              type="button"
            >
              {tag}
            </Button>
          ))}
          {tags.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => { setTags([]); setCurPage(1); }} type="button">
              Clear
            </Button>
          )}
        </div>

        {loading ? (
          Array(itemsPerPage).fill(0).map((_, i) => <Skeleton key={i} height={420} style={{ marginBottom: 24 }} />)
        ) : pagedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-lg text-gray-500 dark:text-gray-400 select-none"
          >
            No products found.
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {pagedProducts.map(product => {
                const isWishlisted = wishlistIds.has(product.id);
                const isAddedToCart = cartIds.has(product.id) || justAddedIds.has(product.id);
                return (
                  <motion.div
                    key={product.id}
                    className="flex flex-col rounded-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-5 shadow-lg select-none min-h-[420px]"
                    tabIndex={0}
                    role="button"
                    onClick={() => navigate(`/products/${product.id}`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/products/${product.id}`);
                      }
                    }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="relative h-60 w-full rounded-xl overflow-hidden shadow mb-3">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Skeleton height={240} />
                      )}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {product.tags?.map(tag => (
                          <span
                            key={tag}
                            className="bg-green-600 text-white px-2 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="font-black text-lg mb-1 truncate text-gray-900 dark:text-white">{product.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between mt-auto mb-4">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Tag size={18} /> {product.category}
                      </span>
                      <div className="font-bold text-lg px-1 rounded select-none">
                        ₹{product.price?.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <motion.button
                        onClick={e => {
                          e.stopPropagation();
                          toggleWishlist(product);
                        }}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        type="button"
                        className="p-0 focus:outline-none bg-transparent"
                      >
                        <HeartIcon
                          size={28}
                          strokeWidth={2.3}
                          fill={isWishlisted ? '#dc2626' : 'none'}
                          stroke={isWishlisted ? '#dc2626' : '#737373'}
                          style={{ transition: 'all 0.25s' }}
                        />
                      </motion.button>

                      {isAddedToCart ? (
                        <Button onClick={handleViewCart} size="lg" variant="outline" className="flex-1" type="button">
                          View Cart
                        </Button>
                      ) : (
                        <Button
                          onClick={e => handleAddToCart(product, e)}
                          size="lg"
                          variant="default"
                          className="flex-1"
                          type="button"
                        >
                          <ShoppingCart className="mr-1" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Pagination page={curPage} pages={totalPages} onPage={setCurPage} />
          </>
        )}
      </motion.div>
    </>
  );
}
