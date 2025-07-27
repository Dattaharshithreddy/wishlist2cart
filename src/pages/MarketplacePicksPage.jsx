// src/pages/MarketplacePicksPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import Fuse from "fuse.js";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";

const platformLogos = {
  Amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  Flipkart: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Flipkart_logo_vector.svg',
  Myntra: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.svg',
  Alibaba: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Alibaba_Logo.svg',
  Meesho: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Meesho_Logomark.png',
  Other: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Shopping_Cart_Icon.svg/1024px-Shopping_Cart_Icon.svg.png',
};

const marketplaceCategories = [
  "Mobiles",
  "Fashion",
  "Home Essentials",
  "Sports & Fitness",
];

export default function MarketplacePicksPage() {
  const [category, setCategory] = useState(marketplaceCategories[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [products, setProducts] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        toast({
          title: "Failed to load marketplace picks",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      }
    };
    fetchProducts();
  }, [toast]);

  const fuse = useMemo(() => new Fuse(products, {
    keys: ["title", "description", "tags"],
    threshold: 0.35,
    ignoreLocation: true,
  }), [products]);

  const filteredByCategory = useMemo(() => {
    if (!category) return products;
    return products.filter(p => p.category === category);
  }, [products, category]);

  const searchedProducts = useMemo(() => {
    if (!searchTerm.trim()) return filteredByCategory;
    const results = fuse.search(searchTerm.trim());
    const searched = results.map(r => r.item);
    return searched.filter(p => filteredByCategory.includes(p));
  }, [searchTerm, fuse, filteredByCategory]);

  const sortedProducts = useMemo(() => {
    let sorted = [...searchedProducts];
    switch (sortKey) {
      case "price_asc":
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price_desc":
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "newest":
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    return sorted;
  }, [searchedProducts, sortKey]);

  const handleAddOrBuy = (product) => {
    if (product.isCustom) {
      addToCart(product);
      toast({ title: "Added to cart", description: `${product.title} has been added to your cart.` });
    } else if (product.url) {
      window.open(product.url, "_blank", "noopener,noreferrer");
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  return (
    <>
      <Helmet>
        <title>Marketplace Picks</title>
        <meta name="description" content="Hottest finds from the web—handpicked for Wishlist2Cart shoppers!" />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-12 max-w-7xl"
      >
        {/* Header & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Marketplace Picks</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Discover trending deals and curated products from our partner stores.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Input type="search" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" aria-label="Search products" />
            <select value={sortKey} onChange={e => setSortKey(e.target.value)} aria-label="Sort products" className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          {marketplaceCategories.map(cat => (
            <Button key={cat} variant={category === cat ? "default" : "ghost"} className="capitalize" onClick={() => setCategory(cat)} size="sm" aria-pressed={category === cat}>
              {cat}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-500 dark:text-gray-400">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-800/50 shadow-lg border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col group hover:border-green-500 transition cursor-pointer"
                onClick={() => toggleExpand(product.id)}
              >
                <div className="relative mb-4 h-52">
                  <img
                    src={product.image || platformLogos[product.platform] || platformLogos.Other}
                    alt={product.title || product.platform}
                    className="object-cover h-full w-full rounded-xl"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-1 line-clamp-2">{product.title || product.platform}</h3>
                <p className="text-gray-500 text-sm mb-2 line-clamp-3">{product.description}</p>
                <div className="flex-1" />
                <div className="text-xl font-bold text-green-600 mb-4">
                  {(product.price && product.price > 0)
                    ? `₹${product.price.toLocaleString()}`
                    : "See price on site"}
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full justify-center cursor-pointer"
                  onClick={e => { e.stopPropagation(); handleAddOrBuy(product); }}
                  aria-label={product.isCustom ? "Add to Cart" : `Buy from ${product.platform}`}
                >
                  {product.isCustom ? "Add to Cart" : "Buy on Marketplace"}
                  {!product.isCustom && <ExternalLink className="ml-2 h-4 w-4" />}
                </Button>
                {expandedId === product.id && (
                  <div className="mt-4 p-4 rounded bg-gray-50 dark:bg-gray-800/80">
                    <img
                      src={product.image || platformLogos[product.platform] || platformLogos.Other}
                      className="max-h-32 mb-2"
                      alt={product.title}
                    />
                    <div className="font-bold">{product.title}</div>
                    <div>{product.description}</div>
                    {product.price > 0 && (
                      <div className="mt-2 font-semibold text-green-700">₹{product.price.toLocaleString()}</div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">Platform: {product.platform}</div>
                    <Button
                      className="mt-4"
                      variant="secondary"
                      onClick={e => { e.stopPropagation(); handleAddOrBuy(product); }}
                    >
                      {product.isCustom ? "Add to Cart" : "Go to Product"}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );
}
