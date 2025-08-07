// src/components/Button.jsx

import React from 'react';

// A simple button using only Tailwind CSS
export const CustomButton = ({ children, className, type = "button", ...props }) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg p-2 text-sm font-medium transition-colors 
  bg-white text-gray-900 hover:bg-gray-100 
  dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/10 
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 
  disabled:pointer-events-none disabled:opacity-50 
  ${className}`}

      {...props}
    >
      {children}
    </button>
  );
};
