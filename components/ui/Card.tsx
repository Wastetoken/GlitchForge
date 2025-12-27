
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl ${className}`}>
      {children}
    </div>
  );
};
