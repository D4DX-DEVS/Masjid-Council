import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SearchFilterControls from "../components/SearchFilterControls";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SuperAdminMosqueFundList = () => {
  const navigate = useNavigate();
  const [mosqueFunds, setMosqueFunds] = useState([]);
  const [filteredMosqueFunds, setFilteredMosqueFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMosqueFunds();
  }, []);

  // Handle filtered data from SearchFilterControls
  const handleFilteredDataChange = (filteredData) => {
    setFilteredMosqueFunds(filteredData);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const fetchMosqueFunds = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueFund/all`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setMosqueFunds(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch mosque fund applications');
      }
    } catch (error) {
      console.error('Fetch mosque funds error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasjidClick = (mosqueFund) => {
    // Navigate to detailed view with mosque fund data
    navigate("/superadmin-mosque-fund-details", { state: { mosqueFund } });
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium'
        };
      case 'approved':
        return {
          text: 'Approved',
          className: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
        };
      case 'rejected':
        return {
          text: 'Rejected',
          className: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium'
        };
      default:
        return {
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium'
        };
    }
  };

  // Get unique districts for filter dropdown
  const uniqueDistricts = [...new Set(mosqueFunds.map(mosqueFund => mosqueFund.district).filter(Boolean))];

  // Pagination logic
  const totalPages = Math.ceil(filteredMosqueFunds.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredMosqueFunds.slice(startIndex, endIndex);


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SuperAdminSidebar />
      
      <div className="flex-1 min-w-0">
        <div className="p-8">
          {/* Search and Filter Controls */}
          <div className="flex justify-end mb-6">
            <SearchFilterControls
              data={mosqueFunds}
              onFilteredDataChange={handleFilteredDataChange}
              searchFields={['mosqueName', 'trackingId', 'mosqueFundNumber', 'mckAffiliation', 'district', 'area']}
              filterFields={['status', 'district']}
              uniqueFieldValues={{
                district: uniqueDistricts
              }}
            />
          </div>

        {/* Main Content Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border-0">

          {/* Error State */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading mosque fund applications...</p>
              </div>
            </div>
          )}

          {/* Mosque Fund List */}
          {!loading && !error && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#6db14e' }}>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                        Application ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                        Mosque Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-white uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((mosqueFund, index) => (
                      <tr 
                      key={mosqueFund._id || index}
                        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        onClick={() => handleMasjidClick(mosqueFund)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {mosqueFund.trackingId || mosqueFund._id?.slice(-8) || `#${String(index + 1).padStart(3, '0')}`}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {mosqueFund.mosqueName || 'Unknown Mosque'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {mosqueFund.district && mosqueFund.area ? 
                              `${mosqueFund.district}, ${mosqueFund.area}` : 
                              'Not specified'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={getStatusDisplay(mosqueFund.status).className}>
                            {getStatusDisplay(mosqueFund.status).text}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <button className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 transition-colors duration-200 group">
                            <svg className="w-5 h-5 text-green-600 group-hover:text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-12 text-center">
                          <div className="text-gray-400">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                            <p className="text-lg font-medium text-gray-500">No mosque fund applications found</p>
                            <p className="text-sm text-gray-400">No mosque fund applications are available at the moment.</p>
                        </div>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredMosqueFunds.length)} of {filteredMosqueFunds.length} results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            page === currentPage
                              ? 'bg-green-600 text-white border-green-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
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

export default SuperAdminMosqueFundList;
