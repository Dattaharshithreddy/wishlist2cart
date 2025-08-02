// src/components/Dashboard/WishlistFilters.jsx

import React from 'react';

const filterOptions = [
  { id: 'recent', label: 'Recently Added' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'store', label: 'By Store' },
  { id: 'a-z', label: 'A-Z' },
];

const WishlistFilters = ({ sortMethod, setSortMethod }) => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <label htmlFor="sort" className="font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sort"
        value={sortMethod}
        onChange={(e) => setSortMethod(e.target.value)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
      >
        {filterOptions.map(({ id, label }) => (
          <option key={id} value={id}>{label}</option>
        ))}
      </select>
    </div>
  );
};

export default WishlistFilters;
