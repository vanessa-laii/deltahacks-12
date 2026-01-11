'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowLeft, BarChart3 } from 'lucide-react';
import { getGallery, deleteFromGallery, type SavedImage } from '@/lib/gallery';

export default function GalleryPage() {
  const router = useRouter();
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const images = await getGallery();
      setSavedImages(images);
    } catch (error) {
      console.error('Error loading gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const success = await deleteFromGallery(imageId);
      if (success) {
        await loadGallery();
      } else {
        alert('Failed to delete image. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete image. Please try again.');
    }
  };


  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="p-6 shadow-sm" style={{ backgroundColor: '#F5E6D3', borderBottom: '3px solid #D4E4F0' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#F4C2A1',
              color: '#6B5D5D'
            }}
          >
            <ArrowLeft className="w-6 h-6" />
            Back
          </button>
          
          <h1 className="text-4xl font-bold" style={{ color: '#6B5D5D' }}>Gallery</h1>
          
          <button
            onClick={() => router.push('/gallery/overview')}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl text-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#8FA8C7',
              color: '#FFFFFF'
            }}
          >
            <BarChart3 className="w-6 h-6" />
            Overview
          </button>
        </div>
      </header>

      {/* Gallery Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <p className="text-3xl font-semibold" style={{ color: '#6B5D5D' }}>
                Loading gallery...
              </p>
            </div>
          ) : savedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <p className="text-3xl font-semibold mb-4" style={{ color: '#6B5D5D' }}>
                No saved drawings yet
              </p>
              <p className="text-2xl" style={{ color: '#8B7D6B' }}>
                Start drawing and save your artwork!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-3xl overflow-hidden shadow-lg transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="aspect-square relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.dataUrl}
                      alt={`Saved drawing ${new Date(image.timestamp).toLocaleDateString()}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <p className="text-lg font-semibold" style={{ color: '#6B5D5D' }}>
                      {new Date(image.timestamp).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="p-3 rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                      style={{ 
                        backgroundColor: '#D4A5A5',
                        color: '#FFFFFF'
                      }}
                      aria-label="Delete image"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
