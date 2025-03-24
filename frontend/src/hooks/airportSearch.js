import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { fetchAirportSuggestions } from '../services/amadeusApi';

export const useAirportSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = debounce(async (searchTerm) => {
    try {
      if (searchTerm.length > 2) {
        setLoading(true);
        const results = await fetchAirportSuggestions(searchTerm);
        setSuggestions(results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(query);
    return () => debouncedSearch.cancel();
  }, [query]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error
  };
};