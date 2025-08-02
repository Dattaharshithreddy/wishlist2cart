import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Skeleton from 'react-loading-skeleton';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Star, Send, Camera, Video, ImagePlus, Trash2, Copy } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
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

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [media, setMedia] = useState(null);
  const [mediaURL, setMediaURL] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const commentInputRef = useRef(null);
  const { user } = useAuth();

  // Load Product
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

  // Load Reviews
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

  // Review media handler
  const handleMediaChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMedia(file);
    setMediaURL(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('image') ? 'image' : 'video');
  };

  const removeMedia = () => {
    setMedia(null);
    setMediaURL('');
    setMediaType('');
  };

  // Copy coupon code
  const handleCopy = code => {
    navigator.clipboard.writeText(code);
    toast.success('Copied!');
  };

  // Confetti (after actions)
  const triggerConfetti = () => {
    confetti({ particleCount: 120, spread: 120, origin: { y: 0.6 } });
  };

  // Add to cart
  const handleAddToCart = () => {
    // Call actual cart adding logic if enabled.
    triggerConfetti();
    toast.success('Added to cart!');
    setTimeout(() => navigate('/cart'), 800);
  };

  // Post a new review
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

  let uploadedMediaUrl = '';

  if (media) {
    try {
      // Create a unique file name
      const fileExtension = media.name.split('.').pop();
      const fileName = `review_media/${user.uid}/${nanoid()}.${fileExtension}`;

      const storageRef = ref(storage, fileName);
      // Upload with resumable task for progress tracking if needed
      const uploadTask = uploadBytesResumable(storageRef, media);

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          null, 
          (error) => reject(error), 
          () => resolve()
        );
      });

      // Get download URL
      uploadedMediaUrl = await getDownloadURL(storageRef);
    } catch (error) {
      toast.error('Failed to upload media. Please try again.');
      setIsSubmitting(false);
      return;
    }
  }

  try {
    await addDoc(collection(db, 'product_reviews'), {
      productId,
      name: user.displayName || user.email || 'Anonymous',
      rating: newRating,
      comment: newComment.trim(),
      media: uploadedMediaUrl,
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
      media: uploadedMediaUrl,
      mediaType,
    }, ...prev]);

    setNewComment('');
    setNewRating(5);
    removeMedia();
    toast.success('Review submitted!');
    triggerConfetti();
  } catch (error) {
    toast.error('Failed to submit review.');
    console.error(error);
  }

  setIsSubmitting(false);
};

  // Format timestamp
  const formatTime = dt => {
    if (!dt) return '';
    const d = typeof dt === 'object' && dt.toLocaleString ? dt : new Date(dt);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading || !product) {
    return (
      <div className="max-w-6xl mx-auto px-3">
        <Skeleton height={500} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="container mx-auto px-2 md:px-6 py-10 md:py-14 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
          ← Back
        </Button>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Product Gallery */}
          <section className="md:w-2/5 space-y-4 select-none">
            <Swiper
              style={{ '--swiper-navigation-color': '#7c3aed' }}
              modules={[Navigation, Thumbs]}
              spaceBetween={10}
              navigation
              thumbs={{ swiper: thumbsSwiper }}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              {product.images?.map((img, i) => (
                <SwiperSlide key={i}>
                  {!imgLoaded && <Skeleton height={350} width="100%" />}
                  <motion.img
                    src={img}
                    alt={`${product.title} image ${i + 1}`}
                    className={`w-full h-96 object-cover rounded-2xl ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    onLoad={() => setImgLoaded(true)}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: imgLoaded ? 1 : 0.95, opacity: imgLoaded ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
            <Swiper
              onSwiper={setThumbsSwiper}
              modules={[Thumbs]}
              spaceBetween={12}
              slidesPerView={product.images?.length > 4 ? 4 : product.images?.length}
              watchSlidesProgress
              className="max-w-full"
            >
              {product.images?.map((img, i) => (
                <SwiperSlide key={i} className="cursor-pointer rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
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

          {/* Main Info + Deals */}
          <section className="md:w-3/5 flex flex-col">
            {/* Title, Price, Tags */}
            <h1 className="text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">
              {product.title}
            </h1>
            <div className="text-2xl font-bold text-violet-600 mb-4">
              ₹{product.price?.toLocaleString('en-IN')}
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
              {product.tags?.map(tag => (
                <span
                  key={tag}
                  className="bg-violet-600 text-white px-3 py-1 rounded-full text-xs uppercase font-semibold select-none"
                >
                  {tag}
                </span>
              ))}
              {product.category && (
                <span className="ml-auto bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-xs font-medium">
                  {product.category}
                </span>
              )}
            </div>

            {/* Offers Section */}
            <motion.div
              className="rounded-xl mb-8 p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900/70 dark:to-gray-800/80 border border-violet-200 dark:border-violet-900/60 shadow"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl font-bold text-violet-600">Offers & Coupons</span>
                <img src="/assets/coupon.svg" alt="" className="h-7 w-7" loading="lazy" />
              </div>
              <ul className="space-y-2">
                {offers.map(offer => (
                  <li key={offer.id} className="flex items-center gap-2">
                    <span className="font-medium text-violet-700">{offer.label}:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-100">{offer.details}</span>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleCopy(offer.code)}
                      className="ml-3 font-mono flex gap-1"
                    >
                      {offer.code}
                      <Copy size={15} />
                    </Button>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Add to Cart */}
            <Button size="lg" className="mb-9 text-lg font-semibold" onClick={handleAddToCart} aria-label="Add product to cart">
              Add to Cart
            </Button>

            {/* Product Details Card */}
            <motion.div
              className="mb-12 rounded-2xl bg-white/90 dark:bg-gray-900/70 px-7 py-7 border border-gray-200 dark:border-gray-800 shadow"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="font-bold text-lg text-gray-900 dark:text-violet-200 mb-5">Product Details</div>
              <div className="grid sm:grid-cols-2 gap-y-3 gap-x-12">
                <DetailRow label="Brand" value={product.brand || "W2C Originals"} />
                <DetailRow label="Fit" value={product.fit || "-"} />
                <DetailRow label="Material" value={product.material || product.fabric || "-"} />
                <DetailRow label="Color" value={product.color || "-"} />
                <DetailRow label="Occasion" value={product.occasion || "-"} />
                <DetailRow label="Category" value={product.category || "-"} />
                <DetailRow label="In Stock" value={product.inStock ? "Yes" : "No"} />
                <DetailRow label="Return Policy" value={product.returnPolicy || "10 days"} />
                <DetailRow label="Shipping" value={product.shipping || "Usually delivered in 2-5 days"} />
                {/* add more according to your DB */}
              </div>
            </motion.div>
          </section>
        </div>

        {/* Reviews */}
        <section className="max-w-3xl mt-12 mx-auto px-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">User Reviews</div>
            <div className="text-lg flex items-center gap-1 text-yellow-500">
              {reviews.length > 0 && (
                <>
                  <Star size={20} className="mt-0.5" />
                  <span className="font-semibold">{(reviews.reduce((a, r) => a + (r.rating || 0), 0) / reviews.length).toFixed(1)}</span>
                  <span className="text-gray-500 dark:text-gray-300">({reviews.length})</span>
                </>
              )}
            </div>
          </div>

          <motion.ul layout className="space-y-5 max-h-96 overflow-y-auto pr-2 mb-8">
            {reviews.length === 0 && (
              <motion.div className="text-gray-400 italic text-lg py-8 text-center">No reviews yet. Be the first to review!</motion.div>
            )}
            {reviews.map(({ id, name, rating, comment, createdAt, media, mediaType }) => (
              <motion.li
                key={id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gray-100 dark:bg-gray-800/80 p-4 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                  <span className="font-semibold text-gray-900 dark:text-white">{name}</span>
                  <div className="flex items-center space-x-1 text-yellow-400" aria-label={`Rating: ${rating} out of 5`}>
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
                  <span className="ml-auto text-xs text-gray-400 font-mono">{formatTime(createdAt)}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2 break-words">{comment}</p>
                {media && (
                  <div className="mt-2 rounded overflow-hidden">
                    {mediaType === 'image'
                      ? <img src={media} alt="Review upload" className="max-h-52 max-w-full rounded border shadow" />
                      : <video controls src={media} className="max-h-52 rounded border shadow bg-black" />
                    }
                  </div>
                )}
              </motion.li>
            ))}
          </motion.ul>

          {/* Add a review */}
          <form
            className="rounded-xl py-6 px-5 bg-gradient-to-tr from-violet-50 via-blue-50 to-white dark:from-gray-900/60 dark:to-gray-800/80 border shadow flex flex-col gap-4"
            onSubmit={handleReviewSubmit}
            aria-label="Add a new review"
            encType="multipart/form-data"
          >
            <div className="flex flex-col md:flex-row gap-2 items-center">
              <label htmlFor="rating" className="font-medium mb-1 text-gray-700 dark:text-gray-300 min-w-[60px]">
                Rating
              </label>
              <select
                id="rating"
                name="rating"
                className="rounded border dark:bg-gray-900 border-gray-300 dark:border-gray-700 px-3 py-2 w-24 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={newRating}
                onChange={e => setNewRating(Number(e.target.value))}
                disabled={isSubmitting}
                required
              >
                {[5, 4, 3, 2, 1].map(n => (
                  <option key={n} value={n}>{n} Star{n > 1 && 's'}</option>
                ))}
              </select>
              <span className="hidden sm:inline text-gray-400 px-2">|</span>
              <input
                id="comment"
                name="comment"
                aria-label="Comment"
                type="text"
                required
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={isSubmitting}
                ref={commentInputRef}
                minLength={3}
                maxLength={400}
                placeholder="Write your review here..."
                className="flex-1 rounded border border-gray-300 dark:bg-gray-900 dark:border-gray-700 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            {/* Upload Media: image/video */}
            <div className="flex items-center gap-4 mt-2">
              <label htmlFor="review-media" className="flex gap-2 items-center cursor-pointer font-medium text-violet-700">
                <ImagePlus size={21} /> Add Photo/Video
              </label>
              <input
                id="review-media"
                className="hidden"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaChange}
                disabled={isSubmitting}
              />
              {media && (
                <div className="flex gap-2 items-center">
                  {mediaType === 'image'
                    ? <img src={mediaURL} alt="preview" className="h-12 rounded border" />
                    : <video src={mediaURL} className="h-12 rounded border bg-black" />
                  }
                  <button type="button" onClick={removeMedia} className="text-red-500" title="Remove media">
                    <Trash2 />
                  </button>
                </div>
              )}
            </div>
            <Button type="submit" disabled={isSubmitting || !user} className="self-end px-8 py-2">
              {isSubmitting ? 'Submitting...' : <span className="flex items-center gap-2">Submit Review <Send size={18} /></span>}
            </Button>
            {!user && <div className="text-red-500 mt-3 text-sm">Please sign in to add a review.</div>}
          </form>
        </section>
      </div>
    </>
  );
}

// Helper for details row.
function DetailRow({ label, value }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <div className="w-32 text-gray-600 dark:text-gray-300 font-semibold">{label}:</div>
      <div className="flex-1 text-gray-900 dark:text-white font-medium">{value}</div>
    </div>
  );
}
