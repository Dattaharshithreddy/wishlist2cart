// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { useWishlist } from "@/contexts/WishlistContext";
import RequireAuth from "@/components/RequireAuth";
import {
  Heart,
  Settings,
  ShoppingCart,
  Star,
  Trash2,
  PlusCircle,
  Bell,
  Package,
  Tag,
  Globe,
  Gift,
  Zap,
} from "lucide-react";
import useSound from "use-sound";
import clickSfx from "@/assets/click.mp3";
import confettiSfx from "@/assets/success.mp3";
import { shootConfetti } from "@/lib/utils";
import clsx from "clsx";

const storeLogos = {
  Amazon:
    "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  Flipkart:
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg",
  Myntra:
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg",
  Default:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png",
};

const useSmartSuggestions = (wishlist) => {
  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    if (!wishlist.length) return setSuggestions([]);
    const generateSuggestions = () =>
      setSuggestions(
        wishlist.slice(0, 4).map((item) => ({
          forId: item.id,
          title: `🔥 Hot Deal on "${item.title}"`,
          description:
            Math.random() < 0.5
              ? `Upgrade to "${item.title} Pro" at $${(item.price * 0.75).toFixed(
                  2
                )}`
              : `Limited sale: Only $${(item.price * 0.85).toFixed(2)} now`,
          ctaLabel: "Shop Now",
        }))
      );
    generateSuggestions();
    const interval = setInterval(generateSuggestions, 25000);
    return () => clearInterval(interval);
  }, [wishlist]);
  return suggestions;
};

const DashboardPage = () => {
  const {
    wishlistItems,
    w2cItems,
    toggleCartStatus,
    removeFromWishlist,
    removeFromW2C,
    addToWishlist,
  } = useWishlist();

  const { toast } = useToast();
  const [tab, setTab] = useState("universal");
  const navigate = useNavigate();
  const [playClick] = useSound(clickSfx, { volume: 0.3 });
  const [playConfetti] = useSound(confettiSfx, { volume: 0.7 });

  const currentItems = tab === "universal" ? wishlistItems : w2cItems;
  const suggestions = useSmartSuggestions(currentItems);

  const handleAdd = (item) => {
    playClick();
    if (tab === "universal") addToWishlist(item, "universal");
    else addToWishlist(item, "w2c");
    setTimeout(() => {
      shootConfetti();
      playConfetti();
    }, 200);
    toast({
      title: "🎉 Added!",
      description: `"${item.title}" has been added to your wishlist.`,
    });
  };

  const handleToggleCart = (id) => {
    playClick();
    toggleCartStatus(id, tab);
    const item = currentItems.find((it) => it.id === id);
    setTimeout(() => {
      shootConfetti();
      playConfetti();
    }, 200);
    toast({
      title: "Updated!",
      description: `${item?.title} moved to ${item?.inCart ? "wishlist" : "cart"}.`,
    });
  };

  const handleDelete = (id) => {
    playClick();
    if (tab === "universal") removeFromWishlist(id);
    else removeFromW2C(id);
    toast({
      title: "Removed",
      description: "Item successfully removed.",
      variant: "destructive",
    });
  };

  return (
    <RequireAuth>
      <>
        <Helmet>
          <title>Dashboard - Wishlist2Cart</title>
          <meta name="description" content="Manage your wishlists with the best UX ever." />
        </Helmet>

        <motion.div
          className="container mx-auto p-6 max-w-[1400px]"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Tabs */}
          <div className="flex space-x-6 mb-8 justify-center text-xl font-semibold select-none">
            {["universal", "w2c"].map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={clsx(
                  "px-6 py-3 rounded-full transition-shadow shadow-md",
                  tab === value
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-700"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                )}
                aria-label={`Switch to ${value === "universal" ? "Universal Wishlist" : "W2C Wishlist"}`}
              >
                {value === "universal" ? "Universal Wishlist" : "W2C Wishlist"}
              </button>
            ))}
          </div>

          {/* Wishlist Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            aria-live="polite"
          >
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <motion.article
                  key={item.id}
                  layout
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgb(124 58 237 / 0.5)" }}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 flex flex-col justify-between relative"
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-4 rounded-xl overflow-hidden w-[140px] h-[140px] drop-shadow-lg">
                      <img
                        src={storeLogos[item.store] || item.image || storeLogos.Default}
                        alt={item.title}
                        className="object-contain w-full h-full bg-white dark:bg-gray-700"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-center truncate max-w-[140px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-indigo-700 dark:text-indigo-400 font-extrabold text-xl">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 cursor-default select-none"
                        >
                          <Tag className="inline-block mr-1 w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex justify-center gap-4">
                    <Button
                      size="sm"
                      variant={item.inCart ? "outline" : "default"}
                      className="flex items-center gap-2"
                      onClick={() => handleToggleCart(item.id)}
                      aria-pressed={item.inCart}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {item.inCart ? "In Cart" : "Move to Cart"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="col-span-full text-center p-20 bg-white dark:bg-gray-900 rounded-3xl shadow-lg text-gray-500 dark:text-gray-400">
                <Heart className="mx-auto mb-6 w-14 h-14 text-indigo-400 animate-pulse" />
                <p className="text-xl mb-6">Your wishlist is empty.</p>
                <Button
                  className="px-10 py-3 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                  asChild
                >
                  <Link to={tab === "universal" ? "/add-wishlist" : "/add-w2c"}>
                    Add your first item
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Smart Suggestions Section */}
          <section className="mt-16">
            <h2 className="text-3xl font-extrabold text-center mb-8 gradient-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent select-none flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
              Hot Smart Deals & Price Drops
            </h2>

            {suggestions.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 italic max-w-xl mx-auto">
                No suggestions available right now. Add some products to get recommendations.
              </p>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } },
                }}
              >
                {suggestions.map(({ forId, title, description, ctaLabel }, i) => (
                  <motion.div
                    key={forId}
                    className="rounded-3xl p-6 bg-purple-50 dark:bg-purple-900 border border-purple-300 dark:border-purple-700 shadow-lg cursor-pointer flex flex-col items-center text-center hover:shadow-purple-600 transition-shadow"
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.96 },
                      show: { opacity: 1, y: 0, scale: 1 },
                    }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => toast({ title, description })}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => (e.key === "Enter" ? toast({ title, description }) : null)}
                  >
                    <Star className="w-10 h-10 text-purple-700 dark:text-purple-300 mb-3" />
                    <h3 className="font-semibold text-xl mb-2">{title}</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">{description}</p>
                    <Button
                      variant="outline"
                      className="rounded-full tracking-wide"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title, description });
                      }}
                    >
                      {ctaLabel}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>
        </motion.div>
      </>
    </RequireAuth>
  );
};

export default DashboardPage;
