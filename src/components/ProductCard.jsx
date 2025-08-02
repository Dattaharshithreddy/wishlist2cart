import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Tag } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import confetti from 'canvas-confetti';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({
  product,
  wishlisted,
  onWishlistToggle,
  onCardClick,
  showAddToCart = true,
  showBuyNow = false,
  tabIndex = 0,
  ...props
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    confetti({ particleCount: 55, spread: 77, origin: { y: 0.8 } });
    toast({ title: 'Added to Cart', description: `${product.title} is in your cart!` });
  };

  // Price flash for sort
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (props.priceFlash) {
      setFlash(true);
      setTimeout(() => setFlash(false), 650);
    }
  }, [props.priceFlash]);

  return (
    <div
      tabIndex={tabIndex}
      role="button"
      aria-label={`View details for ${product.title}`}
      className={`relative transition-all cursor-pointer overflow-hidden product-card group rounded-3xl bg-white dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 hover:border-violet-500 focus-visible:outline-violet-700 shadow-md hover:shadow-2xl hover:scale-[1.03] my-2`}
      onClick={onCardClick}
      onKeyDown={e => { if (['Enter', ' '].includes(e.key)) { onCardClick(); } }}
      style={{ minHeight: 430 }}
      {...props}
    >
      {/* Heart/Wishlist in corner */}
      <button
        className={`absolute top-3 right-4 z-10 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow ${wishlisted ? 'text-red-600' : 'text-gray-300 hover:text-red-500'} transition`}
        onClick={e => { e.stopPropagation(); onWishlistToggle(product); }}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        tabIndex={0}
      >
        <Heart size={22} fill={wishlisted ? 'currentColor' : 'none'} />
      </button>

      {/* Image or shimmer */}
      <div className="relative mb-4 h-48 rounded-xl overflow-hidden shadow-inner group-hover:brightness-110 transition-all">
        {!imgLoaded && <Skeleton height={192} width="100%" baseColor="#ddd" className="rounded-xl" />}
        <img
          src={product.image}
          alt={product.title}
          className={`transition-opacity duration-300 object-cover h-48 w-full rounded-xl ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImgLoaded(true)}
          loading="lazy"
          draggable={false}
        />
        <div className="absolute top-2 left-2 flex flex-wrap space-x-1">
          {product.tags && product.tags.map(tag => (
            <span key={tag} className="bg-violet-600 text-white text-[11px] px-2 py-0.5 rounded-md select-none uppercase shadow-sm font-semibold tracking-wider mr-1">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold leading-tight line-clamp-2 text-gray-900 dark:text-white mb-1">{product.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-3 flex-grow">{product.description}</p>

      <div className="flex items-center gap-2 mb-2 text-gray-400">
        <Tag className="h-4 w-4" />
        <span className="text-xs lowercase tracking-wide">{product.category}</span>
      </div>

      {/* Price with flash */}
      <div className={`text-xl font-extrabold text-violet-600 mb-4 transition-all duration-700 ${flash ? 'bg-yellow-200 px-2 py-1 rounded' : ''}`}>
        ₹{product.price?.toLocaleString('en-IN')}
      </div>

      <div className="mt-auto flex gap-3">
        {showAddToCart && (
          <button
            className="w-full flex items-center justify-center gap-2 font-bold bg-violet-600 text-white rounded-lg py-2 px-4 hover:bg-violet-700 transition focus:outline-none focus:ring-2 focus:ring-violet-500"
            onClick={handleAddToCart}
            aria-label={`Add ${product.title} to cart`}
          >
            <ShoppingCart className="mr-1 h-5 w-5" />
            Add to Cart
          </button>
        )}
        {showBuyNow && product.affiliateUrl && (
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 font-bold border border-violet-600 text-violet-600 rounded-lg py-2 px-4 hover:bg-violet-600 hover:text-white focus:outline-none transition"
          >
            Buy Now
          </a>
        )}
      </div>
    </div>
  );
}
