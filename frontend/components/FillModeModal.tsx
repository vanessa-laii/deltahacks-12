'use client';

interface FillModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'flood' | 'freehand') => void;
}

export default function FillModeModal({ isOpen, onClose, onSelectMode }: FillModeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
      style={{ backgroundColor: 'rgba(139, 125, 107, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className="rounded-3xl p-8 sm:p-10 md:p-12 max-w-md w-full mx-4 shadow-2xl" 
        style={{ backgroundColor: '#FFFFFF', border: '4px solid #D4E4F0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center" style={{ color: '#6B5D5D' }}>
          Select Fill Mode
        </h2>
        
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Flood Fill Button */}
          <button
            onClick={() => {
              onSelectMode('flood');
              onClose();
            }}
            className="w-full py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl text-lg sm:text-xl md:text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#8FA8C7',
              color: '#FFFFFF'
            }}
          >
            Flood Fill
          </button>

          {/* Freehand Button */}
          <button
            onClick={() => {
              onSelectMode('freehand');
              onClose();
            }}
            className="w-full py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl text-lg sm:text-xl md:text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#A8C09A',
              color: '#FFFFFF'
            }}
          >
            Freehand
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg md:text-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          style={{ 
            backgroundColor: '#F5E6D3',
            color: '#6B5D5D',
            border: '2px solid #D4E4F0'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
