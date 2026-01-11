import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/sessions - Save a new session to the database
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
    const { 
      imageId, 
      completionTime, 
      neglectRatio, 
      quadrantActivity,
      tremorIndex, 
      aiInsight,
      userId 
    } = body;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Prepare session data
    const sessionData: any = {
      image_id: imageId,
      completion_time: completionTime ? Math.round(completionTime) : null,
      neglect_ratio: neglectRatio !== null && neglectRatio !== undefined ? Number(neglectRatio) : null,
      tremor_index: tremorIndex !== null && tremorIndex !== undefined ? Number(tremorIndex) : null,
      ai_insight: aiInsight || null,
      user_id: userId || null, // TODO: Get from auth session
    };

    // Store quadrant activity as JSONB if provided
    if (quadrantActivity) {
      sessionData.quadrant_data = {
        topLeft: quadrantActivity.topLeft,
        topRight: quadrantActivity.topRight,
        bottomLeft: quadrantActivity.bottomLeft,
        bottomRight: quadrantActivity.bottomRight,
      };
    }
    
    // Save to database
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error saving session:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If we have quadrant data, we could store it separately or in a JSON field
    // For now, let's store it in a way that can be retrieved later
    // We'll update the schema to add a quadrant_data JSONB column, but for backward compatibility
    // we'll make it optional and store quadrant info in the ai_insight metadata if needed
    
    return NextResponse.json({ 
      success: true, 
      session: data 
    });
  } catch (error) {
    console.error('Error in POST /api/sessions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
