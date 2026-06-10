import React from 'react';
import { Search, X } from 'lucide-react';
import './ui.css';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="search-bar-wrapper">
      <Search className="search-icon-svg" size={16} />
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button onClick={handleClear} className="clear-search-btn" type="button" aria-label="Clear Search">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
