// src/components/ScrollTopButton.tsx

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        })
      }
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#FAED7D',
        borderRadius: '9999px',
        padding: '14px',
        boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 99999,
        border: '2px solid #e2d76b',
        transition: 'all 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget.style.backgroundColor = '#f2e36e');
      }}
      onMouseLeave={(e) => {
        (e.currentTarget.style.backgroundColor = '#FAED7D');
      }}
    >
      <ArrowUp size={22} color="#2c2c2c" />
    </button>
  );
}
