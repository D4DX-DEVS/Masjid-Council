import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import SelectField from "./SelectField";

const getNestedValue = (obj, path) => path.split('.').reduce((current, key) => current?.[key], obj);

const ALL = '__all';

// Search box is always visible; filters live in a popover with an active-count badge.
// Filters apply as you pick them — no Apply button to forget to press.
const SearchFilterControls = ({
  data,
  onFilteredDataChange,
  searchFields = ['mosqueName'],
  filterFields = ['status', 'district'],
  uniqueFieldValues = {},
  filterFieldLabels = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showFilter, setShowFilter] = useState(false);
  const panelRef = useRef(null);

  const onChangeRef = useRef(onFilteredDataChange);
  useEffect(() => {
    onChangeRef.current = onFilteredDataChange;
  }, [onFilteredDataChange]);

  useEffect(() => {
    if (!showFilter) return;
    const onDown = (e) => {
      // Radix renders the select listbox in a portal, outside panelRef — don't treat it as "outside"
      if (e.target.closest?.('[data-radix-popper-content-wrapper]')) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) setShowFilter(false);
    };
    const onKey = (e) => e.key === 'Escape' && setShowFilter(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showFilter]);

  const filteredData = useMemo(() => {
    let filtered = data || [];

    if (searchTerm) {
      const needle = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        searchFields.some((field) => getNestedValue(item, field)?.toLowerCase().includes(needle))
      );
    }

    for (const field of filterFields) {
      const value = filters[field];
      if (value) filtered = filtered.filter((item) => getNestedValue(item, field) === value);
    }

    return filtered;
  }, [data, searchTerm, filters, searchFields, filterFields]);

  useEffect(() => {
    onChangeRef.current?.(filteredData);
  }, [filteredData]);

  const getUniqueValues = useCallback(
    (field) =>
      uniqueFieldValues[field] ||
      [...new Set(data?.map((item) => getNestedValue(item, field)).filter(Boolean))],
    [uniqueFieldValues, data]
  );

  const getLabel = (field) =>
    filterFieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1);

  const activeCount = filterFields.filter((f) => filters[f]).length;

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:flex-none sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-gray-300 rounded-lg placeholder:text-gray-400 focus:outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600/15"
        />
      </div>

      <div className="relative flex-shrink-0" ref={panelRef}>
        <button
          onClick={() => setShowFilter((v) => !v)}
          aria-expanded={showFilter}
          className="flex items-center gap-2 h-10 px-3 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#6db14e] text-white text-[11px] font-semibold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {showFilter && (
          <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Filters</p>
              <button
                onClick={() => setShowFilter(false)}
                aria-label="Close filters"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {filterFields.map((field) => (
                <label key={field} className="block">
                  <span className="block text-xs font-medium text-gray-500 mb-1">{getLabel(field)}</span>
                  <SelectField
                    name={field}
                    value={filters[field] || ALL}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        [field]: e.target.value === ALL ? undefined : e.target.value
                      }))
                    }
                  >
                    {/* Sentinel, not an empty value — Radix treats "" as the placeholder */}
                    <option value={ALL}>All</option>
                    {getUniqueValues(field).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </SelectField>
                </label>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setFilters({})}
                disabled={activeCount === 0}
                className="w-full h-9 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterControls;
