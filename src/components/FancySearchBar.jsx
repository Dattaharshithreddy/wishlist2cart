import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Tag } from "lucide-react";

const trendingTags = ["bestseller", "new", "gift", "trending"];
const recentSearchKey = "w2c-recent-searches";
const MAX_RECENTS = 6;

export default function FancySearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search products, brands...",
  onSelect, // (item) => void, triggered on key selection
  suggestions = [],
  className = "",
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [searchVal, setSearchVal] = useState(value || "");
  const inputRef = useRef(null);

  // Keep in sync w/ parent
  useEffect(() => { setSearchVal(value || ""); }, [value]);
  useEffect(() => { if (!dropdown || !focused) setDropdown(false); }, [focused]);

  // Local storage of recents (smart memorization)
  const [recents, setRecents] = useState([]);
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem(recentSearchKey) || "[]");
    setRecents(items);
  }, []);
  const saveRecent = q => {
    if (!q || !q.trim()) return;
    let items = [...recents].filter(it => it.toLowerCase() !== q.toLowerCase());
    items = [q, ...items].slice(0, MAX_RECENTS);
    setRecents(items);
    localStorage.setItem(recentSearchKey, JSON.stringify(items));
  };

  // Keyboard navigation for dropdown
  const [highlighted, setHighlighted] = useState(-1);
  const dropdownData = [
    ...(searchVal.trim().length === 0
      ? [
          ...recents.map(r => ({ type: "recent", value: r })),
          ...trendingTags.map(t => ({ type: "tag", value: t }))
        ]
      : suggestions.map(s => ({ type: "suggestion", ...s })))
  ];

  // Handle UX events
  const handleChange = e => {
    setSearchVal(e.target.value);
    setDropdown(true);
    setHighlighted(-1);
    onChange?.(e);
  };

  const handleFocus = () => {
    setDropdown(true);
    setFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => setDropdown(false), 120);
    setFocused(false);
  };

  const handleClear = () => {
    setSearchVal("");
    setDropdown(false);
    setHighlighted(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = e => {
    if (!dropdown) return;
    if (e.key === "ArrowDown") {
      setHighlighted(h => (h + 1) % dropdownData.length);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted(h => (h - 1 + dropdownData.length) % dropdownData.length);
      e.preventDefault();
    } else if (e.key === "Enter" || e.key === "Tab") {
      if (highlighted >= 0 && dropdownData[highlighted]) {
        const item = dropdownData[highlighted];
        selectDropdownItem(item);
        e.preventDefault();
      } else if (searchVal.trim()) {
        saveRecent(searchVal.trim());
        onSelect?.({ type: "suggestion", value: searchVal.trim() });
        setDropdown(false);
      }
    }
  };

  const selectDropdownItem = (item) => {
    setDropdown(false);
    if (item.type === "recent" || item.type === "suggestion") {
      saveRecent(item.value);
      setSearchVal(item.value);
      onSelect?.(item);
    }
    if (item.type === "tag") {
      setSearchVal(`#${item.value}`);
      onSelect?.(item);
    }
    inputRef.current?.blur();
  };

  return (
    <motion.div
      className={`relative w-full max-w-full z-40 ${className}`}
      whileHover={{ boxShadow: "0 1px 16px rgba(168,85,247,0.10)" }}
    >
      <motion.div
        className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur bg-white/75 dark:bg-gray-800/60 shadow transition-all ring-1 ring-purple-100 dark:ring-purple-900 border border-transparent focus-within:ring-2 focus-within:ring-purple-500`}
        animate={focused ? { scale: 1.04 } : { scale: 1 }}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="w-5 h-5 text-purple-600" />
        <input
          ref={inputRef}
          type="text"
          value={searchVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={placeholder}
          spellCheck={false}
          placeholder={placeholder}
          className="flex-1 text-base bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white"
          {...props}
        />
        {searchVal && (
          <button
            onClick={handleClear}
            tabIndex={0}
            aria-label="Clear search"
            className="p-1 text-purple-500 hover:bg-purple-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </motion.div>

      {/* Dropdown suggestions */}
      <AnimatePresence>
        {dropdown && dropdownData.length > 0 && (
          <motion.ul
            key="dropdown"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: { bounce: 0.2, duration: 0.25 } }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-14 w-full min-w-[275px] max-h-[320px] z-50 overflow-auto rounded-xl shadow-lg bg-white dark:bg-gray-900 border border-purple-200 dark:border-gray-800 transition-colors ring-1 ring-purple-100 dark:ring-purple-900"
            style={{ overscrollBehavior: "contain" }}
            role="listbox"
          >
            {dropdownData.map((item, i) => (
              <motion.li
                key={item.value + "-" + item.type}
                role="option"
                aria-selected={highlighted === i}
                className={`
                  flex items-center gap-3 px-5 py-3 text-base cursor-pointer select-none
                  ${highlighted === i ? "bg-purple-50 dark:bg-purple-900/30 font-bold text-purple-700 dark:text-white" : "text-gray-700 dark:text-gray-300"}
                  transition-colors
                `}
                tabIndex={-1}
                onMouseDown={() => selectDropdownItem(item)}
                onMouseOver={() => setHighlighted(i)}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1, transition: { delay: i * 0.03 } }}
                exit={{ opacity: 0, x: 20 }}
              >
                {item.type === "tag" && <Tag className="w-4 h-4 text-purple-400" />}
                <span>
                  {item.value}
                  {item.type === "tag" && <span className="ml-2 text-xs font-medium text-purple-500 uppercase">#tag</span>}
                  {item.type === "recent" && <span className="ml-2 text-xs text-gray-400">Recent</span>}
                  {item.type === "suggestion" && item.desc && (
                    <span className="ml-2 text-xs text-gray-400">{item.desc}</span>
                  )}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
