'use client';

import { useState, useRef } from 'react';
import { Palette, Eraser, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Canvas from '@/components/Canvas/Canvas';
import ColorPicker from '@/components/ColorPicker';
import { saveToGallery } from '@/app/subpages/gallery';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedColor, setSelectedColor] = useState('#D28378');
  const [brushSize, setBrushSize] = useState(20);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEraser, setIsEraser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      try {
        const imageId = await saveToGallery(canvas);
        if (imageId) {
          alert('Drawing saved to gallery!');
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image');
      }

      alert(`Image uploaded successfully! URL: ${result.url}\n\nNote: This will be processed into a coloring template in a future update.`);
      
      // TODO: In Phase 2, this will load the image onto the canvas
      // For now, we just upload and store it
      
    } catch (error) {
      console.error('Error uploading:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm" style={{ backgroundColor: '#F5E6D3', border: '2px solid #D4E4F0' }}>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#6B5D5D' }}>Tools</h2>
            
            {/* Brush Size Control - Compact */}
            <div className="space-y-2 sm:space-y-3">
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

            {/* Upload Image Button */}
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="w-full h-14 sm:h-16 md:h-20 rounded-xl sm:rounded-2xl text-lg sm:text-xl md:text-2xl font-bold flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: '#A8C09A',
                color: '#6B5D5D'
              }}
            >
              <Upload className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload Image'}</span>
              <span className="sm:hidden">{isUploading ? 'Uploading...' : 'Upload'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload image template"
            />

            {/* Colors and Eraser Row */}
            <div className="flex gap-2 sm:gap-3">
              {/* Color Picker Button */}
              <button
                onClick={() => {
                  setShowColorPicker(true);
                  setIsEraser(false); // Turn off eraser when opening color picker
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
                <span className="sm:hidden">Color</span>
              </button>

              {/* Eraser Button */}
              <button
                onClick={() => setIsEraser(!isEraser)}
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
            className="object-contain drop-shadow-lg w-20 h-20 sm:w-28 sm:h-28 md:w-48 md:h-48 lg:w-[250px] lg:h-[250px]"
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
