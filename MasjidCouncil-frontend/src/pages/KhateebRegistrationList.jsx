import React, { useState, useEffect, useCallback, useMemo } from "react";
import { authHeaders } from '../lib/auth';
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import SuperAdminSidebar from "../components/SuperAdminSidebar";
import SearchFilterControls from "../components/SearchFilterControls";
import PageHeader from "../components/PageHeader";
import Pagination from "../components/Pagination";
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
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
  const filterFields = useMemo(() => ["status", "district", "attending"], []);
  const uniqueFieldValues = useMemo(() => ({ district: uniqueDistricts }), [uniqueDistricts]);
  const filterFieldLabels = useMemo(
    () => ({ status: "Status", district: "District", attending: "Attending" }),
    []
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredRegistrations.slice(startIndex, endIndex);

  const openDetails = (registration) => navigate(detailsPath, { state: { registration } });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <PageHeader
          role={role}
          title="MIRQATH '26 — ഖത്തീബ് സംഗമം രജിസ്ട്രേഷൻ"
          shortTitle="MIRQATH '26"
          titleStyle={{ fontFamily: 'var(--font-ml-title)' }}
          subtitle="Khateeb meet registrations"
          count={loading ? null : filteredRegistrations.length}
          actions={
            <SearchFilterControls
              data={registrations}
              onFilteredDataChange={handleFilteredDataChange}
              searchFields={searchFields}
              filterFields={filterFields}
              uniqueFieldValues={uniqueFieldValues}
              filterFieldLabels={filterFieldLabels}
            />
          }
        />

        <div className="p-4 sm:p-8 pb-24 md:pb-8">

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
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.fullName || 'Unknown'}</p>
                          <StatusBadge status={item.status} />
                        </div>
                        {/* Everything else on one wrapping line keeps the row short */}
                        <p className="mt-0.5 text-xs text-gray-500 truncate">
                          {[item.masjidName, item.district, item.area, item.phone].filter(Boolean).join(' · ') || 'Not specified'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400 truncate">
                          {item.attending === 'yes' ? 'പങ്കെടുക്കും' : 'ഇല്ല'}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="p-8 text-center text-gray-500">No khateeb registrations found</p>
                  )}
                </div>

                {/* Desktop: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead className="bg-[#F7F9FB] border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Khateeb Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Masjid</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Attending</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Action</th>
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
                            <td className="px-4 py-3 max-w-[220px] truncate text-sm text-gray-900" title={item.masjidName || '-'}>{item.masjidName || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {[item.district, item.area].filter(Boolean).join(', ') || 'Not specified'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.phone || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.attending === 'yes' ? 'Yes' : 'No'}</td>
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

                <Pagination
                  page={currentPage}
                  totalItems={filteredRegistrations.length}
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

export default KhateebRegistrationList;
