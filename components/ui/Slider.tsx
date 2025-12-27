
import React from 'react';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ 
  value, 
  onValueChange, 
  min = 0, 
  max = 100, 
  step = 1, 
  className = '' 
}) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      className={`w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#ccff00] ${className}`}
    />
  );
};
