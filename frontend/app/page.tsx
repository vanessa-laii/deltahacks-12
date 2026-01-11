'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Eraser, Save, Upload, Droplet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Canvas from '@/components/Canvas/Canvas';
import ColorPicker from '@/components/ColorPicker';
import SessionSummaryModal from '@/components/SessionSummaryModal';
import { saveToGallery } from '@/app/subpages/gallery';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = useState('#D28378');
  const [brushSize, setBrushSize] = useState(20);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isFloodFill, setIsFloodFill] = useState(false); // Flood fill toggle for Fun mode
  const [isUploading, setIsUploading] = useState(false);
  const [baseImage, setBaseImage] = useState<string | undefined>(undefined); // Outline/base image data URL
  const [mode, setMode] = useState<'fun' | 'care'>('fun'); // Mode: 'fun' for basic coloring, 'care' for dementia patients
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Phase 1: Session tracking for analytics
  const [sessionEvents, setSessionEvents] = useState<Array<{
    type: 'fill' | 'draw' | 'erase' | 'move' | 'nudge';
    x?: number;
    y?: number;
    timestamp: number;
  }>>([]);
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session when photo is loaded (when baseImage changes) - ONLY IN CARE MODE
  useEffect(() => {
    if (baseImage && mode === 'care') {
      // Start new session when photo is loaded in Care mode
      const startTime = new Date();
      setSessionStartTime(startTime);
      setSessionEvents([]);
      
      // Clear any existing nudge timer
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
      
      // Start 60-second nudge timer
      nudgeTimerRef.current = setTimeout(() => {
        // Nudge timer fired - log nudge event
        const nudgeEvent = {
          type: 'nudge' as const,
          timestamp: Date.now(),
        };
        setSessionEvents(prev => [...prev, nudgeEvent]);
        
        // TODO: Call Gemini "Encouragement" API here (Phase 3)
        console.log('Nudge timer fired - should call Gemini API');
        
        // Reset timer for next nudge
        nudgeTimerRef.current = setTimeout(() => {
          const nextNudgeEvent = {
            type: 'nudge' as const,
            timestamp: Date.now(),
          };
          setSessionEvents(prev => [...prev, nextNudgeEvent]);
          console.log('Next nudge timer fired - should call Gemini API');
        }, 60000);
      }, 60000);
    } else if (mode === 'fun') {
      // Clear session tracking when switching to Fun mode
      setSessionEvents([]);
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    }
    
    // Cleanup timer on unmount or when baseImage/mode changes
    return () => {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
  }, [baseImage, mode]);

  // Handle canvas events from Canvas component - ONLY IN CARE MODE
  const handleCanvasEvent = useCallback((event: {
    type: 'fill' | 'draw' | 'erase' | 'move';
    x: number;
    y: number;
    timestamp: number;
  }) => {
    // Only track events in Care mode
    if (mode !== 'care') return;
    
    // Add event to session events array
    setSessionEvents(prev => [...prev, event]);
    
    // Reset nudge timer on click events (fill, draw, erase)
    if (event.type === 'fill' || event.type === 'draw' || event.type === 'erase') {
      if (nudgeTimerRef.current) {
        clearTimeout(nudgeTimerRef.current);
      }
      
      // Start new 60-second timer
      nudgeTimerRef.current = setTimeout(() => {
        const nudgeEvent = {
          type: 'nudge' as const,
          timestamp: Date.now(),
        };
        setSessionEvents(prev => [...prev, nudgeEvent]);
        
        // TODO: Call Gemini "Encouragement" API here (Phase 3)
        console.log('Nudge timer fired - should call Gemini API');
        
        // Reset timer for next nudge
        nudgeTimerRef.current = setTimeout(() => {
          const nextNudgeEvent = {
            type: 'nudge' as const,
            timestamp: Date.now(),
          };
          setSessionEvents(prev => [...prev, nextNudgeEvent]);
          console.log('Next nudge timer fired - should call Gemini API');
        }, 60000);
      }, 60000);
    }
  }, [mode]);

  // Calculate session duration
  const getSessionDuration = (): string => {
    if (!sessionStartTime) return '00:00';
    const now = new Date();
    const diffMs = now.getTime() - sessionStartTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins.toString().padStart(2, '0')}:${diffSecs.toString().padStart(2, '0')}`;
  };

  // Get canvas dimensions
  const getCanvasDimensions = (): string => {
    if (typeof document === 'undefined') return '--x--'; // SSR guard
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      return `${canvas.width}x${canvas.height}`;
    }
    return '--x--';
  };

  const handleSave = async () => {
    // Show session summary modal only in Care mode
    if (mode === 'care') {
      setShowSessionSummary(true);
    } else {
      // In Fun mode, save directly to gallery
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        try {
          const imageId = await saveToGallery(canvas);
          if (imageId) {
            router.push('/gallery');
          } else {
            alert('Failed to save drawing. Please try again.');
          }
        } catch (error) {
          console.error('Error saving:', error);
          alert('Failed to save drawing. Please try again.');
        }
      }
    }
  };

  const handleSessionSummaryNext = async () => {
    // Close the modal and save the image
    setShowSessionSummary(false);
    
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const imageId = await saveToGallery(canvas);
        if (imageId) {
          // Reset session start time for next session
          setSessionStartTime(new Date());
          router.push('/gallery');
        } else {
          alert('Failed to save drawing. Please try again.');
        }
      } catch (error) {
        console.error('Error saving:', error);
        alert('Failed to save drawing. Please try again.');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type client-side
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file format. Please upload PNG, JPG, or JPEG files only.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-template', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to upload image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // Step 2: Process the uploaded image into an outline
      const processResponse = await fetch('/api/process-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: result.url,
        }),
      });

      if (!processResponse.ok) {
        const processError = await processResponse.json();
        throw new Error(processError.error || 'Failed to process image into outline');
      }

      const processResult = await processResponse.json();
      
      // Step 3: Load the processed outline onto the canvas
      if (processResult.dataUrl) {
        console.log('Setting baseImage, dataUrl length:', processResult.dataUrl.length);
        console.log('DataUrl preview:', processResult.dataUrl.substring(0, 100));
        setBaseImage(processResult.dataUrl);
        // Small delay to ensure state is updated before alert
        setTimeout(() => {
          alert('Image uploaded and processed! The outline is now on your canvas. Start coloring!');
        }, 100);
      } else {
        console.error('No dataUrl in processResult:', processResult);
        throw new Error('Failed to get processed outline');
      }
      
    } catch (error) {
      console.error('Error uploading/processing:', error);
      alert(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Main Content Area - Sidebar + Canvas Layout */}
      <main className="flex-1 flex flex-col md:flex-row p-3 sm:p-4 md:p-6 gap-3 sm:gap-4 md:gap-6">
        {/* Left Sidebar - Tools (responsive width) */}
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-3 sm:gap-4 md:gap-6">
          {/* Tools Container */}
          <div className="flex flex-col gap-3 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-4 rounded-2xl md:rounded-3xl shadow-sm" style={{ backgroundColor: '#F5E6D3', border: '2px solid #D4E4F0' }}>
            <h2 className="text-xl sm:text-3xl font-bold" style={{ color: '#6B5D5D' }}>Tools</h2>
            
            {/* Brush Size Control - Compact */}
            <div className="space-y-1 sm:space-y-1">
              <label className="block text-lg sm:text-xl font-semibold" style={{ color: '#6B5D5D' }}>
                Brush: {brushSize}px
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-4 sm:h-5"
                style={{
                  accentColor: '#8FA8C7',
                }}
              />
            </div>

            {/* Upload and Fill Row */}
            <div className="flex gap-2 sm:gap-3">
              {/* Upload Image Button */}
              <button
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: '#A8C09A',
                  color: '#6B5D5D'
                }}
              >
                <Upload className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload image template"
              />

              {/* Flood Fill Button */}
              <button
                onClick={() => {
                  setIsFloodFill(!isFloodFill);
                  setIsEraser(false); // Turn off eraser when using flood fill
                }}
                className={`flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 ${
                  isFloodFill ? 'ring-2 sm:ring-4 ring-[#8FA8C7]' : ''
                }`}
                style={{ 
                  backgroundColor: isFloodFill ? '#8FA8C7' : '#D4E4F0',
                  color: isFloodFill ? '#FFFFFF' : '#6B5D5D',
                  border: isFloodFill ? '2px solid #8FA8C7' : '2px solid #D4E4F0'
                }}
              >
                <Droplet className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                <span className="hidden sm:inline">Fill</span>
                <span className="sm:hidden">Fill</span>
              </button>
            </div>

            {/* Colors and Eraser Row */}
            <div className="flex gap-2 sm:gap-3">
              {/* Color Picker Button */}
              <button
                onClick={() => {
                  setShowColorPicker(true);
                  setIsEraser(false); // Turn off eraser when opening color picker
                  setIsFloodFill(false); // Turn off flood fill when opening color picker
                }}
                className="flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95"
                style={{ 
                  backgroundColor: '#F4C2A1',
                  color: '#6B5D5D'
                }}
              >
                <Palette 
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" 
                  stroke={selectedColor}
                  fill={selectedColor}
                />
                <span className="hidden sm:inline">Colors</span>
                <span className="sm:hidden">Colour</span>
              </button>

              {/* Eraser Button */}
              <button
                onClick={() => {
                  setIsEraser(!isEraser);
                  setIsFloodFill(false); // Turn off flood fill when using eraser
                }}
                className={`flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 ${
                  isEraser ? 'ring-2 sm:ring-4 ring-[#C17767]' : ''
                }`}
                style={{ 
                  backgroundColor: isEraser ? '#D4A5A5' : '#A9AFB4',
                  color: isEraser ? '#FFFFFF' : '#6B5D5D',
                  border: isEraser ? '2px solid #C17767' : '2px solid #A9AFB4'
                }}
              >
                <Eraser className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                Eraser
              </button>
            </div>

            {/* Save and Clear Row */}
            <div className="flex gap-2 sm:gap-3">
              {/* Save Button */}
              <button
                onClick={handleSave}
                className="flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95"
                style={{ 
                  backgroundColor: '#8FA8C7',
                  color: '#6B5D5D'
                }}
              >
                <Save className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                Save
              </button>

              {/* Clear Button */}
              <button
                onClick={() => {
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.fillStyle = '#FFFFFF';
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                }}
                className="flex-1 h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                style={{ 
                  backgroundColor: '#A8C09A',
                  color: '#6B5D5D'
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Mode Selector Container */}
          <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm" style={{ backgroundColor: '#F5E6D3', border: '2px solid #D4E4F0' }}>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#6B5D5D' }}>Mode</h2>
            
            <div className="flex gap-2 sm:gap-3">
              {/* Fun Mode Button */}
              <button
                onClick={() => setMode('fun')}
                className={`flex-1 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 ${
                  mode === 'fun' ? 'ring-2 ring-[#8FA8C7]' : ''
                }`}
                style={{
                  backgroundColor: mode === 'fun' ? '#8FA8C7' : '#FFFFFF',
                  color: mode === 'fun' ? '#FFFFFF' : '#6B5D5D',
                }}
              >
                Fun
              </button>
              {/* Care Mode Button */}
              <button
                onClick={() => setMode('care')}
                className={`flex-1 py-2 sm:py-3 md:py-4 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 ${
                  mode === 'care' ? 'ring-2 ring-[#8FA8C7]' : ''
                }`}
                style={{
                  backgroundColor: mode === 'care' ? '#A8C09A' : '#FFFFFF',
                  color: mode === 'care' ? '#FFFFFF' : '#6B5D5D',
                }}
              >
                Care
              </button>
            </div>
          </div>
        </aside>

        {/* Canvas Area (responsive width) */}
        <div className="w-full md:w-2/3 lg:w-3/4 flex flex-col">
          <div 
            className="flex-1 rounded-2xl md:rounded-3xl p-3 sm:p-4 md:p-5 shadow-lg" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#D4E4F0',
              border: '2px solid #A8C09A',
              minHeight: 'calc(100vh - 120px)',
              maxHeight: 'calc(100vh - 120px)'
            }}
          >
            <div 
              className="w-full h-full bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-inner" 
              style={{ 
                position: 'relative',
                border: '2px solid #D4E4F0',
                minHeight: '100%'
              }}
            >
              <Canvas
                color={selectedColor}
                brushSize={brushSize}
                isEraser={isEraser}
                baseImage={baseImage}
                mode={mode}
                isFloodFill={isFloodFill}
                onEvent={mode === 'care' ? handleCanvasEvent : undefined}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Color Picker Modal */}
      <ColorPicker
        isOpen={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={selectedColor}
        onColorSelect={setSelectedColor}
      />

      {/* Session Summary Modal */}
      <SessionSummaryModal
        isOpen={showSessionSummary}
        onNext={handleSessionSummaryNext}
        sessionDuration={getSessionDuration()}
        colorsUsed={1} // TODO: Track actual colors used
        imageSize={getCanvasDimensions()}
      />


      {/* Logo in bottom left corner - responsive size */}
      <div 
        className="fixed bottom-0 left-0 p-2 sm:p-3 md:p-4 z-10"
        style={{ 
          pointerEvents: 'none' // Allow clicks to pass through
        }}
      >
        <div 
          onClick={() => router.push('/gallery')}
          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
          style={{ pointerEvents: 'auto' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/app-logo.png"
            alt="MindFill Logo - Click to view Gallery"
            className="object-contain drop-shadow-lg w-20 h-20 sm:w-28 sm:h-28 md:w-48 md:h-48 lg:w-[225px] lg:h-[225px]"
            onError={(e) => {
              console.error('Failed to load logo image:', e);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
