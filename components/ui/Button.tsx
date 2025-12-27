
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none font-bold tracking-wider uppercase text-xs";
  
  const variants = {
    primary: "bg-[#ccff00] text-black hover:bg-[#b8e600]",
    outline: "border border-[#ccff00]/30 text-[#ccff00] hover:bg-[#ccff00]/10",
    ghost: "hover:bg-[#ccff00]/10 text-white"
  };
  
  const sizes = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-6",
    icon: "h-8 w-8 p-0"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size === 'icon' ? 'icon' : size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
