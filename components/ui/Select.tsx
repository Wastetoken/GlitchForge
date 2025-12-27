
import React from 'react';

export const Select: React.FC<{ value: string; onValueChange: (v: string) => void; children: React.ReactNode }> = ({ value, onValueChange, children }) => {
  return (
    <div className="relative w-full">
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full h-10 bg-black/50 border border-[#ccff00]/20 rounded px-3 text-sm text-white focus:outline-none focus:border-[#ccff00]/50 appearance-none cursor-pointer"
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ccff00]/50">
        ▼
      </div>
    </div>
  );
};

export const SelectTrigger: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => <>{children}</>;
export const SelectValue: React.FC = () => null;
export const SelectContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children }) => <>{children}</>;
export const SelectItem: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({ value, children }) => (
  <option value={value} className="bg-neutral-900 text-white">
    {children}
  </option>
);
