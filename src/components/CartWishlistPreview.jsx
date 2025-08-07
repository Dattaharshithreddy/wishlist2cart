import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/Popover";

export default function CartWishlistPreview({ cartItems, wishlistItems }) {
  const navigate = useNavigate();

  // Show last 3 items for preview
  const lastCartItems = cartItems.slice(-3).reverse();
  const lastWishlistItems = wishlistItems.slice(-3).reverse();

  const totalCartCount = cartItems.reduce((acc, item) => acc + (item.quantity ?? 1), 0);
  const totalWishlistCount = wishlistItems.length;

  return (
    <div className="flex items-center space-x-4 text-white">
      {/* Wishlist Popup */}
      <Popover
        trigger={
          <button
            aria-label="Open Wishlist"
            className="relative focus:outline-none focus:ring-2 focus:ring-violet-400 rounded p-2"
          >
            <Heart className="w-6 h-6 text-pink-500 dark:text-pink-400" />
            {totalWishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-pink-600 text-xs font-semibold text-white shadow-md">
                {totalWishlistCount}
              </span>
            )}
          </button>
        }
      >
        <div className="p-4 max-w-xs w-[90vw] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg text-gray-900 dark:text-gray-100">
          <h3 className="font-bold mb-2 text-lg">Wishlist ({totalWishlistCount})</h3>
          {totalWishlistCount === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No wishlist items yet.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700">
              {lastWishlistItems.map((item) => (
                <li
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/products/${item.id}`)}
                  onKeyDown={e => { if(e.key === 'Enter' || e.key === ' ') navigate(`/products/${item.id}`); }}
                  className="flex items-center gap-3 rounded p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                  </div>
                  <div className="text-sm font-bold text-pink-600 dark:text-pink-400 select-none">
                    ₹{item.price?.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
  as={Link}
  to="/wishlist"
  className="mt-3 w-full text-white bg-pink-600 hover:bg-pink-700 dark:bg-pink-500 dark:hover:bg-pink-600 focus:ring-4 focus:ring-pink-300 dark:focus:ring-pink-700 transition"
  size="sm"
  aria-label="View Wishlist"
>
  View Wishlist
</Button>

        </div>
      </Popover>

      {/* Cart Popup */}
      <Popover
        trigger={
          <button
            aria-label="Open Cart"
            className="relative focus:outline-none focus:ring-2 focus:ring-violet-400 rounded p-2"
          >
            <ShoppingCart className="w-6 h-6 text-violet-400 dark:text-violet-300" />
            {totalCartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-purple-600 text-xs font-semibold text-white shadow-md">
                {totalCartCount}
              </span>
            )}
          </button>
        }
      >
        <div className="p-4 max-w-xs w-[90vw] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg text-gray-900 dark:text-gray-100">
          <h3 className="font-bold mb-2 text-lg">Cart ({totalCartCount})</h3>
          {totalCartCount === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No items in your cart.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700">
              {lastCartItems.map((item) => (
                <li
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/products/${item.id}`)}
                  onKeyDown={e => { if(e.key === 'Enter' || e.key === ' ') navigate(`/products/${item.id}`); }}
                  className="flex items-center gap-3 rounded p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                  </div>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 select-none">
                    ₹{item.price?.toLocaleString()} × {item.quantity ?? 1}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button
            as={Link}
            to="/cart"
            className="mt-3 w-full text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-700 transition"
            size="sm"
            aria-label="View Cart"
          >
            View Cart
          </Button>
        </div>
      </Popover>
    </div>
  );
}
