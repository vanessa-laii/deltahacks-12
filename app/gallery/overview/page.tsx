'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Clock, Image as ImageIcon, TrendingUp, Users, Activity, Target } from 'lucide-react';
import TrendChart from '@/components/TrendChart';

interface Session {
  id: string;
  created_at: string;
  completion_time: number | null;
  neglect_ratio: number | null;
  tremor_index: number | null;
  ai_insight: string | null;
  quadrant_data: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
  } | null;
}

interface StatsData {
  totalSessions: number;
  totalImages: number;
  averageNeglectRatio: number | null;
  averageTremorIndex: number | null;
  averageCompletionTime: number | null;
  sessions: Session[];
  trends: {
    neglectRatio: { date: string; value: number }[];
    tremorIndex: { date: string; value: number }[];
    activityByDate: { date: string; count: number }[];
    quadrantActivity?: {
      date: string;
      topLeft: number;
      topRight: number;
      bottomLeft: number;
      bottomRight: number;
    }[];
  };
}

export default function OverviewPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="p-6 shadow-sm" style={{ backgroundColor: '#F5E6D3', borderBottom: '3px solid #D4E4F0' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/gallery')}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl text-2xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
            style={{ 
              backgroundColor: '#F4C2A1',
              color: '#6B5D5D'
            }}
          >
            <ArrowLeft className="w-6 h-6" />
            Back
          </button>
          
          <h1 className="text-4xl font-bold" style={{ color: '#6B5D5D' }}>Overview</h1>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Overview Content */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-2xl" style={{ color: '#8B7D6B' }}>Loading statistics...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Sessions Card */}
                <div 
                  className="rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: '#8FA8C7' }}
                    >
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Total Sessions</h3>
                  <p className="text-4xl font-bold" style={{ color: '#8FA8C7' }}>{stats?.totalSessions || 0}</p>
                </div>

                {/* Total Images Card */}
                <div 
                  className="rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: '#A8C09A' }}
                    >
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Total Images</h3>
                  <p className="text-4xl font-bold" style={{ color: '#A8C09A' }}>{stats?.totalImages || 0}</p>
                </div>

                {/* Average Neglect Ratio Card */}
                <div 
                  className="rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: '#C17767' }}
                    >
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Avg. Neglect Ratio</h3>
                  <p className="text-4xl font-bold" style={{ color: '#C17767' }}>
                    {stats && stats.averageNeglectRatio !== null 
                      ? stats.averageNeglectRatio.toFixed(3) 
                      : 'N/A'}
                  </p>
                  {stats && stats.averageNeglectRatio !== null && (
                    <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>
                      {stats.averageNeglectRatio < 0.3 ? 'Left neglect detected' : 
                       stats.averageNeglectRatio > 0.7 ? 'Right bias' : 'Balanced'}
                    </p>
                  )}
                </div>

                {/* Average Tremor Index Card */}
                <div 
                  className="rounded-3xl p-6 shadow-lg transition-all hover:shadow-xl"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: '#D4A5A5' }}
                    >
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Avg. Tremor Index</h3>
                  <p className="text-4xl font-bold" style={{ color: '#D4A5A5' }}>
                    {stats && stats.averageTremorIndex !== null 
                      ? stats.averageTremorIndex.toFixed(3) 
                      : 'N/A'}
                  </p>
                  {stats && stats.averageTremorIndex !== null && (
                    <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>
                      {stats.averageTremorIndex > 0.5 ? 'Higher tremor' : 'Stable'}
                    </p>
                  )}
                </div>
              </div>

              {/* Trend Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Neglect Ratio Trend */}
                <div 
                  className="rounded-3xl p-6 shadow-lg"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Target className="w-8 h-8" style={{ color: '#C17767' }} />
                    <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Neglect Ratio Trend</h2>
                  </div>
                  <TrendChart
                    data={stats?.trends.neglectRatio || []}
                    color="#C17767"
                    label="Left-sided neglect (lower = more neglect)"
                    minValue={0}
                    maxValue={1}
                  />
                </div>

                {/* Quadrant Activity Summary */}
                {stats?.trends.quadrantActivity && stats.trends.quadrantActivity.length > 0 && (
                  <div 
                    className="rounded-3xl p-6 shadow-lg"
                    style={{ 
                      backgroundColor: '#F5E6D3',
                      border: '2px solid #D4E4F0'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart3 className="w-8 h-8" style={{ color: '#8FA8C7' }} />
                      <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Quadrant Distribution</h2>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const latest = stats.trends.quadrantActivity[stats.trends.quadrantActivity.length - 1];
                        if (!latest) return null;
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4E4F0' }}>
                              <p className="text-lg font-semibold mb-1" style={{ color: '#6B5D5D' }}>Top-Left</p>
                              <p className="text-2xl font-bold" style={{ color: '#C17767' }}>{latest.topLeft.toFixed(1)}%</p>
                            </div>
                            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4E4F0' }}>
                              <p className="text-lg font-semibold mb-1" style={{ color: '#6B5D5D' }}>Top-Right</p>
                              <p className="text-2xl font-bold" style={{ color: '#8FA8C7' }}>{latest.topRight.toFixed(1)}%</p>
                            </div>
                            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4E4F0' }}>
                              <p className="text-lg font-semibold mb-1" style={{ color: '#6B5D5D' }}>Bottom-Left</p>
                              <p className="text-2xl font-bold" style={{ color: '#A8C09A' }}>{latest.bottomLeft.toFixed(1)}%</p>
                            </div>
                            <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4E4F0' }}>
                              <p className="text-lg font-semibold mb-1" style={{ color: '#6B5D5D' }}>Bottom-Right</p>
                              <p className="text-2xl font-bold" style={{ color: '#D4A5A5' }}>{latest.bottomRight.toFixed(1)}%</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Tremor Index Trend */}
                <div 
                  className="rounded-3xl p-6 shadow-lg"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Activity className="w-8 h-8" style={{ color: '#D4A5A5' }} />
                    <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Tremor Index Trend</h2>
                  </div>
                  <TrendChart
                    data={stats?.trends.tremorIndex || []}
                    color="#D4A5A5"
                    label="Motor stability (lower = more stable)"
                  />
                </div>
              </div>

              {/* Activity Trend Chart */}
              {stats?.trends.activityByDate && stats.trends.activityByDate.length > 0 && (
                <div 
                  className="rounded-3xl p-6 shadow-lg mb-8"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-8 h-8" style={{ color: '#8FA8C7' }} />
                    <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Activity Over Time</h2>
                  </div>
                  <TrendChart
                    data={stats.trends.activityByDate.map(d => ({ date: d.date, value: d.count }))}
                    color="#8FA8C7"
                    label="Sessions per day"
                    minValue={0}
                  />
                </div>
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sessions Section */}
                <div 
                  className="rounded-3xl p-6 shadow-lg"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-8 h-8" style={{ color: '#8FA8C7' }} />
                    <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Recent Sessions</h2>
                  </div>
                  <div className="space-y-4">
                    {stats?.sessions && stats.sessions.length > 0 ? (
                      stats.sessions.map((session) => (
                        <div 
                          key={session.id}
                          className="rounded-2xl p-4"
                          style={{ 
                            backgroundColor: '#FFFFFF',
                            border: '2px solid #D4E4F0'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xl font-bold mb-1" style={{ color: '#6B5D5D' }}>
                                Session {new Date(session.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-lg" style={{ color: '#8B7D6B' }}>
                                {formatDate(session.created_at)}
                              </p>
                              {session.neglect_ratio !== null && (
                                <p className="text-base mt-1" style={{ color: '#8B7D6B' }}>
                                  Neglect Ratio: {Number(session.neglect_ratio).toFixed(3)}
                                </p>
                              )}
                              {session.quadrant_data && (
                                <div className="text-base mt-1 space-y-1" style={{ color: '#8B7D6B' }}>
                                  <p className="font-semibold">Quadrant Activity:</p>
                                  <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span>TL: {session.quadrant_data.topLeft.toFixed(1)}%</span>
                                    <span>TR: {session.quadrant_data.topRight.toFixed(1)}%</span>
                                    <span>BL: {session.quadrant_data.bottomLeft.toFixed(1)}%</span>
                                    <span>BR: {session.quadrant_data.bottomRight.toFixed(1)}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              {session.completion_time !== null && (
                                <>
                                  <p className="text-lg font-semibold" style={{ color: '#8FA8C7' }}>Duration</p>
                                  <p className="text-lg" style={{ color: '#8B7D6B' }}>
                                    {formatDuration(session.completion_time)}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div 
                        className="rounded-2xl p-4 text-center"
                        style={{ 
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #D4E4F0'
                        }}
                      >
                        <p className="text-lg" style={{ color: '#8B7D6B' }}>No sessions yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary Statistics Section */}
                <div 
                  className="rounded-3xl p-6 shadow-lg"
                  style={{ 
                    backgroundColor: '#F5E6D3',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-8 h-8" style={{ color: '#A8C09A' }} />
                    <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Summary Statistics</h2>
                  </div>
                  <div className="space-y-4">
                    <div 
                      className="rounded-2xl p-4"
                      style={{ 
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #D4E4F0'
                      }}
                    >
                      <p className="text-xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Average Completion Time</p>
                      <p className="text-2xl font-semibold" style={{ color: '#8FA8C7' }}>
                        {stats && stats.averageCompletionTime !== null 
                          ? formatDuration(stats.averageCompletionTime)
                          : 'N/A'}
                      </p>
                    </div>
                    <div 
                      className="rounded-2xl p-4"
                      style={{ 
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #D4E4F0'
                      }}
                    >
                      <p className="text-xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Total Activity</p>
                      <p className="text-2xl font-semibold" style={{ color: '#D4A5A5' }}>
                        {stats?.totalSessions || 0} sessions
                      </p>
                      <p className="text-lg mt-1" style={{ color: '#8B7D6B' }}>
                        {stats?.totalImages || 0} images created
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
