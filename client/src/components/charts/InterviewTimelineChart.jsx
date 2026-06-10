import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDate } from '../../utils/formatters';
import './charts.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    // Format YYYY-MM into Human-Readable Month
    let label = data.month;
    try {
      const parts = data.month.split('-');
      const date = new Date(parts[0], parts[1] - 1, 1);
      label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      // Degrade gracefully
    }

    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{label}</div>
        <ul className="tooltip-list">
          <li className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: 'var(--accent-blue)' }} />
            <span>Interviews:</span>
            <span className="tooltip-value">{data.count}</span>
          </li>
        </ul>
      </div>
    );
  }
  return null;
};

const InterviewTimelineChart = ({ data = [] }) => {
  const chartData = data.map((item) => {
    let displayMonth = item.month;
    try {
      const parts = item.month.split('-');
      const date = new Date(parts[0], parts[1] - 1, 1);
      displayMonth = date.toLocaleDateString('en-US', { month: 'short' });
    } catch (e) {
      // Degrade gracefully
    }
    return {
      ...item,
      displayMonth,
    };
  });

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Interviews Overview</h3>
        <p className="chart-subtitle">Monthly interview call frequency</p>
      </div>

      <div className="chart-container-wrapper">
        {chartData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No timeline data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" vertical={false} />
              <XAxis 
                dataKey="displayMonth" 
                stroke="var(--text-muted)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--text-muted)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="var(--accent-blue)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default InterviewTimelineChart;
