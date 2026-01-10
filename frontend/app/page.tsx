'use client';

import { useState } from 'react';
import { Palette, Eraser, Save } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Canvas from '@/components/Canvas/Canvas';
import ColorPicker from '@/components/ColorPicker';
import { saveToGallery } from '@/app/subpages/gallery';

export default function HomePage() {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState('#D28378');
  const [brushSize, setBrushSize] = useState(20);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Main Content Area - Sidebar + Canvas Layout */}
      <main className="flex-1 flex flex-row p-6 gap-6">
        {/* Left Sidebar - Tools (1/4 width) */}
        <aside className="w-1/4 flex flex-col gap-6">
          {/* Tools Container */}
          <div className="flex flex-col gap-6 p-6 rounded-3xl shadow-sm" style={{ backgroundColor: '#F5E6D3', border: '2px solid #D4E4F0' }}>
            <h2 className="text-2xl font-bold" style={{ color: '#6B5D5D' }}>Tools</h2>
            
            {/* Brush Size Control - Compact */}
            <div className="space-y-3">
              <label className="block text-xl font-semibold" style={{ color: '#6B5D5D' }}>
                Brush: {brushSize}px
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-5"
                style={{
                  accentColor: '#8FA8C7',
                }}
              />
            </div>

            {/* Color Picker Button */}
            <button
              onClick={() => {
                setShowColorPicker(true);
                setIsEraser(false); // Turn off eraser when opening color picker
              }}
              className="w-full h-20 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-95"
              style={{ 
                backgroundColor: '#F4C2A1',
                color: '#6B5D5D'
              }}
            >
              <Palette 
                className="w-8 h-8" 
                stroke={selectedColor}
                fill={selectedColor}
              />
              Colors
            </button>

            {/* Eraser Button */}
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`w-full h-20 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-95 ${
                isEraser ? 'ring-4 ring-[#C17767]' : ''
              }`}
              style={{ 
                backgroundColor: isEraser ? '#D4A5A5' : '#A9AFB4',
                color: isEraser ? '#FFFFFF' : '#6B5D5D',
                border: isEraser ? '3px solid #C17767' : '3px solid #A9AFB4'
              }}
            >
            
              <Eraser className="w-8 h-8" />
              Eraser
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full h-20 rounded-2xl text-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg active:scale-95"
              style={{ 
                backgroundColor: '#8FA8C7',
                color: '#FFFFFF'
              }}
            >
              <Save className="w-8 h-8" />
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
              className="w-full h-20 rounded-2xl text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
              style={{ 
                backgroundColor: '#A8C09A',
                color: '#FFFFFF'
              }}
            >
              Clear
            </button>
          </div>
        </aside>

        {/* Canvas Area (3/4 width) */}
        <div className="w-3/4 flex flex-col">
          <div 
            className="flex-1 rounded-3xl p-5 shadow-lg" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              backgroundColor: '#D4E4F0',
              border: '3px solid #A8C09A',
              minHeight: 'calc(100vh - 48px)'
            }}
          >
            <div 
              className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-inner" 
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

      {/* Logo in bottom left corner */}
      <div 
        className="fixed bottom-0 left-0 p-4 z-10"
        style={{ 
          pointerEvents: 'none' // Allow clicks to pass through
        }}
      >
        <div 
          onClick={() => router.push('/gallery')}
          className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
          style={{ pointerEvents: 'auto' }}
        >
          <Image
            src="/app-logo.png"
            alt="MindFill Logo - Click to view Gallery"
            width={250}
            height={250}
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
}
