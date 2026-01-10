'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface CanvasProps {
  color: string;
  brushSize: number;
  isEraser?: boolean;
}

export default function Canvas({ color, brushSize, isEraser = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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

        // Set canvas internal dimensions (must be integers)
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);

        // Restore the drawing
        if (imageData.width > 0 && imageData.height > 0) {
          // Only restore if we had previous content
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imageData.width;
          tempCanvas.height = imageData.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0);
            ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          }
        } else {
          // Fresh canvas - white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      } else if (canvas.width === 0 || canvas.height === 0) {
        // Initial setup - white background
        canvas.width = Math.floor(width) || 800;
        canvas.height = Math.floor(height) || 600;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
  }, []);

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
    setIsDrawing(true);
    
    const { x, y } = getCoordinates(e);
    lastPointRef.current = { x, y };
    draw(x, y, null, null);
  }, [getCoordinates, draw]);

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
