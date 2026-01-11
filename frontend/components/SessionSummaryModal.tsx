'use client';

import { CheckCircle2, Clock, Palette, Image as ImageIcon } from 'lucide-react';

interface SessionSummaryModalProps {
  isOpen: boolean;
  onNext: () => void;
  sessionDuration?: string; // e.g., "15:30"
  colorsUsed?: number;
  imageSize?: string; // e.g., "800x600"
}

export default function SessionSummaryModal({ 
  isOpen, 
  onNext,
  sessionDuration = '--:--',
  colorsUsed = 0,
  imageSize = '--x--'
}: SessionSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
      style={{ backgroundColor: 'rgba(139, 125, 107, 0.6)' }}
      onClick={(e) => {
        // Don't close on backdrop click - require Next button
        e.stopPropagation();
      }}
    >
      <div 
        className="rounded-3xl p-8 sm:p-10 md:p-12 max-w-2xl w-full mx-4 shadow-2xl" 
        style={{ backgroundColor: '#FFFFFF', border: '4px solid #D4E4F0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="p-4 rounded-full"
              style={{ backgroundColor: '#A8C09A' }}
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#6B5D5D' }}>
            Session Complete!
          </h2>
          <p className="text-xl sm:text-2xl" style={{ color: '#8B7D6B' }}>
            Review your session summary
          </p>
        </div>

        {/* Session Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Session Duration Card */}
          <div 
            className="rounded-2xl p-4 sm:p-6 text-center"
            style={{ 
              backgroundColor: '#F5E6D3',
              border: '2px solid #D4E4F0'
            }}
          >
            <div className="flex justify-center mb-3">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#8FA8C7' }} />
            </div>
            <p className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#6B5D5D' }}>
              Duration
            </p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#8FA8C7' }}>
              {sessionDuration}
            </p>
          </div>

          {/* Colors Used Card */}
          <div 
            className="rounded-2xl p-4 sm:p-6 text-center"
            style={{ 
              backgroundColor: '#F5E6D3',
              border: '2px solid #D4E4F0'
            }}
          >
            <div className="flex justify-center mb-3">
              <Palette className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#A8C09A' }} />
            </div>
            <p className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#6B5D5D' }}>
              Colors Used
            </p>
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: '#A8C09A' }}>
              {colorsUsed}
            </p>
          </div>

          {/* Image Size Card */}
          <div 
            className="rounded-2xl p-4 sm:p-6 text-center"
            style={{ 
              backgroundColor: '#F5E6D3',
              border: '2px solid #D4E4F0'
            }}
          >
            <div className="flex justify-center mb-3">
              <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: '#F4C2A1' }} />
            </div>
            <p className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#6B5D5D' }}>
              Image Size
            </p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: '#C17767' }}>
              {imageSize}
            </p>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          className="w-full py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl md:text-3xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          style={{ 
            backgroundColor: '#8FA8C7',
            color: '#FFFFFF'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
