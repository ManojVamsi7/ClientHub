import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import './ui.css';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  sortColumn,
  sortOrder,
  onSort,
  emptyTitle,
  emptyDesc,
}) => {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    
    let newOrder = 'asc';
    if (sortColumn === column.key) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(column.key, newOrder);
  };

  const renderSortIcon = (column) => {
    if (!column.sortable) return null;
    if (sortColumn !== column.key) {
      return <ArrowUpDown size={14} className="sort-icon" style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="sort-icon" /> 
      : <ArrowDown size={14} className="sort-icon" />;
  };

  if (loading) {
    return (
      <div className="table-card">
        <div className="table-wrapper" style={{ padding: '40px 0' }}>
          <LoadingSpinner message="Fetching records..." />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-card">
        <EmptyState title={emptyTitle} description={emptyDesc} />
      </div>
    );
  }

  return (
    <div className="table-card page-fade-in">
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  onClick={() => handleSort(col)}
                  style={{ width: col.width || 'auto' }}
                >
                  {col.label}
                  {renderSortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row, rowIdx) : row[col.key] ?? 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
