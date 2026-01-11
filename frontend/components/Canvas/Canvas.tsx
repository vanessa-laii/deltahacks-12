'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { floodFill, hexToRgb } from '@/lib/floodFill';

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser?: boolean;
  baseImage?: string; // Data URL or URL of the outline/base image
  mode?: 'fun' | 'care';
  fillMode?: 'flood' | 'freehand' | null;
}

export default function Canvas({ color, brushSize, isEraser = false, baseImage, mode = 'fun', fillMode = null }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const baseImageLoadedRef = useRef<boolean>(false);

  // Store baseImage URL to reload after resize - use a ref that's updated when baseImage changes
  const baseImageUrlRef = useRef<string | undefined>(baseImage);
  
  // Update baseImage URL ref when it changes
  useEffect(() => {
    if (baseImageUrlRef.current !== baseImage) {
      console.log('baseImage prop changed, updating ref');
      baseImageUrlRef.current = baseImage;
    }
  }, [baseImage]);

  // Function to load and draw base image
  const loadBaseImage = useCallback((targetCtx: CanvasRenderingContext2D, targetWidth: number, targetHeight: number) => {
    const currentBaseImage = baseImageUrlRef.current;
    if (!currentBaseImage) {
      console.log('No baseImage URL to load');
      return;
    }

    console.log('Loading base image:', currentBaseImage.substring(0, 50) + '...');
    
    const img = new Image();
    // For data URLs, we don't need crossOrigin
    if (!currentBaseImage.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    
        img.onload = () => {
      console.log('Base image loaded successfully, dimensions:', img.width, 'x', img.height);
      console.log('Drawing on canvas size:', targetWidth, 'x', targetHeight);
      
      // Clear and set white background first
      targetCtx.fillStyle = '#FFFFFF';
      targetCtx.fillRect(0, 0, targetWidth, targetHeight);
      
      // Draw the base image, scaling to fit canvas while maintaining aspect ratio
      const imgAspect = img.width / img.height;
      const canvasAspect = targetWidth / targetHeight;
      
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgAspect > canvasAspect) {
        drawHeight = targetWidth / imgAspect;
        offsetY = (targetHeight - drawHeight) / 2;
      } else {
        drawWidth = targetHeight * imgAspect;
        offsetX = (targetWidth - drawWidth) / 2;
      }
      
      console.log('Drawing image at:', offsetX, offsetY, 'size:', drawWidth, 'x', drawHeight);
      
      // Ensure we're drawing with correct composite operation
      targetCtx.globalCompositeOperation = 'source-over';
      targetCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      // Verify image was drawn by checking a sample pixel
      const testPixel = targetCtx.getImageData(Math.floor(targetWidth / 2), Math.floor(targetHeight / 2), 1, 1);
      console.log('Sample pixel after drawing (center):', testPixel.data);
      
      baseImageLoadedRef.current = true;
      console.log('Base image drawn successfully');
    };
    
    img.onerror = (error) => {
      console.error('Failed to load base image:', error);
      console.error('Image URL was:', currentBaseImage.substring(0, 100));
      baseImageLoadedRef.current = false;
    };
    
    img.src = currentBaseImage;
  }, []);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match its displayed size
    const resizeCanvas = () => {
      // Use the canvas's own bounding rect to get displayed size
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Only resize if dimensions are valid and different
      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        // Store the current drawing state to restore after resize
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.width > 0 && imageData.height > 0 && 
          imageData.data.some((value, index) => index % 4 !== 3 && value !== 255); // Check if not all white

        // Set canvas internal dimensions (must be integers)
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);

        // Restore the drawing if we had content
        if (hasContent) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imageData.width;
          tempCanvas.height = imageData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            // Draw white background first, then restore content
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            
            // If we have a base image, make sure it's on the bottom layer
            // The restored content should include both base image and drawings
            // But if baseImage exists, we should redraw it to ensure it's visible
            if (baseImageUrlRef.current) {
              // Redraw base image after restoring (it should already be in the imageData, but ensure it's there)
              // Actually, since imageData should contain everything, we don't need to redraw
            }
          }
        } else {
          // Fresh canvas or resize without content - white background, then reload base image
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Reload base image after resize if it exists (with small delay to ensure resize is complete)
          if (baseImageUrlRef.current) {
            setTimeout(() => {
              baseImageLoadedRef.current = false;
              loadBaseImage(ctx, canvas.width, canvas.height);
            }, 50);
          }
        }
      } else if (canvas.width === 0 || canvas.height === 0) {
        // Initial setup - white background
        canvas.width = Math.floor(width) || 800;
        canvas.height = Math.floor(height) || 600;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Load base image after initial white background is set
        if (baseImageUrlRef.current) {
          baseImageLoadedRef.current = false;
          loadBaseImage(ctx, canvas.width, canvas.height);
        }
      }
    };

    // Initial resize with a small delay to ensure container is rendered
    setTimeout(() => {
      resizeCanvas();
    }, 0);

    // Also use ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        resizeCanvas();
        // After resize, reload base image if it exists
        if (baseImageUrlRef.current && canvas.width > 0 && canvas.height > 0) {
          const currentCtx = canvas.getContext('2d');
          if (currentCtx) {
            // Small delay to ensure resize is complete
            setTimeout(() => {
              baseImageLoadedRef.current = false;
              loadBaseImage(currentCtx, canvas.width, canvas.height);
            }, 50);
          }
        }
      });
    });

    // Observe both the canvas and its parent container
    resizeObserver.observe(canvas);
    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, [loadBaseImage]); // Include loadBaseImage in dependencies

  // Effect to reload base image when it changes
  useEffect(() => {
    if (!baseImage) {
      console.log('baseImage is empty, clearing flag');
      baseImageLoadedRef.current = false;
      return;
    }

    console.log('baseImage changed, loading onto canvas...');

    const loadBaseImageOnCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log('Canvas not found, retrying...');
        setTimeout(loadBaseImageOnCanvas, 100);
        return;
      }

      if (canvas.width === 0 || canvas.height === 0) {
        console.log('Canvas not initialized yet (width:', canvas.width, 'height:', canvas.height, '), retrying...');
        setTimeout(loadBaseImageOnCanvas, 100);
        return;
      }

      // Always reload when baseImage changes (reset flag)
      baseImageLoadedRef.current = false;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Cannot get context, retrying...');
        setTimeout(loadBaseImageOnCanvas, 100);
        return;
      }

      console.log('Canvas ready, loading base image. Canvas size:', canvas.width, 'x', canvas.height);
      // Load the base image
      loadBaseImage(ctx, canvas.width, canvas.height);
    };

    // Load base image when it changes
    // Use a delay to ensure canvas is fully initialized and any resize operations are complete
    setTimeout(() => {
      loadBaseImageOnCanvas();
    }, 300);
  }, [baseImage, loadBaseImage]);

  // Get coordinates from event
  const getCoordinates = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Get mouse position relative to canvas element
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    // Calculate scale factor if CSS size differs from internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Convert to canvas coordinates
    const x = relativeX * scaleX;
    const y = relativeY * scaleY;

    // Ensure coordinates are within canvas bounds
    return { 
      x: Math.max(0, Math.min(Math.floor(x), canvas.width)), 
      y: Math.max(0, Math.min(Math.floor(y), canvas.height)) 
    };
  }, []);

  // Draw function
  const draw = useCallback((currentX: number, currentY: number, lastX: number | null, lastY: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isEraser) {
      // Eraser mode: use destination-out composite to erase
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)'; // Fully opaque for erasing
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    } else {
      // Normal drawing mode
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    if (lastX !== null && lastY !== null) {
      // Draw line from last point to current point
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
    } else {
      // Draw a dot at current point
      ctx.arc(currentX, currentY, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset composite operation after drawing
    ctx.globalCompositeOperation = 'source-over';
  }, [color, brushSize, isEraser]);

  // Handle mouse/pointer down
  const handleStart = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { x, y } = getCoordinates(e);
    
    // If in Care mode with Flood Fill, perform flood fill on click
    if (mode === 'care' && fillMode === 'flood' && !isEraser) {
      const fillColor = hexToRgb(color);
      floodFill(ctx, x, y, {
        fillColor,
        tolerance: 30, // Tolerance to handle slightly gray edges
      });
      return;
    }
    
    // Otherwise, use normal drawing
    setIsDrawing(true);
    lastPointRef.current = { x, y };
    draw(x, y, null, null);
  }, [getCoordinates, draw, mode, fillMode, isEraser, color]);

  // Handle mouse/pointer move
  const handleMove = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);
    
    if (lastPointRef.current) {
      draw(x, y, lastPointRef.current.x, lastPointRef.current.y);
      lastPointRef.current = { x, y };
    }
  }, [isDrawing, getCoordinates, draw]);

  // Handle mouse/pointer up
  const handleEnd = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  // Handle mouse leave
  const handleLeave = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleLeave}
      onPointerDown={handleStart}
      onPointerMove={handleMove}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      style={{
        cursor: isEraser ? 'grab' : 'crosshair',
        display: 'block',
        backgroundColor: '#FFFFFF',
        touchAction: 'none',
      }}
    />
  );
}
