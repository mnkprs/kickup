"use client";

import { Check } from "lucide-react";

interface ColorSwatchPickerProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwatchPicker({ colors, value, onChange }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 pressable"
          style={{ backgroundColor: c }}
        >
          {value === c && <Check size={16} className="text-white" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}
