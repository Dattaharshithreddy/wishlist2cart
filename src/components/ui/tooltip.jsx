import React from 'react';

const Tooltip = ({ content, children, delayDuration = 500 }) => {
  // Simple tooltip example; you can replace with Radix UI or your preferred lib
  return (
    <div className="relative group">
      {children}
      <div
        className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50"
        style={{ transitionDelay: `${delayDuration}ms` }}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
};

export { Tooltip };
