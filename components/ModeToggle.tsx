'use client';

type DrawingMode = 'leisure' | 'patient';

interface ModeToggleProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
}

export default function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => onModeChange('patient')}
        className={`
          flex-1 h-24 rounded-2xl text-3xl font-bold transition-all
          ${mode === 'patient'
            ? 'bg-blue-600 text-white shadow-lg scale-105'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }
        `}
        aria-label="Patient Mode - Tap to fill"
      >
        Patient Mode
      </button>
      <button
        onClick={() => onModeChange('leisure')}
        className={`
          flex-1 h-24 rounded-2xl text-3xl font-bold transition-all
          ${mode === 'leisure'
            ? 'bg-blue-600 text-white shadow-lg scale-105'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }
        `}
        aria-label="Leisure Mode - Free drawing"
      >
        Leisure Mode
      </button>
    </div>
  );
}
