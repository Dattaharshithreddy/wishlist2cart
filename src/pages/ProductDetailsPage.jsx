import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/StarRating';
import { useCart } from '@/contexts/CartContext';
import { toast, ToastContainer } from 'react-toastify';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Star, Send, Copy, Percent } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import Skeleton from 'react-loading-skeleton';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'react-toastify/dist/ReactToastify.css';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

const offers = [
  { id: 1, label: 'Special Price', details: 'Get extra 20% off upto ₹40 on 2 items', code: 'W2C20' },
  { id: 2, label: 'Bank Offer', details: '5% cashback on Flipkart Axis Bank Credit Card', code: 'FLPKT5' },
  { id: 3, label: 'Bank Offer', details: '10% off up to ₹1000 on ICICI Bank Credit Card on orders above ₹1000', code: 'ICICI10' },
];

function OffersCouponsSection({ offers, onCopy }) {
  return (
    <motion.section
      className="rounded-xl p-4 md:p-6 mb-6"
      style={{
        background: 'var(--offer-bg)',
        border: '1.5px solid var(--offer-border)',
        boxShadow: '0 2px 16px 0 var(--offer-shadow)',
        transition: 'background 0.4s,border 0.4s',
      }}
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <style>
        {`
        :root {
          --offer-bg: #fff6fa;
          --offer-border: #ffdce8;
          --offer-shadow: #ff3f6c12;
          --offer-label: #ff3f6c;
          --offer-desc: #1a1a1a;
          --offer-pill-bg: #ffe5ef;
          --offer-pill-color: #ff3f6c;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --offer-bg: #23182a;
            --offer-border: #39213d;
            --offer-shadow: #a03c5b2e;
            --offer-label: #ff87aa;
            --offer-desc: #fff1f0;
            --offer-pill-bg: #401d2b;
            --offer-pill-color: #ffb2c8;
            }
          }
        `}
      </style>
      <div className="flex items-center gap-2 mb-2">
        <Percent size={24} className="text-[color:var(--offer-label)]" />
        <span className="text-lg md:text-xl font-bold tracking-tight text-[color:var(--offer-label)]">
          Offers &amp; Coupons
        </span>
      </div>
      <ul className="space-y-3 mt-2">
        {offers.map((offer) => (
          <li
            key={offer.id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 py-3 rounded group"
          >
            <span className="w-1.5 h-7 rounded-full bg-[color:var(--offer-label)] opacity-80 hidden sm:block mr-2" />
            <span className="inline-flex items-center gap-1.5 text-[color:var(--offer-label)] font-semibold">
              <Percent size={18} className="opacity-80" />
              {offer.label}
            </span>
            <span className="text-[color:var(--offer-desc)] dark:text-[color:var(--offer-desc)] text-base font-medium break-words">
              {offer.details}
            </span>
            <span className="ml-auto flex items-center gap-2 max-w-full">
              <span
                className="rounded-full px-3 text-xs md:text-sm py-1 bg-[color:var(--offer-pill-bg)] text-[color:var(--offer-pill-color)] font-bold font-mono shadow-sm tracking-wider border truncate"
                style={{ borderColor: 'var(--offer-border)', userSelect: 'all' }}
              >
                {offer.code}
              </span>
              <button
                className="group-hover:scale-110 transition p-1 rounded text-[color:var(--offer-label)] hover:bg-[color:var(--offer-pill-bg)]"
                onClick={() => onCopy(offer.code)}
                aria-label="Copy coupon code"
                type="button"
              >
                <Copy size={18} />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-wrap gap-y-2 gap-x-5">
      <div className="w-full sm:w-32 text-gray-600 dark:text-gray-300 font-semibold">{label}:</div>
      <div className="flex-1 text-gray-900 dark:text-white font-medium break-words">{value}</div>
    </div>
  );
}

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [media, setMedia] = useState(null);
  const [mediaURL, setMediaURL] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentInputRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    async function fetchProduct() {
      try {
        const productRef = doc(db, 'wishlist2cart_brands', productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const data = productSnap.data();
          setProduct({ id: productSnap.id, ...data, createdAt: data.createdAt ? data.createdAt.toDate() : null });
          setImgLoaded(false);
        } else {
          navigate('/404');
        }
      } catch (error) {
        toast.error('Failed to load product details: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId, navigate]);

  useEffect(() => {
    if (!productId) return;
    async function fetchReviews() {
      try {
        const reviewsQuery = query(
          collection(db, 'product_reviews'),
          where('productId', '==', productId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(reviewsQuery);
        const fetchedReviews = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date()
        }));
        setReviews(fetchedReviews);
      } catch (error) {
        toast.error('Failed to load reviews');
      }
    }
    fetchReviews();
  }, [productId]);

  const handleCopy = code => {
    navigator.clipboard.writeText(code);
    toast.success('Copied!');
  };

  const triggerConfetti = () => {
    confetti({ particleCount: 120, spread: 120, origin: { y: 0.6 } });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    triggerConfetti();
    toast.success('Added to cart!');
    setTimeout(() => navigate('/cart'), 800);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Please add some text to your review.');
      return;
    }
    if (!user) {
      toast.error('Please login to submit a review.');
      return;
    }
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'product_reviews'), {
        productId,
        name: user.displayName || user.email || 'Anonymous',
        rating: newRating,
        comment: newComment.trim(),
        media: '', // put uploaded media url here if any
        mediaType,
        createdAt: serverTimestamp(),
      });

      setReviews(prev => [{
        id: Date.now().toString(),
        productId,
        name: user.displayName || user.email || 'Anonymous',
        rating: newRating,
        comment: newComment.trim(),
        createdAt: new Date(),
        media: '',
        mediaType,
      }, ...prev]);

      setNewComment('');
      setNewRating(5);
      setMedia(null);
      setMediaURL('');
      setMediaType('');
      toast.success('Review submitted!');
      triggerConfetti();
    } catch (error) {
      toast.error('Failed to submit review.');
      console.error(error);
    }
    setIsSubmitting(false);
  };

  if (loading || !product) {
    return (
      <div className="max-w-6xl mx-auto px-3 font-poppins">
        <Skeleton height={500} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="overflow-x-hidden min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 py-6 max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-900 dark:text-gray-100 hover:text-pink-600 dark:hover:text-pink-400 transition-colors font-semibold text-base sm:text-lg"
          >
            ← Back
          </Button>

          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            {/* LEFT SIDE INFO */}
            <section className="w-full md:w-6/12 flex flex-col space-y-5">
              {/* Title & Price */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight break-words">
                {product.title}
              </h1>
              <div className="text-xl sm:text-2xl font-extrabold flex items-center gap-2 text-blue-700 dark:text-blue-400 flex-wrap">
                <span>₹{product.price?.toLocaleString('en-IN')}</span>
                {product.sourcePrice && (
                  <span className="text-base sm:text-lg font-medium line-through text-gray-400 dark:text-gray-500">
                    ₹{product.sourcePrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Tags & Brand */}
              <div className="flex flex-wrap gap-2 mb-3 max-w-full overflow-hidden">
                {(product.tags || []).map(tag => (
                  <span
                    key={tag}
                    className="truncate block max-w-[150px] bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-200 px-3 py-1 rounded-full text-xs sm:text-sm uppercase font-semibold tracking-wide"
                    title={tag}
                  >
                    {tag}
                  </span>
                ))}
                {product.brand && (
                  <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs sm:text-sm font-medium tracking-wide truncate max-w-[150px]" title={product.brand}>
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Offers Section */}
              <OffersCouponsSection offers={offers} onCopy={handleCopy} />

              {/* Add to Cart */}
              <Button
                size="lg"
                className="bg-blue-700 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400 text-white font-bold rounded-full px-6 py-3 shadow-lg transition-colors w-full max-w-xs"
                onClick={handleAddToCart}
                aria-label="Add product to cart"
              >
                Add to Cart
              </Button>

              {/* Product Details */}
              <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 mt-6">
                <div className="text-pink-600 dark:text-pink-300 font-bold text-lg mb-3">
                  Product Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                  <DetailRow label="Brand" value={product.brand || '-'} />
                  <DetailRow label="Fit" value={product.fit || '-'} />
                  <DetailRow label="Material" value={product.material || product.fabric || '-'} />
                  <DetailRow label="Color" value={product.color || '-'} />
                  <DetailRow label="Occasion" value={product.occasion || '-'} />
                  <DetailRow label="Category" value={product.category || '-'} />
                  <DetailRow label="Return Policy" value={product.returnPolicy || '10 days'} />
                  <DetailRow label="Shipping" value={product.shipping || 'Usually delivered in 2-5 days'} />
                </div>
              </div>
            </section>

            {/* RIGHT SIDE IMAGES */}
            <section className="w-full md:w-6/12 flex flex-col items-center gap-3 max-w-full">
              <div className="w-full max-w-full md:max-w-[420px] rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-300 dark:border-gray-700">
                <Swiper
                  style={{ '--swiper-navigation-color': '#ff3f6c', borderRadius: 'inherit' }}
                  modules={[Navigation, Thumbs]}
                  spaceBetween={10}
                  navigation
                  thumbs={{ swiper: thumbsSwiper }}
                  className="w-full max-w-full overflow-hidden"
                >
                  {product.images?.map((img, i) => (
                    <SwiperSlide key={i}>
                      {!imgLoaded && <Skeleton height={320} width="100%" />}
                      <motion.img
                        src={img}
                        alt={`${product.title} image ${i + 1}`}
                        className={`w-full aspect-[4/3] object-cover rounded-3xl transition-opacity duration-500 ${
                          imgLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        loading="lazy"
                        onLoad={() => setImgLoaded(true)}
                        initial={{ scale: 0.95 }}
                        animate={{ scale: imgLoaded ? 1 : 0.95, opacity: imgLoaded ? 1 : 0 }}
                        transition={{ duration: 0.45 }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <Swiper
                onSwiper={setThumbsSwiper}
                modules={[Thumbs]}
                spaceBetween={10}
                slidesPerView={Math.min(product.images?.length || 0, 4)}
                watchSlidesProgress
                className="mt-2 max-w-full overflow-x-auto"
                style={{ maxWidth: 350 }}
              >
                {product.images?.map((img, i) => (
                  <SwiperSlide
                    key={i}
                    className="cursor-pointer rounded-lg overflow-hidden border-2 border-white hover:border-pink-400 transition"
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </section>
          </div>

          {/* REVIEWS SECTION */}
          <section className="max-w-3xl mx-auto mt-12 px-4 sm:px-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                User Reviews
              </h2>
              {reviews.length > 0 && (
                <div className="text-lg flex items-center gap-1 sm:gap-2 text-yellow-400 ml-1 sm:ml-2">
                  <Star size={20} className="mt-0.5" />
                  <span className="font-semibold text-base sm:text-lg">
                    {(reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">({reviews.length})</span>
                </div>
              )}
            </div>
          
            <motion.ul layout className="space-y-4 max-h-72 sm:max-h-96 overflow-y-auto pr-2 mb-7">
              {reviews.length === 0 && (
                <motion.div className="text-gray-400 italic text-lg py-8 text-center">
                  No reviews yet. Be the first to review!
                </motion.div>
              )}
              {reviews.map(({ id, name, rating, comment, createdAt, media, mediaType }) => (
                <motion.li
                  key={id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white dark:bg-gray-800 px-5 py-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 break-words"
                  style={{ fontFamily: "'Poppins',sans-serif", fontSize: 16 }}
                >
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
                    <div
                      className="flex items-center space-x-1 text-yellow-400"
                      aria-label={`Rating: ${rating} out of 5`}
                      role="img"
                    >
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          fill={i < rating ? 'currentColor' : 'none'}
                          stroke={i < rating ? 'currentColor' : '#a0aec0'}
                          className={i < rating ? 'fill-current' : 'text-gray-300 dark:text-gray-600'}
                        />
                      ))}
                    </div>
                    <span className="ml-auto text-xs text-gray-400 font-mono truncate max-w-[120px]">
                      {new Date(createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-1 break-words">{comment}</p>
                  {media && (
                    <div className="mt-2 rounded overflow-hidden max-h-64">
                      {mediaType === 'image' ? (
                        <img src={media} alt="Review media" className="max-h-56 rounded border shadow" />
                      ) : (
                        <video controls src={media} className="max-h-56 rounded border shadow bg-black" />
                      )}
                    </div>
                  )}
                </motion.li>
              ))}
            </motion.ul>

            {/* ADD REVIEW FORM */}
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-2xl py-6 px-5 sm:px-6 bg-gradient-to-tr from-pink-50 via-pink-100 to-white dark:from-pink-900 dark:via-pink-800 dark:to-pink-900 border border-pink-300 dark:border-pink-700 shadow flex flex-col gap-4"
            >
              <label className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base">Your Rating</label>
              <StarRating rating={newRating} setRating={setNewRating} />

              <label htmlFor="comment" className="font-semibold text-gray-900 dark:text-gray-100 mt-3 text-sm sm:text-base">
                Your Review
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={isSubmitting}
                rows={4}
                placeholder="Write your review here..."
                className="w-full max-w-full p-3 rounded border border-pink-300 dark:border-pink-600 bg-white dark:bg-pink-900 text-gray-900 dark:text-pink-100 focus:ring-2 focus:ring-pink-400 transition-colors resize-none"
                minLength={3}
                maxLength={400}
                required
                ref={commentInputRef}
              />

              <Button
                type="submit"
                disabled={isSubmitting || !user}
                className="self-end px-6 py-2 rounded-full shadow-sm bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-400 text-white font-bold transition"
              >
                {isSubmitting ? 'Submitting...' : <span className="flex items-center gap-2 text-sm sm:text-base">Submit Review <Send size={18} /></span>}
              </Button>

              {!user && <p className="text-red-500 mt-2 text-center text-sm sm:text-base">Please sign in to add a review.</p>}
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
