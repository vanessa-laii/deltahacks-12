'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Palette, Eraser, Save, Upload, Droplet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Canvas from '@/components/Canvas/Canvas';
import ColorPicker from '@/components/ColorPicker';
import SessionSummaryModal from '@/components/SessionSummaryModal';
import SessionReportModal from '@/components/SessionReportModal';
import { saveToGallery } from '@/lib/gallery';

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
  const [showSessionReport, setShowSessionReport] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionAnalysis, setSessionAnalysis] = useState<string | null>(null);
  
  // Phase 1: Session tracking for analytics
  const [sessionEvents, setSessionEvents] = useState<Array<{
    type: 'fill' | 'draw' | 'erase' | 'move' | 'nudge';
    x?: number;
    y?: number;
    timestamp: number;
  }>>([]);
  const [colorsUsedSet, setColorsUsedSet] = useState<Set<string>>(new Set());
  const nudgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Phase 2: Calculated metrics
  const [sessionMetrics, setSessionMetrics] = useState<{
    neglectRatio: number | null;
    quadrantActivity: {
      topLeft: number;
      topRight: number;
      bottomLeft: number;
      bottomRight: number;
    } | null;
    tremorScore: number | null;
    totalTime: number | null;
    nudgeCount: number;
  } | null>(null);

  // Initialize session when photo is loaded (when baseImage changes) - ONLY IN CARE MODE
  useEffect(() => {
    if (baseImage && mode === 'care') {
      // Start new session when photo is loaded in Care mode
      const startTime = new Date();
      setSessionStartTime(startTime);
      setSessionEvents([]);
      setColorsUsedSet(new Set());
      
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
          // Phase 3: Call Gemini "Encouragement" API for next nudge
          fetch('/api/gemini/encouragement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.message) {
                console.log('Encouragement:', data.message);
                // TODO: Display encouragement message
              }
            })
            .catch(err => console.error('Error calling encouragement API:', err));
        }, 60000);
      }, 60000);
    } else if (mode === 'fun') {
      // Clear session tracking when switching to Fun mode
      setSessionEvents([]);
      setColorsUsedSet(new Set());
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
    
    // Track colors used (for fill and draw events, not erase)
    if (event.type === 'fill' || event.type === 'draw') {
      setColorsUsedSet(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedColor);
        return newSet;
      });
    }
    
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
          // Phase 3: Call Gemini "Encouragement" API for next nudge
          fetch('/api/gemini/encouragement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.message) {
                console.log('Encouragement:', data.message);
                // TODO: Display encouragement message
              }
            })
            .catch(err => console.error('Error calling encouragement API:', err));
        }, 60000);
      }, 60000);
    }
  }, [mode, selectedColor]);

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

  // Phase 2: Calculate session metrics
  const calculateSessionMetrics = useCallback(() => {
    if (!sessionStartTime || sessionEvents.length === 0) {
      return null;
    }

    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return null;

    const endTime = new Date();
    const startTime = sessionStartTime;
    
    // 1. 4-Quadrant Spatial Neglect Analysis
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    const clickEvents = sessionEvents.filter(e => 
      e.type === 'fill' || e.type === 'draw' || e.type === 'erase'
    );
    
    // Count clicks in each quadrant
    let topLeft = 0;
    let topRight = 0;
    let bottomLeft = 0;
    let bottomRight = 0;
    
    clickEvents.forEach(e => {
      if (e.x !== undefined && e.y !== undefined) {
        if (e.x < midX && e.y < midY) {
          topLeft++;
        } else if (e.x >= midX && e.y < midY) {
          topRight++;
        } else if (e.x < midX && e.y >= midY) {
          bottomLeft++;
        } else {
          bottomRight++;
        }
      }
    });
    
    const totalClicks = topLeft + topRight + bottomLeft + bottomRight;
    
    // Calculate percentages for each quadrant
    const quadrantActivity = totalClicks > 0 ? {
      topLeft: (topLeft / totalClicks) * 100,
      topRight: (topRight / totalClicks) * 100,
      bottomLeft: (bottomLeft / totalClicks) * 100,
      bottomRight: (bottomRight / totalClicks) * 100,
    } : {
      topLeft: 25,
      topRight: 25,
      bottomLeft: 25,
      bottomRight: 25,
    };
    
    // Calculate horizontal neglect ratio (for backward compatibility)
    const leftClicks = topLeft + bottomLeft;
    const neglectRatio = totalClicks > 0 ? leftClicks / totalClicks : 0.5;

    // 2. Motor Stability (Jitter) Math
    const moveEvents = sessionEvents.filter(e => e.type === 'move' && e.x !== undefined && e.y !== undefined);
    let tremorScore = 0;
    const TREMOR_THRESHOLD = 3; // pixels - tiny movements
    
    for (let i = 1; i < moveEvents.length; i++) {
      const prev = moveEvents[i - 1];
      const curr = moveEvents[i];
      
      if (prev.x !== undefined && prev.y !== undefined && curr.x !== undefined && curr.y !== undefined) {
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        
        // If distance is tiny (micro-movement), increment tremor score
        if (distance < TREMOR_THRESHOLD && distance > 0) {
          tremorScore += 1;
        }
      }
    }
    
    // Normalize tremor score (divide by number of move events for comparability)
    const normalizedTremorScore = moveEvents.length > 0 ? tremorScore / moveEvents.length : 0;

    // 3. Completion Velocity
    const totalTime = (endTime.getTime() - startTime.getTime()) / 1000; // in seconds

    // Count nudges
    const nudgeCount = sessionEvents.filter(e => e.type === 'nudge').length;

    return {
      neglectRatio,
      quadrantActivity,
      tremorScore: normalizedTremorScore,
      totalTime,
      nudgeCount,
    };
  }, [sessionEvents, sessionStartTime]);

  const handleSessionSummaryNext = async () => {
    // Phase 2: Calculate metrics before saving
    const metrics = calculateSessionMetrics();
    
    if (metrics) {
      setSessionMetrics(metrics);
      console.log('Session Metrics:', metrics);
      
      // Phase 3: Call Gemini API for analysis
      try {
        const response = await fetch('/api/gemini/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalTime: metrics.totalTime,
            neglectRatio: metrics.neglectRatio,
            quadrantActivity: metrics.quadrantActivity,
            tremorScore: metrics.tremorScore,
            nudgeCount: metrics.nudgeCount,
            context: 'a coloring page', // TODO: Could be more specific based on uploaded image
          }),
        });

        const data = await response.json();
        
        if (data.success && data.analysis) {
          setSessionAnalysis(data.analysis);
          // Close session summary and show report modal
          setShowSessionSummary(false);
          setShowSessionReport(true);
          return; // Don't save yet - wait for user to close report modal
        } else {
          console.error('Failed to get analysis:', data.error);
          // Show user-friendly message if rate limited
          if (data.error?.includes('429') || data.error?.includes('quota')) {
            alert('Analysis temporarily unavailable due to API rate limits. Your drawing will still be saved to the gallery.');
          } else {
            alert('Unable to generate analysis at this time. Your drawing will still be saved to the gallery.');
          }
          // Continue with save even if analysis fails
        }
      } catch (error) {
        console.error('Error calling Gemini API:', error);
        // Continue with save even if API call fails
      }
    }
    
    // If no metrics or analysis failed, proceed with save
    await saveImageToGallery();
  };

  const saveImageToGallery = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const imageId = await saveToGallery(canvas);
        if (imageId) {
          // If in Care mode and we have session metrics, save session data
          if (mode === 'care' && sessionMetrics && sessionAnalysis) {
            try {
              await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageId,
                  completionTime: sessionMetrics.totalTime,
                  neglectRatio: sessionMetrics.neglectRatio,
                  quadrantActivity: sessionMetrics.quadrantActivity,
                  tremorIndex: sessionMetrics.tremorScore,
                  aiInsight: sessionAnalysis,
                  userId: null, // TODO: Get from auth session
                }),
              });
              console.log('Session data saved to database');
            } catch (error) {
              console.error('Error saving session data:', error);
              // Don't block navigation if session save fails
            }
          }
          
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

  const handleReportClose = async () => {
    setShowSessionReport(false);
    // Save image after user closes report
    await saveImageToGallery();
  };

  const handleDownloadReport = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas || !sessionAnalysis) return;

    try {
      // Convert canvas to image
      const imageDataUrl = canvas.toDataURL('image/png');
      
      // Create a text blob for the report
      const reportText = `Session Analysis Report\n\n${sessionAnalysis}\n\nGenerated on ${new Date().toLocaleString()}`;
      const textBlob = new Blob([reportText], { type: 'text/plain' });
      
      // Download text file
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `session-report-${Date.now()}.txt`;
      document.body.appendChild(textLink);
      textLink.click();
      document.body.removeChild(textLink);
      URL.revokeObjectURL(textUrl);
      
      // Download image
      const imageLink = document.createElement('a');
      imageLink.href = imageDataUrl;
      imageLink.download = `colored-image-${Date.now()}.png`;
      document.body.appendChild(imageLink);
      imageLink.click();
      document.body.removeChild(imageLink);
      
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
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
        colorsUsed={colorsUsedSet.size}
        imageSize={getCanvasDimensions()}
      />

      {/* Session Report Modal (Phase 3) */}
      <SessionReportModal
        isOpen={showSessionReport}
        onClose={handleReportClose}
        analysis={sessionAnalysis || ''}
        onDownloadReport={handleDownloadReport}
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
            className="object-contain drop-shadow-lg w-20 h-20 sm:w-28 sm:h-28 md:w-48 md:h-48 lg:w-[200px] lg:h-[200px]"
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
