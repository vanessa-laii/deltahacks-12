import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/sessions/stats - Get session statistics and overview data
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
    
    // Get total gallery images count
    const { count: imageCount, error: imageError } = await supabase
      .from('gallery_images')
      .select('*', { count: 'exact', head: true });

    if (imageError) {
      console.error('Error counting images:', imageError);
    }

    // Get sessions with metrics
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      // Return empty stats if sessions table doesn't have data yet
      return NextResponse.json({
        totalSessions: 0,
        totalImages: imageCount || 0,
        averageNeglectRatio: null,
        averageTremorIndex: null,
        averageCompletionTime: null,
        sessions: [],
        trends: {
          neglectRatio: [],
          tremorIndex: [],
          activityByDate: [],
        },
      });
    }

    const totalSessions = sessions?.length || 0;
    
    // Calculate averages
    const validNeglectRatios = sessions?.filter(s => s.neglect_ratio !== null).map(s => Number(s.neglect_ratio)) || [];
    const validTremorIndices = sessions?.filter(s => s.tremor_index !== null).map(s => Number(s.tremor_index)) || [];
    const validCompletionTimes = sessions?.filter(s => s.completion_time !== null).map(s => Number(s.completion_time)) || [];

    const averageNeglectRatio = validNeglectRatios.length > 0
      ? validNeglectRatios.reduce((a, b) => a + b, 0) / validNeglectRatios.length
      : null;

    const averageTremorIndex = validTremorIndices.length > 0
      ? validTremorIndices.reduce((a, b) => a + b, 0) / validTremorIndices.length
      : null;

    const averageCompletionTime = validCompletionTimes.length > 0
      ? validCompletionTimes.reduce((a, b) => a + b, 0) / validCompletionTimes.length
      : null;

    // Prepare trend data (last 30 days or all if less)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentSessions = sessions?.filter(s => {
      const createdAt = new Date(s.created_at);
      return createdAt >= thirtyDaysAgo;
    }) || [];

    // Group by date for activity trend
    const activityByDate: { date: string; count: number }[] = [];
    const dateMap = new Map<string, number>();
    
    recentSessions.forEach(session => {
      const date = new Date(session.created_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    dateMap.forEach((count, date) => {
      activityByDate.push({ date, count });
    });
    
    activityByDate.sort((a, b) => a.date.localeCompare(b.date));

    // Neglect ratio trend (latest 20 sessions)
    const neglectRatioTrend = recentSessions
      .slice(0, 20)
      .filter(s => s.neglect_ratio !== null)
      .map(s => ({
        date: new Date(s.created_at).toISOString().split('T')[0],
        value: Number(s.neglect_ratio),
      }))
      .reverse();

    // Quadrant activity trend (latest 20 sessions with quadrant data)
    const quadrantTrend = recentSessions
      .slice(0, 20)
      .filter(s => s.quadrant_data !== null)
      .map(s => {
        const quad = s.quadrant_data as any;
        return {
          date: new Date(s.created_at).toISOString().split('T')[0],
          topLeft: quad?.topLeft || 0,
          topRight: quad?.topRight || 0,
          bottomLeft: quad?.bottomLeft || 0,
          bottomRight: quad?.bottomRight || 0,
        };
      })
      .reverse();

    // Tremor index trend (latest 20 sessions)
    const tremorIndexTrend = recentSessions
      .slice(0, 20)
      .filter(s => s.tremor_index !== null)
      .map(s => ({
        date: new Date(s.created_at).toISOString().split('T')[0],
        value: Number(s.tremor_index),
      }))
      .reverse();

    return NextResponse.json({
      totalSessions,
      totalImages: imageCount || 0,
      averageNeglectRatio,
      averageTremorIndex,
      averageCompletionTime,
      sessions: sessions?.slice(0, 10) || [], // Latest 10 sessions for display
      trends: {
        neglectRatio: neglectRatioTrend,
        tremorIndex: tremorIndexTrend,
        activityByDate,
        quadrantActivity: quadrantTrend,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/sessions/stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
