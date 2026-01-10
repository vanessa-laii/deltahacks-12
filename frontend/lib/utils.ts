/**
 * Posterization utility - reduces the number of color segments in an image
 * @param imageData - ImageData from canvas context
 * @param levels - Number of color levels (lower = simpler, higher = more complex)
 * @returns Modified ImageData
 */
export function posterizeImage(imageData: ImageData, levels: number): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const factor = 255 / levels;
  
  for (let i = 0; i < data.length; i += 4) {
    // Skip alpha channel
    for (let j = 0; j < 3; j++) {
      data[i + j] = Math.floor(data[i + j] / factor) * factor;
    }
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
}

/**
 * Get pixel color at coordinates from ImageData
 */
export function getPixel(imageData: ImageData, x: number, y: number): { r: number; g: number; b: number; a: number } {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
}

/**
 * Set pixel color at coordinates in ImageData
 */
export function setPixel(imageData: ImageData, x: number, y: number, r: number, g: number, b: number, a: number = 255): void {
  const index = (y * imageData.width + x) * 4;
  imageData.data[index] = r;
  imageData.data[index + 1] = g;
  imageData.data[index + 2] = b;
  imageData.data[index + 3] = a;
}
