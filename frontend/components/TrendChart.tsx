'use client';

interface TrendChartProps {
  data: { date: string; value: number }[];
  color: string;
  label: string;
  maxValue?: number;
  minValue?: number;
}

export default function TrendChart({ data, color, label, maxValue, minValue }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '2px solid #D4E4F0' }}>
        <p className="text-xl" style={{ color: '#8B7D6B' }}>No data available</p>
      </div>
    );
  }

  const width = 600;
  const height = 200;
  const padding = 40;

  // Calculate min/max values
  const values = data.map(d => d.value);
  const calculatedMin = minValue !== undefined ? minValue : Math.min(...values);
  const calculatedMax = maxValue !== undefined ? maxValue : Math.max(...values);
  const range = calculatedMax - calculatedMin || 1; // Avoid division by zero

  // Calculate points
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - calculatedMin) / range) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  // Create path for the line
  const pathData = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((d.value - calculatedMin) / range) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: '100%' }}>
        {/* Background */}
        <rect width={width} height={height} fill="#FFFFFF" rx="16" />
        
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight - ratio * chartHeight;
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#D4E4F0"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Chart line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
          const y = padding + chartHeight - ((d.value - calculatedMin) / range) * chartHeight;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="2"
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio) => {
          const value = calculatedMin + ratio * range;
          const y = padding + chartHeight - ratio * chartHeight;
          return (
            <text
              key={ratio}
              x={padding - 10}
              y={y + 5}
              textAnchor="end"
              fontSize="12"
              fill="#8B7D6B"
            >
              {value.toFixed(2)}
            </text>
          );
        })}
      </svg>
      <p className="text-center mt-2 text-lg font-semibold" style={{ color: '#6B5D5D' }}>{label}</p>
    </div>
  );
}
