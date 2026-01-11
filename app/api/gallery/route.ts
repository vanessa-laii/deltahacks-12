import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/gallery - Get all saved images for the current user
 */
export async function GET(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = createServerClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to initialize database connection' },
        { status: 500 }
      );
    }
    
    // TODO: Add authentication and filter by user_id
    // For now, return all images (you'll need to add user auth later)
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ images: data || [] });
  } catch (error) {
    console.error('Error in GET /api/gallery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gallery - Save a new image to the gallery
 */
export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = createServerClient();
    } catch (error) {
      console.error('Failed to create Supabase client:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to initialize database connection' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { imageDataUrl, userId } = body;

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: 'Image data URL is required' },
        { status: 400 }
      );
    }

    // Convert data URL to buffer
    const base64Data = imageDataUrl.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Invalid image data URL format' },
        { status: 400 }
      );
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const fileName = `gallery/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
    
    // Upload to Supabase Storage (buffer works in Node.js environment)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(fileName);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('gallery_images')
      .insert({
        storage_url: urlData.publicUrl,
        storage_path: fileName,
        user_id: userId || null, // TODO: Get from auth session
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving to database:', dbError);
      // Try to clean up uploaded file if database insert fails
      await supabase.storage.from('gallery-images').remove([fileName]);
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      image: dbData 
    });
  } catch (error) {
    console.error('Error in POST /api/gallery:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

