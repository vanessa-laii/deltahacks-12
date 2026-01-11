import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * DELETE /api/gallery/[id] - Delete a specific image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get image record to find storage path
    const { data: imageData, error: fetchError } = await supabase
      .from('gallery_images')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError || !imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    if (imageData.storage_path) {
      await supabase.storage
        .from('gallery-images')
        .remove([imageData.storage_path]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/gallery/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
