import { NextRequest, NextResponse } from 'next/server';
import { Image } from 'image-js';
import sharp from 'sharp';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/process-template - Convert an image to a coloring book outline
 * Takes an image URL and processes it to create an outline suitable for coloring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from URL' },
        { status: 400 }
      );
    }

    // Convert response to buffer
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use sharp to decode and get raw image data first
    // Then convert to image-js format
    const sharpImage = sharp(buffer);
    const metadata = await sharpImage.metadata();
    
    console.log('Sharp metadata:', {
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha
    });
    
    // Get raw pixel data from sharp (RGB format)
    // Remove alpha channel by converting to RGB
    const { data: rawData, info } = await sharpImage
      .removeAlpha() // Remove alpha channel if present
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    console.log('Raw data info:', {
      width: info.width,
      height: info.height,
      channels: info.channels,
      size: rawData.length
    });
    
    // Check sample pixels from raw data to verify it's not all white
    if (rawData.length >= 9) {
      const sampleR = rawData[0];
      const sampleG = rawData[1];
      const sampleB = rawData[2];
      const midR = rawData[Math.floor(rawData.length / 3)];
      const midG = rawData[Math.floor(rawData.length / 3) + 1];
      const midB = rawData[Math.floor(rawData.length / 3) + 2];
      console.log('Sample pixels from raw data - First pixel RGB:', [sampleR, sampleG, sampleB]);
      console.log('Sample pixels from raw data - Mid pixel RGB:', [midR, midG, midB]);
    }
    
    // Create image-js Image from raw data
    // Use Image constructor with manual pixel setting (most reliable method)
    let image: Image;
    
    try {
      const width = metadata.width!;
      const height = metadata.height!;
      
      console.log('Creating Image, dimensions:', width, 'x', height);
      console.log('Raw data length:', rawData.length, 'Expected:', width * height * 3);
      
      // Create an empty RGB image
      image = new Image(width, height, {
        colorModel: 'RGB',
      });
      
      console.log('Empty Image created, dimensions:', image.width, 'x', image.height, 'colorModel:', image.colorModel);
      
      // Manually set pixels from raw data
      // rawData is in format: R,G,B,R,G,B... for each pixel (row by row)
      let dataIndex = 0;
      let pixelsSet = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (dataIndex + 2 < rawData.length) {
            const r = rawData[dataIndex++];
            const g = rawData[dataIndex++];
            const b = rawData[dataIndex++];
            image.setPixel(x, y, [r, g, b]);
            pixelsSet++;
          } else {
            console.warn(`Ran out of data at pixel (${x}, ${y}), dataIndex: ${dataIndex}`);
            break;
          }
        }
        if (dataIndex >= rawData.length) break;
      }
      
      console.log(`Pixels set: ${pixelsSet} out of ${width * height}`);
      
      // Verify image has data by checking sample pixels
      try {
        const topLeftPixel = image.getPixel(0, 0);
        const centerPixel = image.getPixel(Math.floor(width / 2), Math.floor(height / 2));
        const bottomRightPixel = image.getPixel(width - 1, height - 1);
        console.log('Sample pixels after setting - Top-left:', topLeftPixel, 'Center:', centerPixel, 'Bottom-right:', bottomRightPixel);
        
        // Verify pixels are not all white/black
        const isAllWhite = Array.isArray(topLeftPixel) && topLeftPixel[0] === 255 && topLeftPixel[1] === 255 && topLeftPixel[2] === 255;
        const isAllBlack = Array.isArray(topLeftPixel) && topLeftPixel[0] === 0 && topLeftPixel[1] === 0 && topLeftPixel[2] === 0;
        console.log('Image appears all white:', isAllWhite, 'all black:', isAllBlack);
      } catch (pixelError) {
        console.warn('Could not read sample pixels:', pixelError);
      }
    } catch (error) {
      console.error('Failed to create Image:', error);
      throw new Error(`Failed to create Image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Save input image to storage for comparison
    let inputStorageUrl: string | null = null;
    try {
      const supabase = createServerClient();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substr(2, 9);
      const inputFileName = `processed-templates/input_${timestamp}_${randomString}.png`;
      
      // Convert original buffer to PNG if needed
      const inputPngBuffer = await sharp(buffer).png().toBuffer();
      
      const { error: inputUploadError } = await supabase.storage
        .from('gallery-images')
        .upload(inputFileName, inputPngBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (!inputUploadError) {
        const { data: inputUrlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(inputFileName);
        inputStorageUrl = inputUrlData.publicUrl;
        console.log('Input image saved to storage:', inputStorageUrl);
      }
    } catch (inputStorageError) {
      console.error('Error saving input image:', inputStorageError);
    }

    // Step 1: Resize if too large (max 2000px on longest side for performance)
    const maxDimension = 2000;
    if (image.width > maxDimension || image.height > maxDimension) {
      const scale = Math.min(maxDimension / image.width, maxDimension / image.height);
      image = image.resize({ width: Math.round(image.width * scale), height: Math.round(image.height * scale) });
    }

    // Step 2: Convert to grayscale and apply Canny edge detector
    // This creates white edges on black background
    console.log('Converting to grayscale and applying Canny edge detector...');
    const greyImage = image.grey();
    console.log('After grayscale, sample pixel:', greyImage.getPixel(Math.floor(greyImage.width / 2), Math.floor(greyImage.height / 2)));
    
    // Apply Canny edge detector with thresholds (lower = more detail)
    const edges = greyImage.cannyEdgeDetector({
      lowThreshold: 20,
      highThreshold: 40,
    });
    console.log('After Canny edge detection, sample pixel:', edges.getPixel(Math.floor(edges.width / 2), Math.floor(edges.height / 2)));
    console.log('Edge detection colorModel:', edges.colorModel);
    
    // Check sample pixels before inversion (should be white edges on black background)
    let edgePixelCount = 0;
    let whitePixelCount = 0;
    for (let y = 0; y < Math.min(edges.height, 20); y++) {
      for (let x = 0; x < Math.min(edges.width, 20); x++) {
        const pixel = edges.getPixel(x, y);
        const value = Array.isArray(pixel) ? pixel[0] : pixel;
        if (value > 0) edgePixelCount++;
        if (value > 200) whitePixelCount++;
      }
    }
    console.log(`Before inversion - Edge detection sample: ${edgePixelCount} non-black pixels, ${whitePixelCount} white pixels out of 400 checked`);

    // Step 3: Invert the edges to get black edges on white background
    // cannyEdgeDetector() returns a Mask, which already has invert() method
    // This creates the coloring book look (black lines on white background)
    console.log('Inverting edges...');
    const coloringPage = edges.invert();
    console.log('After mask().invert(), sample pixel:', coloringPage.getPixel(Math.floor(coloringPage.width / 2), Math.floor(coloringPage.height / 2)));
    
    // Check sample pixels after mask().invert() (should be black edges on white background)
    let blackPixelCount = 0;
    let whiteBgCount = 0;
    for (let y = 0; y < Math.min(coloringPage.height, 20); y++) {
      for (let x = 0; x < Math.min(coloringPage.width, 20); x++) {
        const pixel = coloringPage.getPixel(x, y);
        const value = Array.isArray(pixel) ? pixel[0] : pixel;
        if (value < 50) blackPixelCount++; // Very dark = black edges
        if (value > 200) whiteBgCount++; // Very light = white background
      }
    }
    console.log(`After mask().invert() - Black edges: ${blackPixelCount}, White background: ${whiteBgCount} out of 400 checked`);

    // Step 4: Convert to RGB for encoding
    const finalImage = coloringPage.convertColor('RGB');
    console.log('After RGB conversion, sample pixel:', finalImage.getPixel(Math.floor(finalImage.width / 2), Math.floor(finalImage.height / 2)));

    // Convert image-js Image to buffer using sharp for encoding
    // Use getRawImage() to get raw image data in a public way
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawImage = (finalImage as any).getRawImage();
    
    // Get the raw data array from the raw image
    // The raw image might have a data property or we can reconstruct it
    let imageData: Uint8Array;
    if (rawImage && rawImage.data) {
      imageData = rawImage.data;
    } else {
      // Fallback: manually construct buffer from pixels
      // Iterate through all pixels and build buffer
      const width = finalImage.width;
      const height = finalImage.height;
      const channels = 3; // RGB
      const bufferSize = width * height * channels;
      imageData = new Uint8Array(bufferSize);
      
      let index = 0;
      let extractedBlackCount = 0;
      let extractedWhiteCount = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = finalImage.getPixel(x, y);
          // pixel might be an array [R, G, B] or a number
          if (Array.isArray(pixel)) {
            const r = pixel[0];
            const g = pixel[1];
            const b = pixel[2];
            imageData[index++] = r;
            imageData[index++] = g;
            imageData[index++] = b;
            
            // Track black vs white pixels during extraction
            const avg = (r + g + b) / 3;
            if (avg < 50) extractedBlackCount++; // Very dark = black lines
            if (avg > 200) extractedWhiteCount++; // Very light = white background
          } else {
            // If it's a single value (grayscale), replicate it for RGB
            imageData[index++] = pixel;
            imageData[index++] = pixel;
            imageData[index++] = pixel;
            
            // Track for grayscale too
            if (pixel < 50) extractedBlackCount++;
            if (pixel > 200) extractedWhiteCount++;
          }
        }
      }
      console.log(`During extraction: ${extractedBlackCount} black pixels, ${extractedWhiteCount} white pixels extracted out of ${width * height} total`);
    }
    
    const rawBuffer = Buffer.from(imageData);
    
    // Use sharp to encode to PNG
    const outputBuffer = await sharp(rawBuffer, {
      raw: {
        width: finalImage.width,
        height: finalImage.height,
        channels: 3, // RGB
      },
    })
    .png()
    .toBuffer();

    // Convert buffer to base64 data URL
    const base64 = outputBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Save processed template to Supabase Storage for debugging
    let storageUrl: string | null = null;
    try {
      const supabase = createServerClient();
      
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substr(2, 9);
      const fileName = `processed-templates/${timestamp}_${randomString}.png`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, outputBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading processed template to storage:', uploadError);
        // Don't fail the request if storage upload fails
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(fileName);
        
        storageUrl = urlData.publicUrl;
        console.log('Processed template saved to storage:', storageUrl);
      }
    } catch (storageError) {
      console.error('Error saving processed template to storage:', storageError);
      // Don't fail the request if storage upload fails
    }

    return NextResponse.json({
      success: true,
      dataUrl,
      storageUrl, // Output storage URL
      inputStorageUrl, // Input storage URL for comparison
      message: 'Image processed successfully',
    });
  } catch (error) {
    console.error('Error processing template:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process image',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
