import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  YAxis,
} from 'recharts';

interface AgentSparklineProps {
  data: number[];
  color: string;
  height?: number;
}

const AgentSparkline: React.FC<AgentSparklineProps> = ({
  data,
  color,
  height = 40,
}) => {
  // Convert array of numbers to recharts-compatible data
  const chartData = data.map((value, index) => ({
    hour: index,
    value,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                return (
                  <div
                    style={{
                      background:   'var(--admin-card)',
                      border:       '1px solid var(--admin-border)',
                      borderRadius: '4px',
                      padding:      '4px 8px',
                      fontSize:     '11px',
                      color:        'var(--admin-text)',
                      fontFamily:   'var(--admin-font-mono)',
                    }}
                  >
                    <span style={{ color }}>{payload[0].value}</span>
                    <span style={{ color: 'var(--admin-muted)', marginLeft: 4 }}>
                      calls
                    </span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{
              r:    3,
              fill: color,
              strokeWidth: 0,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgentSparkline;
