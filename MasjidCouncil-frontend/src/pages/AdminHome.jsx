import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, FileText, Heart, Building2, AlertCircle, CalendarDays, ArrowRight } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import { StatCardsSkeleton, SkeletonBar } from "../components/Skeleton";
import PageHeader from "../components/PageHeader";
import { cachedJson, peekJson } from "../lib/apiCache";
import { C, cardShadow, timeAgo, statusBadge, TrendChart, DonutChart, StatusLegend } from "../components/DashboardCharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const EMPTY = { total: 0, pending: 0, approved: 0, rejected: 0 };

const AdminHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    affiliation: EMPTY, medical: EMPTY, mosque: EMPTY, khateeb: EMPTY
  });
  const [loading, setLoading] = useState(() => peekJson(`${API_BASE_URL}/api/mosqueAffiliation/all`) === undefined);
  const [error, setError] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);

  useEffect(() => {
    fetchDashboard();
    loadAdminInfo();
  }, []);

  const loadAdminInfo = () => {
    try {
      const adminData = localStorage.getItem('adminUser');
      if (adminData) setAdminInfo(JSON.parse(adminData));
    } catch (error) {
      console.error('Error loading admin info:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const affiliationData = await cachedJson(`${API_BASE_URL}/api/mosqueAffiliation/all`);
      const medicalData = await cachedJson(`${API_BASE_URL}/api/welfarefund/all`);
      const mosqueData = await cachedJson(`${API_BASE_URL}/api/mosqueFund/all`);
      const khateebData = await cachedJson(`${API_BASE_URL}/api/khateebRegistration/all`);

      const count = (data) => ({
        total: data.data?.length || 0,
        pending: data.data?.filter(item => item.status === 'pending').length || 0,
        approved: data.data?.filter(item => item.status === 'approved').length || 0,
        rejected: data.data?.filter(item => item.status === 'rejected').length || 0
      });

      setStats({
        affiliation: count(affiliationData),
        medical: count(medicalData),
        mosque: count(mosqueData),
        khateeb: count(khateebData)
      });

      const all = [
        ...(affiliationData.data || []).map(item => ({ ...item, type: 'affiliation' })),
        ...(medicalData.data || []).map(item => ({ ...item, type: 'medical' })),
        ...(mosqueData.data || []).map(item => ({ ...item, type: 'mosque' })),
        ...(khateebData.data || []).map(item => ({ ...item, type: 'khateeb' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllSubmissions(all);
      setRecentSubmissions(all.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeDisplay = (type) => ({
    affiliation: { text: 'Affiliation', color: C.blue, bg: '#EFF6FF', icon: FileText },
    medical: { text: 'Welfare Fund', color: C.green2, bg: C.greenSoft, icon: Heart },
    mosque: { text: 'Masjid Fund', color: C.purple, bg: '#F5F3FF', icon: Building2 },
    khateeb: { text: "Mirqath '26", color: C.orange, bg: '#FFF7ED', icon: CalendarDays }
  }[type] || { text: 'Affiliation', color: C.blue, bg: '#EFF6FF', icon: FileText });

  const kpiCards = [
    { key: 'affiliation', title: 'Masjid Affiliation', icon: FileText, color: C.green2, bg: C.greenSoft, to: '/affiliation-list-admin' },
    { key: 'medical', title: 'Welfare Fund', icon: Heart, color: C.blue, bg: '#EFF6FF', to: '/medical-list-admin' },
    { key: 'mosque', title: 'Masjid Fund', icon: Building2, color: C.purple, bg: '#F5F3FF', to: '/mosque-list-admin' },
    { key: 'khateeb', title: "Mirqath '26", icon: CalendarDays, color: C.orange, bg: '#FFF7ED', to: '/khateeb-list-admin' }
  ];

  const monthlyCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    const year = new Date().getFullYear();
    allSubmissions.forEach(s => {
      const d = new Date(s.createdAt);
      if (d.getFullYear() === year) counts[d.getMonth()]++;
    });
    return counts;
  }, [allSubmissions]);

  const agg = useMemo(() => {
    const keys = ['affiliation', 'medical', 'mosque', 'khateeb'];
    return {
      approved: keys.reduce((n, k) => n + stats[k].approved, 0),
      pending: keys.reduce((n, k) => n + stats[k].pending, 0),
      rejected: keys.reduce((n, k) => n + stats[k].rejected, 0)
    };
  }, [stats]);

  // Keep the shell (and the mobile footer menu) mounted while data loads
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          <div className="p-4 sm:p-8 pb-24 md:pb-8">
            <StatCardsSkeleton />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SkeletonBar className="h-48 w-full rounded-2xl" />
              <SkeletonBar className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <AdminSidebar />

      <div className="flex-1 min-w-0">
        <PageHeader
          role="admin"
          title={`Welcome back, ${adminInfo?.username || 'Admin'} 👋`}
          shortTitle=""
          subtitle={adminInfo?.district ? `${adminInfo.district} district` : 'Masjid Council Kerala'}
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* KPI cards */}
          {/* ponytail: xl: not lg: — fixed sidebar eats the viewport, content box is only ~744px at lg */}
          <div className="grid grid-cols-2 xl:grid-cols-12 gap-3 sm:gap-6 mb-8">
            {kpiCards.map(({ key, title, icon: Icon, color, bg, to }) => (
              <button
                key={key}
                onClick={() => navigate(to)}
                className="group xl:col-span-3 text-left bg-white rounded-2xl border border-[#E5E7EB] p-3.5 sm:p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={cardShadow}
              >
                <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
                <div className="flex items-center gap-2.5 sm:gap-3.5 mb-2.5 sm:mb-3.5">
                  <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-[12px] xl:text-[13px] font-medium text-[#6B7280] leading-tight">{title}</h3>
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight leading-none" style={{ color }}>
                      {stats[key].total}
                    </span>
                  </div>
                  <ArrowRight className="hidden sm:block w-4 h-4 ml-auto text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] sm:text-[11px] 2xl:text-[12px] border-t border-gray-100 pt-2.5 sm:pt-3">
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[#6B7280]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />{stats[key].pending}<span className="hidden sm:inline"> pending</span>
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[#6B7280]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D4F] flex-shrink-0" />{stats[key].approved}<span className="hidden sm:inline"> approved</span>
                  </span>
                  <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[#6B7280]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{stats[key].rejected}<span className="hidden sm:inline"> rejected</span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Analytics — asymmetric 8/4 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            <div className="xl:col-span-8 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8" style={cardShadow}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#111827] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2E7D4F]" />
                  Applications Trend
                </h2>
                <span className="text-xs font-medium text-[#6B7280] border border-[#E5E7EB] rounded-full px-3 py-1.5 bg-white">
                  This Year
                </span>
              </div>
              <TrendChart counts={monthlyCounts} />
            </div>

            <div className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 flex flex-col" style={cardShadow}>
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Status Distribution</h2>
              {/* ponytail: wrap — legend drops under the donut on a narrow card instead of spilling out */}
              <div className="flex flex-wrap items-center justify-center gap-6 flex-1">
                <DonutChart {...agg} />
                <StatusLegend {...agg} />
              </div>
            </div>
          </div>

          {/* ponytail: profile card dropped — the header's profile menu already carries name/district */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6" style={cardShadow}>
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Recent Submissions</h2>
              {recentSubmissions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentSubmissions.map((submission, index) => {
                    const typeInfo = getTypeDisplay(submission.type);
                    const TypeIcon = typeInfo.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                        <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: typeInfo.bg }}>
                          <TypeIcon className="w-5 h-5" style={{ color: typeInfo.color }} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#111827] text-sm truncate">
                            {submission.name || submission.mosqueName || submission.fullName || 'Unknown'}
                          </p>
                          <span className={`inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge(submission.status)}`}>
                            {submission.status}
                          </span>
                        </div>
                        <span className="text-xs text-[#6B7280] flex-shrink-0">{timeAgo(submission.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6B7280]">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent submissions</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
