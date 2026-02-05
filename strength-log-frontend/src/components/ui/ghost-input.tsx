"use client";
import React from "react";
import { Input } from "@/components/ui/input";

interface GhostInputProps {
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  isDone?: boolean;
  readOnly?: boolean;
  onAutoComplete?: () => void;
}

export const GhostInput: React.FC<GhostInputProps> = ({ 
  value, onChange, placeholder, className, isDone, readOnly, onAutoComplete 
}) => {
  const handleBlur = () => {
    if (value && Number(value) > 0 && !isDone && onAutoComplete) {
      onAutoComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`relative h-14 w-20 flex items-center justify-center rounded-2xl overflow-hidden transition-colors duration-200 ${isDone ? 'bg-green-500/20 text-green-500' : 'bg-muted dark:bg-white/10 text-foreground'}`}>
        <Input 
            type="number" 
            value={value === 0 ? "" : value?.toString()} 
            placeholder={placeholder} 
            onFocus={(e) => !readOnly && e.target.select()} 
            onChange={onChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            className={`w-full h-full !bg-transparent !border-none !shadow-none !rounded-none !ring-0 text-center text-2xl font-bold p-0 placeholder:text-muted-foreground/30 ${className} ${isDone ? 'text-green-500' : 'text-foreground'} ${readOnly ? 'pointer-events-none' : ''}`} 
        />
    </div>
  );
};