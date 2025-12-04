// src/components/ScrollTopButton.tsx

import React from 'react';

export function ScrollTopButton() {
  console.log('✅ ScrollTopButton 렌더됨');

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: 'red',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '9999px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: 99999,
      }}
    >
      TOP
    </div>
  );
}
