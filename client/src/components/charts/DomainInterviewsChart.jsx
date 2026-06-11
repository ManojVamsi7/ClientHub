import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import './charts.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{data.name}</div>
        <ul className="tooltip-list">
          <li className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: '#6366f1' }} />
            <span>Interviews:</span>
            <span className="tooltip-value">{data.value}</span>
          </li>
        </ul>
      </div>
    );
  }
  return null;
};

const DomainInterviewsChart = ({ data = [] }) => {
  // Take top 8 domains to keep the chart clean
  const chartData = [...data].slice(0, 8);

  // Harmonious gradient colors for the bars
  const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="chart-card" style={{ height: '400px' }}>
      <div className="chart-header">
        <h3 className="chart-title">Placements by Domain</h3>
        <p className="chart-subtitle">Ranked count of interview calls logged per department</p>
      </div>

      <div className="chart-container-wrapper">
        {chartData.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No interview data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="var(--text-muted)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="var(--text-primary)" 
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={110}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DomainInterviewsChart;
