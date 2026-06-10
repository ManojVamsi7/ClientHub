import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './ui.css';

const StatCard = ({ label, value, trend, icon: Icon }) => {
  const isUp = trend?.type === 'up';
  
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
        {trend && (
          <div className={`stat-trend ${isUp ? 'up' : 'down'}`}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper">
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
