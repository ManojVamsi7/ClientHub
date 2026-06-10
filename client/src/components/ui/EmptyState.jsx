import React from 'react';
import { Database } from 'lucide-react';
import Button from './Button';
import './ui.css';

const EmptyState = ({
  title = 'No Data Found',
  description = 'There is no data to show in this view right now.',
  icon: Icon = Database,
  actionLabel,
  onActionClick,
}) => {
  return (
    <div className="empty-state page-fade-in">
      <div className="empty-state-icon">
        <Icon size={32} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionLabel && onActionClick && (
        <Button onClick={onActionClick} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
