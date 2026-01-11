/**
 * Gallery utility functions for saving and retrieving canvas images
 * Uses Supabase API routes instead of localStorage
 */

export interface SavedImage {
  id: string;
  dataUrl: string;
  timestamp: number;
  storage_url?: string;
}

/**
 * Save a canvas image to the gallery with white background
 * Uploads to Supabase Storage via API route
 */
export async function saveToGallery(canvas: HTMLCanvasElement): Promise<string | null> {
  try {
    // Create a temporary canvas with white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      console.error('Failed to get 2D context for temporary canvas');
      return null;
    }
    
    // Fill with white background first
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Draw the original canvas on top
    tempCtx.drawImage(canvas, 0, 0);
    
    // Convert to data URL with white background
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    // Upload to Supabase via API route
    const response = await fetch('/api/gallery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl: dataUrl,
        userId: null, // TODO: Add authentication
      }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      console.error('Error saving to gallery:', error);
      return null;
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      console.error('Error parsing response:', error);
      return null;
    }
    return result.image?.id || null;
  } catch (error) {
    console.error('Error saving to gallery:', error);
    return null;
  }
}

/**
 * Get all saved images from the gallery via API route
 */
export async function getGallery(): Promise<SavedImage[]> {
  try {
    const response = await fetch('/api/gallery');
    
    if (!response.ok) {
      console.error('Error fetching gallery:', response.statusText);
      return [];
    }

    let result;
    try {
      result = await response.json();
    } catch (error) {
      console.error('Error parsing gallery response:', error);
      return [];
    }
    
    // Transform API response to match SavedImage interface
    interface ApiImage {
      id: string;
      storage_url: string;
      created_at: string;
      storage_path: string;
      user_id: string | null;
    }
    
    return (result.images || []).map((img: ApiImage) => ({
      id: img.id,
      dataUrl: img.storage_url, // Use storage URL as dataUrl for display
      timestamp: new Date(img.created_at).getTime(),
      storage_url: img.storage_url,
    }));
  } catch (error) {
    console.error('Error reading gallery:', error);
    return [];
  }
}

/**
 * Delete an image from the gallery via API route
 */
export async function deleteFromGallery(imageId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/gallery/${imageId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Error deleting image:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting from gallery:', error);
    return false;
  }
}

/**
 * Clear all images from the gallery
 * Note: This requires fetching all images first, then deleting each one
 */
export async function clearGallery(): Promise<boolean> {
  try {
    const images = await getGallery();
    
    // Delete all images one by one
    const deletePromises = images.map(img => deleteFromGallery(img.id));
    await Promise.all(deletePromises);
    
    return true;
  } catch (error) {
    console.error('Error clearing gallery:', error);
    return false;
  }
}
