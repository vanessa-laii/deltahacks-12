'use client';

import { Download, X } from 'lucide-react';

interface SessionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  onDownloadReport: () => void;
}

export default function SessionReportModal({ 
  isOpen, 
  onClose,
  analysis,
  onDownloadReport
}: SessionReportModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm" 
      style={{ backgroundColor: 'rgba(139, 125, 107, 0.6)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="rounded-3xl px-10 sm:px-12 md:px-16 py-8 sm:py-10 md:py-14 w-full mx-4 my-6 sm:my-8 md:my-10 shadow-2xl relative" 
        style={{ backgroundColor: '#FFFFFF', border: '4px solid #D4E4F0', maxWidth: 'calc(100vw - 2rem)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6" style={{ color: '#6B5D5D' }} />
        </button>

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: '#6B5D5D' }}>
            Session Analysis Report
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl" style={{ color: '#8B7D6B' }}>
            Clinical insights for caregivers
          </p>
        </div>

        {/* Analysis Text */}
        <div 
          className="rounded-2xl px-8 sm:px-10 md:px-12 py-10 sm:py-12 md:py-14 mb-10 min-h-[200px] max-h-[55vh] overflow-y-auto"
          style={{ 
            backgroundColor: '#F5E6D3',
            border: '2px solid #D4E4F0'
          }}
        >
          <div 
            className="text-base sm:text-lg md:text-xl leading-relaxed whitespace-pre-wrap"
            style={{ color: '#6B5D5D' }}
          >
            {analysis || 'Loading analysis...'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onDownloadReport}
            className="flex-1 py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl md:text-3xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-3"
            style={{ 
              backgroundColor: '#8FA8C7',
              color: '#FFFFFF'
            }}
          >
            <Download className="w-6 h-6 sm:w-8 sm:h-8" />
            Download Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-4 sm:py-5 md:py-6 rounded-2xl sm:rounded-3xl text-xl sm:text-2xl md:text-3xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#A8C09A',
              color: '#6B5D5D'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
