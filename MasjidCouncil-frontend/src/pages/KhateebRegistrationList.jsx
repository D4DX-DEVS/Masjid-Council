import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SearchFilterControls from "../components/SearchFilterControls";
import { ListSkeleton } from "../components/Skeleton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STATUS_STYLES = {
  pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'Approved', class: 'bg-green-100 text-green-800' },
  rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800' }
};

const StatusBadge = ({ status }) => {
  const config = STATUS_STYLES[status] || { text: 'Unknown', class: 'bg-gray-100 text-gray-800' };
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.class}`}>{config.text}</span>;
};

// ponytail: one component for both admin and super admin — they differ only by sidebar and details route
const KhateebRegistrationList = ({ role = 'admin' }) => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const Sidebar = role === 'superadmin' ? SuperAdminSidebar : AdminSidebar;
  const detailsPath = role === 'superadmin' ? '/superadmin-khateeb-details' : '/khateeb-details-admin';

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/khateebRegistration/all`, {
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (data.success) {
          setRegistrations(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch khateeb registrations');
        }
      } catch (err) {
        console.error('Fetch khateeb registrations error:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const handleFilteredDataChange = useCallback((filteredData) => {
    setFilteredRegistrations(filteredData);
    setCurrentPage(1);
  }, []);

  const uniqueDistricts = useMemo(
    () => [...new Set(registrations.map((item) => item.district).filter(Boolean))],
    [registrations]
  );

  const searchFields = useMemo(() => ["fullName", "phone", "masjidName", "mahallu", "district", "area"], []);
  const filterFields = useMemo(() => ["status", "district", "attending", "feePaid"], []);
  const uniqueFieldValues = useMemo(() => ({ district: uniqueDistricts }), [uniqueDistricts]);
  const filterFieldLabels = useMemo(
    () => ({ status: "Status", district: "District", attending: "Attending", feePaid: "Fee Paid" }),
    []
  );

  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRegistrations.slice(startIndex, endIndex);

  const openDetails = (registration) => navigate(detailsPath, { state: { registration } });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <div className="p-4 sm:p-8 pb-24 md:pb-8">
          <h1
            className="text-xl sm:text-2xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Anek Malayalam Variable" }}
          >
            MIRQATH '26 — ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ
          </h1>

          <div className="flex justify-end mb-6">
            <SearchFilterControls
              data={registrations}
              onFilteredDataChange={handleFilteredDataChange}
              searchFields={searchFields}
              filterFields={filterFields}
              uniqueFieldValues={uniqueFieldValues}
              filterFieldLabels={filterFieldLabels}
            />
          </div>

          <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-0">
            {error && (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
              </div>
            )}

            {loading && <ListSkeleton />}

            {!loading && !error && (
              <div>
                {/* Mobile: cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((item, index) => (
                      <button
                        key={item._id || index}
                        onClick={() => openDetails(item)}
                        className="w-full text-left p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.fullName || 'Unknown'}</p>
                            <p className="text-sm text-gray-600 truncate">{item.masjidName || '-'}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {[item.district, item.area].filter(Boolean).join(', ') || 'Not specified'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{item.phone || '-'}</p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>
                        <div className="flex gap-2 mt-3 text-xs">
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                            {item.attending === 'yes' ? 'പങ്കെടുക്കും' : 'ഇല്ല'}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                            ഫീസ്: {item.feePaid === 'yes' ? 'അടച്ചു' : 'ഇല്ല'}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="p-8 text-center text-gray-500">No khateeb registrations found</p>
                  )}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: '#6db14e' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Khateeb Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Masjid</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Attending</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Fee</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentData.length > 0 ? (
                        currentData.map((item, index) => (
                          <tr
                            key={item._id || index}
                            className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                            onClick={() => openDetails(item)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{item.fullName || 'Unknown'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.masjidName || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {[item.district, item.area].filter(Boolean).join(', ') || 'Not specified'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.phone || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.attending === 'yes' ? 'Yes' : 'No'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.feePaid === 'yes' ? 'Paid' : 'Not paid'}</td>
                            <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={item.status} /></td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 transition-colors">
                                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                            No khateeb registrations found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="text-sm text-gray-700">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredRegistrations.length)} of {filteredRegistrations.length} results
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 text-sm border rounded-md ${
                              page === currentPage ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KhateebRegistrationList;
