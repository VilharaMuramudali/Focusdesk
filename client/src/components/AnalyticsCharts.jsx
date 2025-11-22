import React from 'react';

// Simple SVG Line Chart
export function LineChart({ data = [], width = 600, height = 160, color = '#007bff' }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map(d => d.value || 0), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * (width - 20) + 10;
    const y = height - ((d.value || 0) / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      {data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * (width - 20) + 10;
        const y = height - ((d.value || 0) / max) * (height - 20) - 10;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

// Simple Bar Chart
export function BarChart({ data = [], width = 400, height = 160, color = '#28a745' }) {
  if (!data || data.length === 0) return <div className="chart-empty">No data</div>;
  const max = Math.max(...data.map(d => d.value || 0), 1);
  const barWidth = (width - 20) / data.length;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const x = 10 + i * barWidth + 4;
        const h = ((d.value || 0) / max) * (height - 30);
        const y = height - h - 10;
        return (
          <rect key={i} x={x} y={y} width={Math.max(6, barWidth - 8)} height={h} fill={color} rx={3} />
        );
      })}
    </svg>
  );
}

// Donut chart for distribution
export function DonutChart({ data = [], size = 140, colors = ['#007bff','#28a745','#ffc107','#dc3545'] }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let offset = 0;
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size/2},${size/2})`}>
        {data.map((d, i) => {
          const fraction = (d.value || 0) / total;
          const dash = fraction * circumference;
          const dashOffset = circumference - offset;
          offset += dash;
          return (
            <circle key={i}
              r={radius}
              cx={0}
              cy={0}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={12}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="butt"
            />
          );
        })}
        <circle r={radius - 18} fill="#fff" />
      </g>
    </svg>
  );
}

// Heatmap: small wrapper to render grid cells given array of values
export function Heatmap({ values = [], columns = 7 }) {
  if (!values || values.length === 0) return <div className="chart-empty">No data</div>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 4 }}>
      {values.map((v, i) => (
        <div key={i} title={`${v.label || ''}: ${v.value}`} style={{ aspectRatio: '1', borderRadius: 3, background: getHeatColor(v.value) }} />
      ))}
    </div>
  );
}

function getHeatColor(value) {
  if (value >= 5) return '#1976d2';
  if (value >= 4) return '#64b5f6';
  if (value >= 3) return '#90caf9';
  if (value >= 2) return '#bbdefb';
  return '#e3f2fd';
}

export default {
  LineChart,
  BarChart,
  DonutChart,
  Heatmap
};
