import React from 'react';
import { Star } from 'lucide-react';

// Modern, accessible, and dark/light mode friendly Star Rating
export function StarRating({ rating, setRating, disabled = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-1 select-none" role="radiogroup" aria-label="Rating">
      {stars.map(star => (
        <StarIcon
          key={star}
          filled={star <= rating}
          onClick={() => !disabled && setRating(star)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setRating(star);
            }
          }}
          tabIndex={disabled ? -1 : 0}
          ariaChecked={star === rating}
          ariaLabel={`${star} star${star > 1 ? 's' : ''}`}
          role="radio"
        />
      ))}
    </div>
  );
}

// The StarIcon now renders full yellow when selected
function StarIcon({ filled, onClick, onKeyDown, tabIndex, ariaChecked, ariaLabel, role }) {
  return (
    <Star
      size={28}
      fill={filled ? 'currentColor' : 'none'}  // fill entire star when filled
      stroke="currentColor"
      className={`cursor-pointer transition-colors 
        ${filled ? 'text-yellow-400' : 'text-gray-400 dark:text-gray-600'}
        hover:text-yellow-300 dark:hover:text-yellow-500`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      aria-checked={ariaChecked}
      aria-label={ariaLabel}
      role={role}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
