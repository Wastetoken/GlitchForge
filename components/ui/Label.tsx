
import React from 'react';

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => {
  return (
    <label
      className={`text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-neutral-400 uppercase tracking-widest ${className}`}
      {...props}
    />
  );
};
