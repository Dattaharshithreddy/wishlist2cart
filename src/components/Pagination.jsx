import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination Navigation" className="flex justify-center gap-2 mt-6">
      {pages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded border text-sm ${
            page === currentPage
              ? 'bg-blue-500 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          aria-current={page === currentPage ? 'page' : null}
          aria-label={`Go to page ${page}`}
        >
          {page}
        </button>
      ))}
    </nav>
  );
}
