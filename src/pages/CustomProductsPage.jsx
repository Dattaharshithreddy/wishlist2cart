import React, { useState, useEffect, useMemo, useRef } from 'react';

import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import confetti from 'canvas-confetti';
import { useToast } from '@/components/ui/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { Button } from '@/components/ui/button';
import FancySearchBar from '@/components/FancySearchBar';
import Pagination from '@/components/Pagination';
import { Heart as HeartIcon, ShoppingCart, Tag } from 'lucide-react';
import successSfx from '@/assets/success.mp3';
import removeSfx from '@/assets/remove.mp3';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

import Navbar from '@/components/Navbar'; // keep only Navbar

const brandCategories = ['Trending', 'Fashion', 'Tech Gadgets', 'Accessories', 'Gifting', 'Home'];
const allTags = ['bestseller', 'new', "editor's pick", 'gift'];



// Live Offers Banner Component (Part 4)
function useRotatingText(texts, interval = 3500) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % texts.length), interval);
    return () => clearInterval(id);
  }, [texts, interval]);
  return texts[index];
}

function LiveOffersBanner() {
  const offers = [
    '🔥 Up to 80% OFF on Select Brands!',
    '🚚 Free Delivery above ₹999',
    '🎁 Scratch Cards on Every Order!',
    '💳 Cashback via W2C Wallet!',
  ];
  const text = useRotatingText(offers);
  return (
    <div className="w-full mx-auto rounded-xl bg-gradient-to-r from-pink-500 via-yellow-400 to-orange-500 text-white text-center py-2 px-2 text-base md:text-lg font-bold font-poppins shadow-lg animate-pulse mb-6 select-none">
      {text}
    </div>
  );
}


// AI Recommendations Component (Part 4)
function AIRecommendations({ products, user }) {
  const [suggested, setSuggested] = useState([]);


  useEffect(() => {
    if (!products.length) {
      setSuggested([]);
      return;
    }
    let recs = [];
    if (user?.recentlyViewed?.length) {
      recs = products.filter(p => user.recentlyViewed.includes(p.id)).slice(0, 4);
    }
    if (recs.length < 4) {
      recs = [
        ...new Set([...recs, ...products.filter(p => !recs.some(r => r.id === p.id)).slice(0, 4 - recs.length)]),
      ];
    }
    setSuggested(recs);
  }, [products, user]);

  if (!suggested.length) return null;

  return (
    <section
      aria-label="AI-powered Personalized Recommendations"
      className="mb-8 w-full"
      tabIndex={-1}
    >
      <div className="flex items-center gap-2 mb-3 select-none">
        <motion.div animate={{ rotate: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 2 }}>
          <span role="img" aria-label="sparkles">✨</span>
        </motion.div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Just For You</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suggested.map(item => (
          <article
            key={item.id}
            onClick={() => window.location.assign(`/products/${item.id}`)}
            tabIndex={0}
            role="button"
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.assign(`/products/${item.id}`); }}
            className="bg-gradient-to-br from-purple-100 via-yellow-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 rounded-xl p-3 shadow-md cursor-pointer hover:shadow-lg transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <img
              src={item.image}
              alt={item.title}
              className="mx-auto h-24 w-24 object-cover rounded-lg mb-2"
              loading="lazy"
            />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{item.title}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{item.category}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// Utility: Fetch products from Firestore
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
  // States
  const [category, setCategory] = useState('Trending');
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [products, setProducts] = useState([]);
  const [curPage, setCurPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 8;
  const [loadingCartIds, setLoadingCartIds] = useState(new Set());

  // Context hooks
  const { toast } = useToast();
  const { addToCart, cartItems } = useCart();
  const {
    w2cItems: wishlistItems,
    addToW2C: addToWishlist,
    removeFromWishlist: removeFromW2C,
    user,
  } = useWishlist();

  const navigate = useNavigate();

  // Audio refs
  const audioAdd = useRef(null);
  const audioRemove = useRef(null);

  useEffect(() => {
    audioAdd.current = new Audio(successSfx);
    audioRemove.current = new Audio(removeSfx);
  }, []);

  // Play add or remove sound
  function triggerSound(adding = true) {
    const sound = adding ? audioAdd.current : audioRemove.current;
    if (sound) {
      sound.currentTime = 0;
      sound.play();
    }
  }

  // Fetch products data on mount
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

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(products, {
        keys: ['title', 'description', 'tags'],
        threshold: 0.32,
        ignoreLocation: true,
      }),
    [products],
  );

  // Filtering logic
  const filteredByCategory = useMemo(
    () => (category === 'Trending' ? products : products.filter(p => p.category === category)),
    [products, category],
  );

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
  const pagedProducts = useMemo(() => sortedProducts.slice((curPage - 1) * itemsPerPage, curPage * itemsPerPage), [
    sortedProducts,
    curPage,
  ]);

  // Quick sets for wishlist and cart lookup
  const wishlistIds = useMemo(() => new Set(wishlistItems.map(i => i.id)), [wishlistItems]);
  const cartIds = useMemo(() => new Set(cartItems.map(i => i.id)), [cartItems]);

  const [justAddedIds, setJustAddedIds] = useState(new Set());

  // Cleanup justAddedIds after cart changes
  useEffect(() => {
    setJustAddedIds(prev => {
      const newSet = new Set(prev);
      cartItems.forEach(item => newSet.delete(item.id));
      return newSet;
    });
  }, [cartItems]);

  // Wishlist add/remove toggle
  const toggleWishlist = async product => {
    if (!user) {
      toast({ title: 'Not logged in', description: 'Please log in to manage wishlist.', variant: 'destructive' });
      return;
    }
    const isWishlisted = wishlistIds.has(product.id);
    try {
      if (isWishlisted) {
        await removeFromW2C(product.id, 'w2c');
        triggerSound(false);
        toast({
          title: 'Removed from wishlist',
          description: (
            <span>
              <img src={product.image} alt={product.title} className="inline w-10 h-10 rounded shadow mr-2" />
              {product.title} removed from wishlist.
            </span>
          ),
          variant: 'neutral',
        });
      } else {
        await addToWishlist({ ...product, quantity: 1 });
        triggerSound(true);
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        toast({
          title: 'Added to wishlist',
          description: (
            <span>
              <img src={product.image} alt={product.title} className="inline w-10 h-10 rounded shadow mr-2" />
              {product.title} added to wishlist.
            </span>
          ),
          variant: 'success',
        });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update wishlist. Please try again.', variant: 'destructive' });
      console.error('Wishlist toggle error:', error);
    }
  };

  // Add to cart handler + animation
  const handleAddToCart = async (product, e) => {
  if (e) e.stopPropagation();
  if (!user) {
    toast({
      title: 'Not logged in',
      description: 'Please log in to add products to cart.',
      variant: 'destructive'
    });
    return;
  }

  setLoadingCartIds(prev => new Set(prev).add(product.id));

  try {
    await addToCart({ ...product, quantity: 1 });
    setJustAddedIds(prev => new Set(prev).add(product.id));
    triggerSound(true);
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

    toast({
      title: 'Added to cart',
      description: (
        <span>
          <img src={product.image} alt={product.title} className="inline w-10 h-10 rounded shadow mr-2" />
          {product.title} added to cart.
        </span>
      ),
      variant: 'success'
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to add product to cart. Please try again.',
      variant: 'destructive'
    });
    console.error('Add to cart error:', error);
  } finally {
    setLoadingCartIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(product.id);
      return newSet;
    });
  }
};


  // Navigate to Cart page
  const handleViewCart = e => {
    if (e) e.stopPropagation();
    navigate('/cart');
  };

  // Animation variants
  const headerAnim = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const categoryButtonAnim = {
    hover: { scale: 1.1, backgroundColor: '#7c3aed', color: '#fff', transition: { duration: 0.3 } },
    tap: { scale: 0.95 },
  };

  return (
    <>
      <Helmet>
        <title>W2C Originals - Revolutionizing Shopping</title>
        <meta name="description" content="Shop exclusive W2C Originals with a stunning interface and amazing features." />
      </Helmet>

      <Navbar />

      <div className="mt-2" /> {/* Spacer for fixed navbar */}

      <main
        className="container mx-auto px-4 py-12 max-w-7xl bg-white rounded-xl shadow-lg dark:bg-gray-900"
        aria-label="W2C Originals homepage main content"
      >
        <LiveOffersBanner />

        <motion.header {...headerAnim} className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div>
            <h1
  aria-label="W2C Originals"
  className="text-3xl md:text-4xl font-extrabold font-poppins tracking-tight text-[#ff3f6c] dark:text-[#ff90b3] select-none leading-tight"
>
  W2C Originals
</h1>

            <p className="mt-3 text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-xl font-medium font-inter">
  Explore exclusive & trending items with stylish experiences!
</p>

          </div>

          <div className="flex flex-wrap gap-4 w-full md:w-auto justify-center md:justify-end items-center">
            <FancySearchBar
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurPage(1);
              }}
              onSelect={item => {
                if (item.type === 'tag') {
                  setTags(tg => [...new Set([...tg, item.value])]);
                  setSearchTerm('');
                } else if (item.value) {
                  setSearchTerm(item.value);
                  setCurPage(1);
                }
              }}
              onClear={() => {
                setSearchTerm('');
                setCurPage(1);
              }}
              suggestions={
                searchTerm.length > 1
                  ? fuse.search(searchTerm).slice(0, 6).map(r => ({
                      value: r.item.title,
                      desc: r.item.category,
                      id: r.item.id,
                    }))
                  : []
              }
              placeholder="Search products, brands..."
            />

        <select
  aria-label="Sort products"
  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500
             dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-purple-400"
  value={sortKey}
  onChange={(e) => {
    setSortKey(e.target.value);
    setCurPage(1);
  }}
>
  <option value="newest">Newest</option>
  <option value="price_asc">Price: Low to High</option>
  <option value="price_desc">Price: High to Low</option>
</select>

          </div>
        </motion.header>

        {/* Categories */}
        <section aria-label="Product categories" className="flex flex-wrap gap-4 mb-6" role="tablist">
          {brandCategories.map(cat => {
            const selected = cat === category;
            return (
              <motion.button
                key={cat}
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                variants={categoryButtonAnim}
                whileHover="hover"
                whileTap="tap"
                onClick={() => {
                  setCategory(cat);
                  setCurPage(1);
                }}
                type="button"
                className={`px-6 py-3 rounded-full font-semibold shadow-md text-base transition-colors duration-300 capitalize font-inter tracking-wide ${
  selected
    ? 'bg-gradient-to-br from-[#ff3f6c] to-[#ff6161] text-white ring-4 ring-pink-300 dark:ring-pink-400'
    : 'bg-gray-100 hover:bg-pink-50 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
}`}

              >
                {cat}
              </motion.button>
            );
          })}
        </section>

        {/* Filter Tags */}
        {/* Filter Tags (Updated for vibrant colors) */}
<section aria-label="Product tags" className="flex flex-wrap gap-3 mb-8">
  {allTags.map(tag => {
    const active = tags.includes(tag);
    return (
      <Button
        key={tag}
        size="sm"
        variant="ghost"
        aria-pressed={active}
        onClick={() => {
          setTags(s => (active ? s.filter(x => x !== tag) : [...s, tag]));
          setCurPage(1);
        }}
        className={`rounded-full px-5 py-1 text-sm font-semibold capitalize transition-all font-poppins
          ${active
            ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-md ring-2 ring-pink-300 dark:ring-pink-400'
            : 'bg-gray-100 hover:bg-pink-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
      >
        #{tag}
      </Button>
    );
  })}

  {/* Clear all filters button */}
  {tags.length > 0 && (
    <Button
      variant="outline"
      size="sm"
      className="font-semibold text-sm ml-2 border border-pink-500 text-pink-500 hover:bg-pink-50 dark:border-pink-400 dark:text-pink-300 dark:hover:bg-gray-800"
      onClick={() => {
        setTags([]);
        setCurPage(1);
      }}
      aria-label="Clear all filters"
    >
      Clear All
    </Button>
  )}
</section>

         

        {/* AI Recommendations */}
        <AIRecommendations products={products} user={user} />

        {/* Product Grid / Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 select-none">
            {Array(itemsPerPage)
              .fill()
              .map((_, i) => (
                <motion.div
                  key={`loading-${i}`}
                  className="rounded-2xl bg-gray-100 dark:bg-gray-800 p-5 shadow-lg min-h-[420px]"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                >
                  <Skeleton height={240} borderRadius={16} />
                  <Skeleton count={5} style={{ marginTop: 12 }} height={15} borderRadius={8} />
                </motion.div>
              ))}
          </div>
        ) : pagedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-xl font-semibold text-gray-500 dark:text-gray-400 select-none"
          >
            No products found.
          </motion.div>
        ) : (
          <>
            <section
              aria-label="Product grid"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {pagedProducts.map(product => {
                const wishlisted = wishlistIds.has(product.id);
                const inCart = cartIds.has(product.id) || justAddedIds.has(product.id);
                const viewersCount = Math.floor(Math.random() * 20) + 1;

                return (
                  <motion.article
                    key={product.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${product.title}`}
                    onClick={() => navigate(`/products/${product.id}`)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/products/${product.id}`);
                      }
                    }}
                    className="flex flex-col rounded-3xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 p-5 shadow-lg min-h-[420px] cursor-pointer select-none"
                    whileHover={{ scale: 1.04, boxShadow: '0 15px 25px rgba(124, 58, 237, 0.4)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <div className="relative h-60 w-full rounded-xl overflow-hidden shadow-md mb-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 ease-in-out hover:scale-105"
                        />
                      ) : (
                        <Skeleton height={240} borderRadius={16} />
                      )}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[85%]">
                        {product.tags?.map(tag => (
                          <span
                            key={tag}
                            className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold capitalize tracking-wide shadow-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3
                      className="font-extrabold text-lg mb-2 truncate text-gray-900 dark:text-white"
                      title={product.title}
                    >
                      {product.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-1">{product.description}</p>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 select-none">{viewersCount} people are viewing now</p>

                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="flex items-center gap-1 text-purple-500 font-semibold"
                        aria-label={`Category: ${product.category}`}
                      >
                        <Tag size={18} />
                        {product.category}
                      </span>
                      <div className="font-black text-xl text-purple-700 dark:text-purple-400 select-none">
                        ₹{product.price?.toLocaleString()}
                      </div>
                    </div>

                    {/* AR Try Button */}
                    {product.hasAR && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          alert(`Launching AR preview for "${product.title}" (Demo)...`);
                        }}
                        className="mb-3 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-semibold transition"
                        aria-label={`Try ${product.title} in AR`}
                      >
                        🕶️ Try in AR
                      </button>
                    )}

                    <div className="flex items-center gap-5 mt-auto">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        whileHover={{ scale: 1.07 }}
                        animate={wishlisted ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1], transition: { duration: 0.6 } } : {}}
                        onClick={e => {
                          e.stopPropagation();
                          toggleWishlist(product);
                          triggerSound(!wishlisted);
                          if (!wishlisted) confetti({ particleCount: 60, spread: 80 });
                        }}
                        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        type="button"
                        className="p-0 focus:outline-none bg-transparent"
                      >
                        <HeartIcon
                          size={30}
                          strokeWidth={2.2}
                          fill={wishlisted ? '#F43F5E' : 'none'}
                          stroke={wishlisted ? '#F43F5E' : '#A3A3A3'}
                          style={{ transition: 'all 0.3s ease' }}
                        />
                      </motion.button>
                      

                      {inCart ? (
                        <Button
  onClick={handleViewCart}
  size="lg"
  variant="default"
  className={`
    w-full whitespace-nowrap font-semibold transition-colors
  bg-transparent dark:bg-transparent text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 border border-violet-700 dark:border-violet-300' : ''}
  `}
  type="button"
  aria-label="View shopping cart"
>
  <ShoppingCart className="mr-2" />
  View Cart
</Button>


                      ) : (
                        <Button
  as={motion.button}
  whileTap={{ scale: 0.93 }}
  animate={justAddedIds.has(product.id)
    ? { backgroundColor: '#C4B5FD', color: '#fff', transition: { yoyo: Infinity, duration: 0.5, repeat: 1 } }
    : {}
  }
  onClick={e => {
    handleAddToCart(product, e);
    triggerSound(true);
    confetti({ particleCount: 80, spread: 80 });
  }}
  aria-label={`Add ${product.title} to Cart`}
  className="font-bold flex-1"
  size="lg"
  variant="default"
  type="button"
  disabled={loadingCartIds.has(product.id)}
>
  <ShoppingCart className="mr-2" />
  {loadingCartIds.has(product.id) ? 'Adding to Cart...' : 'Add to Cart'}
</Button>

                      )}
                    </div>
                  </motion.article>
                );
              })}
            </section>

            <Pagination page={curPage} pages={totalPages} onPage={setCurPage} />
          </>
        )}
      </main>
    </>
  );
}
