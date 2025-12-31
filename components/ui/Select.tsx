import React from 'react';

interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={`relative w-full ${className}`}>
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full h-10 bg-black/50 border border-[#ccff00]/20 rounded px-3 pr-8 text-sm text-white focus:outline-none focus:border-[#ccff00]/50 appearance-none cursor-pointer hover:border-[#ccff00]/30 transition-colors"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ccff00]/50 text-[10px]">
        ▼
      </div>
    </div>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => <>{children}</>;
export const SelectValue: React.FC<{ placeholder?: string }> = () => null;
export const SelectContent: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => (
  <option value={value} className={`bg-neutral-900 text-white ${className}`}>
    {children}
  </option>
);