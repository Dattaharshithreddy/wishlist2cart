// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Heart,
  Menu,
  X,
  LogOut,
  User,
  Search,
  Globe,
  Gift,
  Star,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { path: "/dashboard", name: "Dashboard", icon: Heart, roles: ["user", "admin"] },
  { path: "/add-wishlist", name: "Add Wishlist", icon: Globe, roles: ["user", "admin"] },
  { path: "/add-w2c", name: "Add W2C", icon: Gift, roles: ["user", "admin"] },
  { path: "/cart", name: "My Cart", icon: ShoppingCart, roles: ["user", "admin"] },
  { path: "/synced-sites", name: "Synced Sites", icon: Star, roles: ["user", "admin"] },
  { path: "/settings", name: "Settings", icon: User, roles: ["user", "admin"] },
  { path: "/admin", name: "Admin Panel", icon: User, roles: ["admin"] },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMenuOpen(false); // close menu on route change
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredLinks = NAV_LINKS.filter(
    (link) => user && (!link.roles || link.roles.includes(user.role || "user"))
  );

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 transition-shadow ${
        scrolled ? "shadow-2xl" : ""
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 70, damping: 20 }}
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between p-4 md:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 select-none"
          aria-label="Homepage"
        >
          <motion.div
            whileHover={{ scale: 1.2, rotate: 15 }}
            className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg text-white text-3xl font-black"
          >
            W2C
          </motion.div>
          <span className="hidden sm:block font-black text-3xl tracking-wide bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 bg-clip-text text-transparent">
            Wishlist2Cart
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {filteredLinks.map(({ path, name, icon: IconComp }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-1 px-4 py-2 rounded-lg font-semibold text-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/40"
                    : "text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                }`
              }
            >
              <IconComp className="w-5 h-5" />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search Icon (could expand to input) */}
          <button
            aria-label="Search"
            className="hidden md:flex items-center justify-center w-11 h-11 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-700 transition"
          >
            <Search className="w-6 h-6 text-indigo-600" />
          </button>

          {/* User Controls */}
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-700 transition"
                aria-label="Wishlist"
              >
                <Heart className="h-6 w-6 text-indigo-600" />
              </Link>

              <Link
                to="/cart"
                className="relative inline-flex items-center justify-center p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-700 transition"
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
                {/* TODO: Add Badge on cart count */}
              </Link>

              <Link
                to="/settings"
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition"
                aria-label="User Settings"
                title={user.name || "User Settings"}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "User Avatar"}
                    className="w-10 h-10 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </Link>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Log Out"
                onClick={handleLogout}
                className="text-indigo-600 hover:text-indigo-800 dark:hover:text-indigo-400"
              >
                <LogOut className="w-6 h-6" />
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="text-indigo-600 font-extrabold hover:text-indigo-800 dark:hover:text-indigo-400"
            >
              <Link to="/login">Log In</Link>
            </Button>
          )}

          {/* Mobile Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white dark:bg-gray-900 py-4 shadow-lg border-b border-gray-300 dark:border-gray-700"
          >
            <div className="flex flex-col space-y-1 px-6">
              {filteredLinks.map(({ path, name, icon: IconComp }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 font-semibold rounded-md transition-colors ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-gray-700 hover:bg-indigo-100 dark:text-gray-300 dark:hover:bg-indigo-700"
                    }`
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <IconComp className="w-5 h-5" />
                  {name}
                </NavLink>
              ))}

              {user && (
                <button
                  className="w-full text-left px-4 py-3 font-semibold text-red-600 hover:bg-red-100 dark:hover:bg-red-700 dark:text-red-400 rounded-md"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    navigate("/");
                  }}
                >
                  Log Out
                </button>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
