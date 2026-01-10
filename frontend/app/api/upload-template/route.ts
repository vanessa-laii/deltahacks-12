import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/upload-template - Upload an image template for coloring pages
 * Accepts: PNG, JPG, JPEG formats only
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
    
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (restrict to easy-to-process formats)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: 'Invalid file format. Please upload PNG, JPG, or JPEG files only.',
          allowedFormats: ['PNG', 'JPG', 'JPEG']
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB for templates)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine content type
    const contentType = file.type || (fileExtension === '.png' ? 'image/png' : 'image/jpeg');
    
    // Generate unique filename with original extension preserved
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const extension = fileExtension;
    const fileName = `templates/${timestamp}_${randomString}${extension}`;
    
    // Upload to Supabase Storage in 'gallery-images' bucket (or create a separate bucket later)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('gallery-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading template:', uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(fileName);

    // Optionally: Save metadata to a templates table (for future use)
    // For now, just return the URL so it can be used on the canvas

    return NextResponse.json({ 
      success: true,
      fileName,
      url: urlData.publicUrl,
      message: 'Template uploaded successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/upload-template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
