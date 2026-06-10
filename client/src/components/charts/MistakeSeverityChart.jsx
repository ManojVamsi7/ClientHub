import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { MISTAKE_SEVERITY_COLORS, MISTAKE_SEVERITY_LABELS } from '../../utils/constants';
import './charts.css';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{MISTAKE_SEVERITY_LABELS[data.severity] || data.name} Severity</div>
        <ul className="tooltip-list">
          <li className="tooltip-item">
            <span className="tooltip-dot" style={{ backgroundColor: data.color }} />
            <span>Mistakes:</span>
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

const MistakeSeverityChart = ({ data = { low: 0, medium: 0, high: 0 } }) => {
  const total = Number(data.low || 0) + Number(data.medium || 0) + Number(data.high || 0);

  const chartData = [
    { severity: 'low', name: 'Low', value: Number(data.low || 0), color: MISTAKE_SEVERITY_COLORS.low },
    { severity: 'medium', name: 'Medium', value: Number(data.medium || 0), color: MISTAKE_SEVERITY_COLORS.medium },
    { severity: 'high', name: 'High', value: Number(data.high || 0), color: MISTAKE_SEVERITY_COLORS.high },
  ].filter(item => item.value > 0).map(item => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0
  }));

  return (
    <div className="chart-card" style={{ height: '300px' }}>
      <div className="chart-header">
        <h3 className="chart-title">Severity Breakdown</h3>
        <p className="chart-subtitle">Distribution of mistakes by severity levels</p>
      </div>

      <div className="chart-container-wrapper" style={{ position: 'relative' }}>
        {total === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No mistake records logged
          </div>
        ) : (
          <>
            <div style={{
              position: 'absolute',
              top: '41%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Logs</div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={32} 
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

export default MistakeSeverityChart;
