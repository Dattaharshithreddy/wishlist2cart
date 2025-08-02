import React from 'react';
import { Search, X } from 'lucide-react';

export default function FancySearchBar({ value, onChange, onClear, ...props }) {
  return (
    <div className="relative flex w-full max-w-md items-center">
      <Search className="absolute left-3 h-5 w-5 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder="Search products by name, tag, or description…"
        className="w-full pl-10 pr-10 py-3 text-base rounded-md border border-gray-300 bg-gray-100 focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-500 shadow transition"
        {...props}
      />
      {value && (
        <button
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
