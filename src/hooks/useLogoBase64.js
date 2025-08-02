// src/hooks/useLogoBase64.js
import { useState, useEffect } from 'react';

export function useLogoBase64(logoUrl = '/logo.png') {
  const [base64, setBase64] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch(logoUrl)
      .then(res => res.blob())
      .then(blob => {
        if (!isMounted) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        if (isMounted) setBase64(null);
      });

    return () => { isMounted = false };
  }, [logoUrl]);

  return base64;
}
