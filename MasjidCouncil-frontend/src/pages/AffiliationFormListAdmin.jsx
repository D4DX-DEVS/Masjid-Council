import React, { useState, useEffect, useCallback, useMemo } from "react";
import { authHeaders } from '../lib/auth';
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import SearchFilterControls from "../components/SearchFilterControls";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
import { ListSkeleton } from "../components/Skeleton";
import MobileRecordCards from "../components/MobileRecordCards";
import { cachedJson, peekJson } from "../lib/apiCache";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AffiliationFormListAdmin = () => {
  const navigate = useNavigate();
  const [affiliations, setAffiliations] = useState([]);
  const [filteredAffiliations, setFilteredAffiliations] = useState([]);
  const [loading, setLoading] = useState(() => peekJson(`${API_BASE_URL}/api/mosqueAffiliation/all`) === undefined);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAffiliations();
  }, []);

  // Handle filtered data from SearchFilterControls
  const handleFilteredDataChange = useCallback((filteredData) => {
    setFilteredAffiliations(filteredData);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const fetchAffiliations = async () => {
    try {
      const data = await cachedJson(`${API_BASE_URL}/api/mosqueAffiliation/all`, { headers: authHeaders() });
      if (data.success) {
        setAffiliations(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch affiliations');
      }
    } catch (error) {
      console.error('Fetch affiliations error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMasjidClick = (affiliation) => {
    // Navigate to detailed view with affiliation data
    navigate("/affiliation-list", { state: { affiliation } });
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
  const uniqueDistricts = useMemo(
    () =>
      [
        ...new Set(
          affiliations
            .map((affiliation) =>
              affiliation.address && affiliation.address[0]
                ? affiliation.address[0].district
                : null
            )
            .filter(Boolean)
        ),
      ],
    [affiliations]
  );

  // Memoize SearchFilterControls props to avoid infinite update loops
  const searchFields = useMemo(
    () => [
      "name",
      "affiliationNumber",
      "trackingId",
      "address.0.district",
      "jamathArea.0.area",
    ],
    []
  );
  const filterFields = useMemo(() => ["status", "address.0.district"], []);
  const uniqueFieldValues = useMemo(
    () => ({
      "address.0.district": uniqueDistricts,
    }),
    [uniqueDistricts]
  );
  const filterFieldLabels = useMemo(
    () => ({
      status: "Status",
      "address.0.district": "District",
    }),
    []
  );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAffiliations.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      
      <div className="flex-1 min-w-0">
        <PageHeader
          role="admin"
          title="Affiliation"
          subtitle="Mosque affiliation applications in your district"
          count={loading ? null : filteredAffiliations.length}
          actions={
            <SearchFilterControls
              data={affiliations}
              onFilteredDataChange={handleFilteredDataChange}
              searchFields={searchFields}
              filterFields={filterFields}
              uniqueFieldValues={uniqueFieldValues}
              filterFieldLabels={filterFieldLabels}
            />
            }
        />

        <div className="p-4 sm:p-8 pb-24 md:pb-8">

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
          {loading && <ListSkeleton />}

          {/* Mosque List */}
          {!loading && !error && (
            <div>
              <MobileRecordCards
                items={currentData}
                onSelect={handleMasjidClick}
                title={(item) => item.name || 'Unknown Mosque'}
                id={(item, i) => item.status === 'approved' ? (item.affiliationNumber || `#${String(i + 1).padStart(3, '0')}`) : (item.trackingId || item.affiliationNumber || `#${String(i + 1).padStart(3, '0')}`)}
                meta={(item) => item.address && item.address[0] ? `${item.address[0].district || ''}, ${item.jamathArea && item.jamathArea[0] ? item.jamathArea[0].area : ''}` : 'Not specified'}
                status={(item) => (
                    <span className={getStatusDisplay(item.status).className}>
                      {getStatusDisplay(item.status).text}
                    </span>
                  )}
                empty="No affiliation applications found"
              />

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-[#F7F9FB] border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Application ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Mosque Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.length > 0 ? (
                    currentData.map((affiliation, index) => (
                      <tr 
                      key={affiliation._id || index}
                        className={`hover:bg-gray-50 cursor-pointer ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                        onClick={() => handleMasjidClick(affiliation)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {affiliation.status === 'approved' 
                              ? affiliation.affiliationNumber || `#${String(index + 1).padStart(3, '0')}`
                              : affiliation.trackingId || affiliation.affiliationNumber || `#${String(index + 1).padStart(3, '0')}`
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {affiliation.name || 'Unknown Mosque'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {affiliation.address && affiliation.address[0] ? 
                              `${affiliation.address[0].district || ''}, ${affiliation.jamathArea && affiliation.jamathArea[0] ? affiliation.jamathArea[0].area : ''}` : 
                              'Not specified'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={getStatusDisplay(affiliation.status).className}>
                            {getStatusDisplay(affiliation.status).text}
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
                            <p className="text-lg font-medium text-gray-500">No affiliations found</p>
                            <p className="text-sm text-gray-400">No mosque affiliation applications are available at the moment.</p>
                        </div>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
              
              <Pagination
                page={currentPage}
                totalItems={filteredAffiliations.length}
                pageSize={itemsPerPage}
                onChange={setCurrentPage}
              />
            </div>
          )}

        </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliationFormListAdmin;