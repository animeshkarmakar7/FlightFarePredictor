import { useAirportSearch } from '../../hooks/airportSearch';
import React, { useEffect, useRef, useState } from 'react';

const AirportAutocomplete = ({ label, value, onSelect }) => {
  const { query, setQuery, suggestions, loading, error } = useAirportSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  const handleSelect = (suggestion) => {
    // If your backend expects a property "city", you can map it here:
    const selectedAirport = {
      city: suggestion.name,
      code: suggestion.code,
      ...suggestion
    };
    setQuery(`${suggestion.name} (${suggestion.code})`);
    onSelect(selectedAirport);
    setShowSuggestions(false);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        value={query || value?.name || ''}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowSuggestions(e.target.value.length > 2);
        }}
        className="w-full p-2 border rounded-lg"
        placeholder="Search airports..."
        onFocus={() => setShowSuggestions(query.length > 2)}
      />
      
      {loading && (
        <div className="absolute mt-1 w-full p-2 bg-gray-50">Loading...</div>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="p-2 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              {suggestion.name} ({suggestion.code}) - {suggestion.type}
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className="absolute mt-1 w-full p-2 bg-red-50 text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default AirportAutocomplete;
