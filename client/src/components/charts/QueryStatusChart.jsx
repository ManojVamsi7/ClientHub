import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { QUERY_STATUS_COLORS, QUERY_STATUS_LABELS } from '../../utils/constants';
import './charts.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{QUERY_STATUS_LABELS[data.status] || data.name}</div>
        <ul className="tooltip-list">
          <li className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: data.color }} />
            <span>Queries:</span>
            <span className="tooltip-value">{data.value}</span>
          </li>
          <li className="tooltip-item">
            <span>Percentage:</span>
            <span className="tooltip-value">{data.percentage}%</span>
          </li>
        </ul>
      </div>
    );
  }
  return null;
};

const QueryStatusChart = ({ data = [] }) => {
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);

  const chartData = data.map((item) => ({
    name: QUERY_STATUS_LABELS[item.status] || item.status,
    value: Number(item.count || 0),
    status: item.status,
    color: QUERY_STATUS_COLORS[item.status] || '#64748b',
    percentage: total > 0 ? Math.round((Number(item.count || 0) / total) * 100) : 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <h3 className="chart-title">Queries by Status</h3>
        <p className="chart-subtitle">Distribution of customer support tickets</p>
      </div>

      <div className="chart-container-wrapper" style={{ position: 'relative' }}>
        {total === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No query data available
          </div>
        ) : (
          <>
            {/* Total count in the center */}
            <div style={{
              position: 'absolute',
              top: '41%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, uppercase: 'true' }}>Total</div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default QueryStatusChart;
