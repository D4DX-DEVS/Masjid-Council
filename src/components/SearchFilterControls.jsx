import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, Filter, X } from "lucide-react";

const SearchFilterControls = ({ 
  data, 
  onFilteredDataChange, 
  searchFields = ['mosqueName'], 
  filterFields = ['status', 'district'],
  uniqueFieldValues = {},
  filterFieldLabels = {} // New prop for custom labels
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  // Temporary filters (user's selection before applying)
  const [tempFilters, setTempFilters] = useState({});
  
  // Applied filters (actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState({});
  
  // Track if filters have been initialized
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use ref to store the callback to avoid dependency issues
  const onFilteredDataChangeRef = useRef(onFilteredDataChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onFilteredDataChangeRef.current = onFilteredDataChange;
  }, [onFilteredDataChange]);

  // Initialize filters based on filterFields - only once
  useEffect(() => {
    if (!isInitialized) {
      const initialFilters = {};
      filterFields.forEach(field => {
        initialFilters[field] = 'all';
      });
      setTempFilters(initialFilters);
      setAppliedFilters(initialFilters);
      setIsInitialized(true);
    }
  }, [filterFields, isInitialized]);

  const getNestedValue = useCallback((obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Memoize the filtered data computation
  const filteredData = useMemo(() => {
    let filtered = data || [];

    // Search functionality
    if (searchTerm && searchFields.length > 0) {
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const fieldValue = getNestedValue(item, field);
          return fieldValue?.toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Filter functionality - using appliedFilters
    filterFields.forEach(field => {
      if (appliedFilters[field] && appliedFilters[field] !== 'all') {
        filtered = filtered.filter(item => {
          const fieldValue = getNestedValue(item, field);
          return fieldValue === appliedFilters[field];
        });
      }
    });

    return filtered;
  }, [data, searchTerm, appliedFilters, searchFields, filterFields, getNestedValue]);

  // Send filtered data to parent whenever it changes
  useEffect(() => {
    if (isInitialized && onFilteredDataChangeRef.current) {
      onFilteredDataChangeRef.current(filteredData);
    }
  }, [filteredData, isInitialized]);

  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    setShowFilter(false);
  }, []);

  const toggleFilter = useCallback(() => {
    setShowFilter(prev => !prev);
    setShowSearch(false);
  }, []);

  const handleFilterChange = useCallback((field, value) => {
    setTempFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters({ ...tempFilters });
  }, [tempFilters]);

  const resetFilters = useCallback(() => {
    const initialFilters = {};
    filterFields.forEach(field => {
      initialFilters[field] = 'all';
    });
    setTempFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }, [filterFields]);

  const getUniqueValues = useCallback((field) => {
    if (uniqueFieldValues[field]) {
      return uniqueFieldValues[field];
    }
    return [...new Set(data?.map(item => getNestedValue(item, field)).filter(Boolean))];
  }, [uniqueFieldValues, data, getNestedValue]);

  const getSearchPlaceholder = useCallback(() => {
    if (searchFields.includes('mosqueName')) return 'Search by mosque name...';
    if (searchFields.includes('name')) return 'Search by name...';
    return 'Search...';
  }, [searchFields]);

  const getFilterLabel = useCallback((field) => {
    if (filterFieldLabels[field]) {
      return filterFieldLabels[field];
    }
    // Default label formatting
    return field.charAt(0).toUpperCase() + field.slice(1);
  }, [filterFieldLabels]);

  return (
    <div className="flex items-center gap-4 h-12">
      {/* Search Button that Expands */}
      <div className="flex items-center h-10">
        {!showSearch ? (
          <button
            onClick={toggleSearch}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-500 h-10"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-500">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-lg transition-all duration-500 w-80 h-10"
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowSearch(false)}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Button that Expands */}
      <div className="flex items-center h-10">
        {!showFilter ? (
          <button
            onClick={toggleFilter}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-500 h-10"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-500">
            <div className="flex gap-3 bg-white p-3 rounded-lg shadow-lg border border-gray-300 items-center">
              {filterFields.map(field => (
                <select
                  key={field}
                  value={tempFilters[field] || 'all'}
                  onChange={(e) => handleFilterChange(field, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm h-9 min-w-[150px]"
                >
                  <option value="all">
                    All {getFilterLabel(field)}
                  </option>
                  {getUniqueValues(field).map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              ))}
              
              {/* Apply and Reset Buttons */}
              <div className="flex gap-2 ml-2 border-l border-gray-300 pl-3">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors h-9 font-medium"
                >
                  Apply
                </button>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors h-9 font-medium"
                >
                  Reset
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowFilter(false)}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterControls;
