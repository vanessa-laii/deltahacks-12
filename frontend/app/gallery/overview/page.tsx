'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Clock, Image as ImageIcon, TrendingUp, Users } from 'lucide-react';

export default function OverviewPage() {
  const router = useRouter();

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
              <p className="text-4xl font-bold" style={{ color: '#8FA8C7' }}>--</p>
              <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>Coming soon</p>
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
              <p className="text-4xl font-bold" style={{ color: '#A8C09A' }}>--</p>
              <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>Coming soon</p>
            </div>

            {/* Average Session Duration Card */}
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
                  style={{ backgroundColor: '#F4C2A1' }}
                >
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Avg. Duration</h3>
              <p className="text-4xl font-bold" style={{ color: '#C17767' }}>--</p>
              <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>Coming soon</p>
            </div>

            {/* Activity Trend Card */}
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
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Activity Trend</h3>
              <p className="text-4xl font-bold" style={{ color: '#D4A5A5' }}>--</p>
              <p className="text-lg mt-2" style={{ color: '#8B7D6B' }}>Coming soon</p>
            </div>
          </div>

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
                {/* Placeholder session items */}
                {[1, 2, 3, 4].map((item) => (
                  <div 
                    key={item}
                    className="rounded-2xl p-4"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #D4E4F0'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold mb-1" style={{ color: '#6B5D5D' }}>Session {item}</p>
                        <p className="text-lg" style={{ color: '#8B7D6B' }}>Date: Coming soon</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold" style={{ color: '#8FA8C7' }}>Duration</p>
                        <p className="text-lg" style={{ color: '#8B7D6B' }}>--</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Analytics Section */}
            <div 
              className="rounded-3xl p-6 shadow-lg"
              style={{ 
                backgroundColor: '#F5E6D3',
                border: '2px solid #D4E4F0'
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <ImageIcon className="w-8 h-8" style={{ color: '#A8C09A' }} />
                <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Image Analytics</h2>
              </div>
              <div className="space-y-4">
                {/* Placeholder analytics items */}
                <div 
                  className="rounded-2xl p-4"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <p className="text-xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Images per Session</p>
                  <p className="text-lg" style={{ color: '#8B7D6B' }}>Average: Coming soon</p>
                </div>
                <div 
                  className="rounded-2xl p-4"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <p className="text-xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Color Usage</p>
                  <p className="text-lg" style={{ color: '#8B7D6B' }}>Most used colors: Coming soon</p>
                </div>
                <div 
                  className="rounded-2xl p-4"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <p className="text-xl font-bold mb-2" style={{ color: '#6B5D5D' }}>Completion Rate</p>
                  <p className="text-lg" style={{ color: '#8B7D6B' }}>Percentage: Coming soon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline Section */}
          <div 
            className="mt-6 rounded-3xl p-6 shadow-lg"
            style={{ 
              backgroundColor: '#F5E6D3',
              border: '2px solid #D4E4F0'
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8" style={{ color: '#F4C2A1' }} />
              <h2 className="text-3xl font-bold" style={{ color: '#6B5D5D' }}>Activity Timeline</h2>
            </div>
            <div className="space-y-4">
              {/* Placeholder timeline items */}
              {[1, 2, 3].map((item) => (
                <div 
                  key={item}
                  className="rounded-2xl p-4"
                  style={{ 
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #D4E4F0'
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: '#8FA8C7' }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-xl font-bold" style={{ color: '#6B5D5D' }}>Activity {item}</p>
                      <p className="text-lg" style={{ color: '#8B7D6B' }}>Description: Coming soon</p>
                      <p className="text-base mt-1" style={{ color: '#8B7D6B' }}>Time: --</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
