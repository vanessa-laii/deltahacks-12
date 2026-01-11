'use client';

import { Check } from 'lucide-react';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

// Cheerful, minimalistic color palette
const PRESET_COLORS = [
  '#F5E6D3', // Creamy beige
  '#8B7D6B', // Taupe
  '#A8C09A', // Sage green
  '#D4E4F0', // Pale blue
  '#8FA8C7', // Slate blue
  '#F4C2A1', // Peach
  '#D4A5A5', // Rose
  '#C17767', // Terracotta
  '#6B5D5D', // Dark taupe (for darker strokes)
  '#E8F4F8', // Very light blue
  '#FFFFFF', // White
  '#000000', // Black (for contrast)
];

export default function ColorPicker({ isOpen, onClose, selectedColor, onColorSelect }: ColorPickerProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
      style={{ backgroundColor: 'rgba(139, 125, 107, 0.6)' }}
    >
      <div 
        className="rounded-3xl p-10 max-w-2xl w-full mx-4 shadow-2xl" 
        style={{ backgroundColor: '#FFFFFF', border: '4px solid #D4E4F0' }}
      >
        <h2 className="text-4xl font-bold mb-8 text-center" style={{ color: '#FFFFFF' }}>
          Choose a Color
        </h2>
        
        <div className="grid grid-cols-4 gap-6 mb-8">
          {PRESET_COLORS.map((color) => {
            const isSelected = selectedColor === color;
            const isLight = color === '#FFFFFF' || color === '#F5E6D3' || color === '#D4E4F0' || color === '#E8F4F8';
            
            return (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  onClose();
                }}
                className="transition-all hover:scale-110 active:scale-95"
                style={{ 
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: isSelected ? '6px solid #C17767' : '4px solid #D4E4F0',
                  boxShadow: isSelected ? '0 8px 16px rgba(193, 119, 103, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}
                aria-label={`Select color ${color}`}
              >
                {isSelected && (
                  <div className="flex items-center justify-center h-full">
                    <Check 
                      className="w-16 h-16 drop-shadow-lg" 
                      style={{ color: isLight ? '#6B5D5D' : '#FFFFFF' }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full h-24 rounded-3xl text-3xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          style={{ 
            backgroundColor: '#F4C2A1',
            color: '#6B5D5D',
            border: '3px solid #D4A5A5'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
