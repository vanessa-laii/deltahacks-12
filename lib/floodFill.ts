/**
 * Flood fill implementation for canvas with tolerance support
 * This fills an area starting from a point, filling all connected pixels
 * that are similar in color (within tolerance) until it hits a boundary.
 */

export interface FloodFillOptions {
  tolerance?: number; // Color tolerance (0-255), default 30
  targetColor?: [number, number, number]; // RGB color to replace (if not provided, uses pixel at start point)
  fillColor: [number, number, number]; // RGB color to fill with
}

/**
 * Perform flood fill on canvas context
 * @param ctx Canvas 2D context
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate
 * @param options Flood fill options
 */
export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  options: FloodFillOptions
): void {
  const { tolerance = 30, fillColor } = options;
  
  // Get image data
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Clamp coordinates
  const x = Math.floor(Math.max(0, Math.min(startX, width - 1)));
  const y = Math.floor(Math.max(0, Math.min(startY, height - 1)));
  
  // Get target color (color at start point if not provided)
  const targetColor = options.targetColor || [
    data[(y * width + x) * 4],     // R
    data[(y * width + x) * 4 + 1], // G
    data[(y * width + x) * 4 + 2]  // B
  ];
  
  // Convert fill color to RGBA
  const fillR = fillColor[0];
  const fillG = fillColor[1];
  const fillB = fillColor[2];
  
  // Helper to get pixel index
  const getIndex = (x: number, y: number) => (y * width + x) * 4;
  
  // Helper to check if color matches (with tolerance)
  const colorMatch = (r: number, g: number, b: number): boolean => {
    const dr = Math.abs(r - targetColor[0]);
    const dg = Math.abs(g - targetColor[1]);
    const db = Math.abs(b - targetColor[2]);
    return dr <= tolerance && dg <= tolerance && db <= tolerance;
  };
  
  // Stack-based flood fill (iterative to avoid stack overflow)
  const stack: Array<[number, number]> = [[x, y]];
  const visited = new Set<string>();
  
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    
    // Skip if out of bounds
    if (cx < 0 || cx >= width || cy < 0 || cy >= height) {
      continue;
    }
    
    // Skip if already visited
    const key = `${cx},${cy}`;
    if (visited.has(key)) {
      continue;
    }
    
    const index = getIndex(cx, cy);
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    
    // Skip if color doesn't match
    if (!colorMatch(r, g, b)) {
      continue;
    }
    
    // Mark as visited
    visited.add(key);
    
    // Fill pixel
    data[index] = fillR;
    data[index + 1] = fillG;
    data[index + 2] = fillB;
    // Keep alpha channel as is
    
    // Add neighbors to stack (4-connected)
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
  
  // Put modified image data back
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert hex color to RGB array
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0]; // Default to black
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
