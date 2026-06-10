import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { MISTAKE_SEVERITY_COLORS } from '../../utils/constants';
import './charts.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-title">{label}</div>
        <ul className="tooltip-list">
          {payload.map((item, idx) => (
            <li key={idx} className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: item.color }} />
              <span style={{ textTransform: 'capitalize' }}>{item.name} Severity:</span>
              <span className="tooltip-value">{item.value}</span>
            </li>
          ))}
          <li className="tooltip-item" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '6px', paddingTop: '4px' }}>
            <span>Total Mistakes:</span>
            <span className="tooltip-value" style={{ fontWeight: 700 }}>
              {payload.reduce((sum, item) => sum + Number(item.value), 0)}
            </span>
          </li>
        </ul>
      </div>
    );
  }
  return null;
};

const RecruiterPerformanceChart = ({ data = [] }) => {
  return (
    <div className="chart-card" style={{ height: '400px' }}>
      <div className="chart-header">
        <h3 className="chart-title">QA Report: Recruiter Performance</h3>
        <p className="chart-subtitle">Mistakes logged per recruiter by severity level</p>
      </div>

      <div className="chart-container-wrapper">
        {data.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            No mistake data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.05)" vertical={false} />
              <XAxis 
                dataKey="recruiter_name" 
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
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'capitalize' }}>{value}</span>}
              />
              <Bar dataKey="low" name="low" stackId="a" fill={MISTAKE_SEVERITY_COLORS.low} radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" name="medium" stackId="a" fill={MISTAKE_SEVERITY_COLORS.medium} radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" name="high" stackId="a" fill={MISTAKE_SEVERITY_COLORS.high} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default RecruiterPerformanceChart;
