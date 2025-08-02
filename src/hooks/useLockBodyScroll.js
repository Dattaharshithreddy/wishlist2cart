// utils/useLockBodyScroll.js
import { useLayoutEffect } from 'react';

export const useLockBodyScroll = (locked) => {
  useLayoutEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (locked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalStyle;
    }

    return () => {
      // Restore original overflow style on unmount or dependency change
      document.body.style.overflow = originalStyle;
    };
  }, [locked]);
};
