import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle,
  FileText,
  Heart,
  Building2,
  Users,
  User,
  CalendarDays,
  ArrowRight,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SuperAdminSidebar from '../components/SuperAdminSidebar';
import { StatCardsSkeleton } from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import { cachedJson, peekJson } from "../lib/apiCache";
import SelectField from '../components/SelectField';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const readSuperAdminName = () => {
  try {
    return JSON.parse(localStorage.getItem('superAdminUser') || '{}').username || 'Super Admin';
  } catch {
    return 'Super Admin';
  }
};

/* Design tokens from the redesign spec */
const C = {
  green: '#1F6B3A',
  green2: '#2E7D4F',
  greenSoft: '#EAF6EF',
  text: '#111827',
  sub: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  warning: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316'
};
const cardShadow = { boxShadow: '0 6px 24px rgba(0,0,0,.06)' };

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(date).toLocaleDateString('en-GB');
};

/* Smooth cubic path through monthly points */
const buildLinePath = (pts) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TrendChart = ({ counts }) => {
  const W = 640, H = 200, PAD = 28;
  const max = Math.max(4, ...counts);
  const pts = counts.map((v, i) => [
    PAD + (i * (W - PAD * 2)) / 11,
    H - PAD - (v / max) * (H - PAD * 2)
  ]);
  const line = buildLinePath(pts);
  const area = `${line} L ${pts[pts.length - 1][0]} ${H - PAD} L ${pts[0][0]} ${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} className="w-full h-auto" role="img" aria-label="Applications per month">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green2} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.green2} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={PAD} x2={W - PAD} y1={H - PAD - t * (H - PAD * 2)} y2={H - PAD - t * (H - PAD * 2)}
          stroke={C.border} strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke={C.green2} strokeWidth="2.5" strokeLinecap="round" />
      {MONTHS.map((m, i) => (
        <text key={m} x={pts[i][0]} y={H + 8} textAnchor="middle" fontSize="11" fill={C.sub}>{m}</text>
      ))}
    </svg>
  );
};

const DonutChart = ({ approved, pending, rejected }) => {
  const total = approved + pending + rejected || 1;
  const R = 54, CIRC = 2 * Math.PI * R;
  const segs = [
    { v: approved, color: C.green2 },
    { v: pending, color: C.warning },
    { v: rejected, color: C.danger }
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36 flex-shrink-0" role="img" aria-label="Status distribution">
      {segs.map((s, i) => {
        const len = (s.v / total) * CIRC;
        const el = (
          <circle key={i} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="18"
            strokeDasharray={`${len} ${CIRC - len}`} strokeDashoffset={-offset}
            transform="rotate(-90 70 70)" />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill={C.text}>{approved + pending + rejected}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill={C.sub}>Total</text>
    </svg>
  );
};

const PAGE_SIZE = 10;

const SuperAdminDashboard = () => {
  const superAdminName = readSuperAdminName();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(() => peekJson(`${API_BASE_URL}/api/mosqueAffiliation/all`) === undefined);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    affiliation: { total: 0, pending: 0, approved: 0, rejected: 0 },
    medicalAid: { total: 0, pending: 0, approved: 0, rejected: 0 },
    mosqueFund: { total: 0, pending: 0, approved: 0, rejected: 0 },
    khateeb: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });
  const [statsLoading, setStatsLoading] = useState(() => peekJson(`${API_BASE_URL}/api/mosqueAffiliation/all`) === undefined);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [recentAdmins, setRecentAdmins] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    password: '',
    district: '',
    area: ''
  });

  const [districts, setDistricts] = useState([]);
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
      navigate('/superadmin-login');
      return;
    }
    fetchAdmins();
    fetchStatistics();
    fetchRecentSubmissions();
  }, [navigate]);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/admin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setAdmins(data.data);
        const sortedAdmins = [...data.data].sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 3);
        setRecentAdmins(sortedAdmins);
      } else {
        setError(data.message || 'Failed to fetch admins');
      }
    } catch (error) {
      console.error('Fetch admins error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);

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
        medicalAid: count(medicalData),
        mosqueFund: count(mosqueData),
        khateeb: count(khateebData)
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      const affiliationData = await cachedJson(`${API_BASE_URL}/api/mosqueAffiliation/all`);
      const medicalData = await cachedJson(`${API_BASE_URL}/api/welfarefund/all`);
      const mosqueData = await cachedJson(`${API_BASE_URL}/api/mosqueFund/all`);
      const khateebData = await cachedJson(`${API_BASE_URL}/api/khateebRegistration/all`);

      const all = [
        ...(affiliationData.data || []).map(item => ({ ...item, type: 'affiliation' })),
        ...(medicalData.data || []).map(item => ({ ...item, type: 'medical' })),
        ...(mosqueData.data || []).map(item => ({ ...item, type: 'mosque' })),
        ...(khateebData.data || []).map(item => ({ ...item, type: 'khateeb' }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setAllSubmissions(all);
      setRecentSubmissions(all.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent submissions:', error);
    }
  };

  const fetchDistricts = async () => {
    setLoadingDropdowns(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/districts`);
      const result = await response.json();

      if (result.success && result.districts && Array.isArray(result.districts)) {
        setDistricts(result.districts);
      } else {
        setDistricts(getFallbackDistricts());
      }
    } catch (error) {
      setDistricts(getFallbackDistricts());
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const fetchAreasForDistrict = async (districtId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mosqueAffiliation/external/areas/${districtId}`);
      const result = await response.json();

      if (result.success && result.areas && Array.isArray(result.areas)) {
        setFilteredAreas(result.areas);
        return result.areas;
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
        return fallbackAreas;
      }
    } catch (error) {
      const fallbackAreas = getFallbackAreas();
      setFilteredAreas(fallbackAreas);
      return fallbackAreas;
    }
  };

  const getFallbackDistricts = () => [
    { id: 1, title: 'Kozhikode', name: 'Kozhikode' },
    { id: 2, title: 'Malappuram', name: 'Malappuram' },
    { id: 3, title: 'Kannur', name: 'Kannur' },
    { id: 4, title: 'Kasaragod', name: 'Kasaragod' },
    { id: 5, title: 'Wayanad', name: 'Wayanad' },
    { id: 6, title: 'Thrissur', name: 'Thrissur' },
    { id: 7, title: 'Ernakulam', name: 'Ernakulam' },
    { id: 8, title: 'Kottayam', name: 'Kottayam' },
    { id: 9, title: 'Alappuzha', name: 'Alappuzha' },
    { id: 10, title: 'Pathanamthitta', name: 'Pathanamthitta' },
    { id: 11, title: 'Kollam', name: 'Kollam' },
    { id: 12, title: 'Thiruvananthapuram', name: 'Thiruvananthapuram' },
    { id: 13, title: 'Palakkad', name: 'Palakkad' },
    { id: 14, title: 'Idukki', name: 'Idukki' }
  ];

  const getFallbackAreas = () => [
    { id: 1, title: 'Kozhikode City', name: 'Kozhikode City' },
    { id: 2, title: 'Feroke', name: 'Feroke' },
    { id: 3, title: 'Koyilandy', name: 'Koyilandy' },
    { id: 4, title: 'Vadakara', name: 'Vadakara' },
    { id: 5, title: 'Thiruvambady', name: 'Thiruvambady' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'district') {
      setFormData({
        ...formData,
        district: value,
        area: ''
      });

      const selectedDistrict = districts.find(d =>
        (d.title || d.name) === value
      );

      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
      }
    } else if (name === 'phoneNumber') {
      const phoneNumber = value.replace(/\D/g, '');
      const firstFourDigits = phoneNumber.substring(0, 4);
      const autoPassword = firstFourDigits.length === 4 ? `MCK${firstFourDigits}` : '';

      setFormData({
        ...formData,
        phoneNumber: value,
        password: autoPassword
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let submitData = { ...formData };
    if (!editingAdmin && formData.phoneNumber) {
      const phoneNumber = formData.phoneNumber.replace(/\D/g, '');
      const firstFourDigits = phoneNumber.substring(0, 4);
      if (firstFourDigits.length === 4) {
        submitData.password = `MCK${firstFourDigits}`;
      }
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const url = editingAdmin
        ? `${API_BASE_URL}/api/superadmin/admin/${editingAdmin._id}`
        : `${API_BASE_URL}/api/superadmin/admin`;

      const method = editingAdmin ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(editingAdmin ? 'Admin updated successfully!' : 'Admin created successfully!');
        setShowModal(false);
        setFormData({
          username: '',
          phoneNumber: '',
          password: '',
          district: '',
          area: ''
        });
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('Network error. Please try again.');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      phoneNumber: admin.phoneNumber,
      password: '',
      district: admin.district,
      area: admin.area
    });
    setShowModal(true);
    fetchDistricts();

    if (admin.district) {
      const selectedDistrict = districts.find(d =>
        (d.title || d.name) === admin.district
      );

      if (selectedDistrict && selectedDistrict.id) {
        fetchAreasForDistrict(selectedDistrict.id);
      } else {
        const fallbackAreas = getFallbackAreas();
        setFilteredAreas(fallbackAreas);
      }
    }
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await fetch(`${API_BASE_URL}/api/superadmin/admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Admin deleted successfully!');
        fetchAdmins();
      } else {
        setError(data.message || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Network error. Please try again.');
    }
  };

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      phoneNumber: '',
      password: '',
      district: '',
      area: ''
    });
    setShowModal(true);
    fetchDistricts();
    setFilteredAreas([]);
  };

  const exportAdminsCsv = () => {
    const rows = [
      ['Username', 'Phone Number', 'District', 'Area', 'Created'],
      ...filteredAdmins.map(a => [a.username, a.phoneNumber, a.district, a.area, new Date(a.createdAt).toLocaleDateString('en-GB')])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admins.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAdmins = admins.filter(admin =>
    admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phoneNumber.includes(searchTerm) ||
    admin.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedAdmins = filteredAdmins.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
    const keys = ['affiliation', 'medicalAid', 'mosqueFund', 'khateeb'];
    return {
      approved: keys.reduce((n, k) => n + stats[k].approved, 0),
      pending: keys.reduce((n, k) => n + stats[k].pending, 0),
      rejected: keys.reduce((n, k) => n + stats[k].rejected, 0)
    };
  }, [stats]);

  const getTypeDisplay = (type) => {
    const types = {
      affiliation: { text: 'Affiliation', color: C.blue, bg: '#EFF6FF', icon: FileText },
      medical: { text: 'Welfare Fund', color: C.green2, bg: C.greenSoft, icon: Heart },
      mosque: { text: 'Masjid Fund', color: C.purple, bg: '#F5F3FF', icon: Building2 },
      khateeb: { text: "Mirqath '26", color: C.orange, bg: '#FFF7ED', icon: CalendarDays }
    };
    return types[type] || types.affiliation;
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
      approved: 'bg-[#EAF6EF] text-[#1F6B3A] border border-green-200',
      rejected: 'bg-red-50 text-red-600 border border-red-200'
    };
    return map[status] || 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  const kpiCards = [
    { key: 'affiliation', title: 'Masjid Affiliation', icon: FileText, color: C.green2, bg: C.greenSoft, to: '/superadmin-affiliation-list' },
    { key: 'medicalAid', title: 'Welfare Fund', icon: Heart, color: C.blue, bg: '#EFF6FF', to: '/superadmin-medical-list' },
    { key: 'mosqueFund', title: 'Masjid Fund', icon: Building2, color: C.purple, bg: '#F5F3FF', to: '/superadmin-mosque-fund-list' },
    { key: 'khateeb', title: "Mirqath '26", icon: CalendarDays, color: C.orange, bg: '#FFF7ED', to: '/superadmin-khateeb-list' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F6B3A] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex">
      <SuperAdminSidebar onAddAdmin={openCreateModal} />

      <div className="flex-1 min-w-0">
        <PageHeader
          role="superadmin"
          title={`Welcome back, ${superAdminName} 👋`}
          shortTitle=""
          subtitle="Masjid Council Kerala — full access"
        />

        <div className="p-4 sm:p-8 lg:p-10 pb-24 md:pb-10 max-w-[1440px] mx-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-[#EAF6EF] border border-green-200 text-[#1F6B3A] px-4 py-3 rounded-xl flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {success}
            </div>
          )}

          {/* KPI cards — compact row */}
          {statsLoading && <StatCardsSkeleton />}
          {/* ponytail: xl: not lg: — fixed 280px sidebar eats the viewport, so at lg the content box is only ~744px */}
          <div className={`grid grid-cols-2 xl:grid-cols-12 gap-3 sm:gap-6 mb-8 ${statsLoading ? 'hidden' : ''}`}>
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
                {/* ponytail: wrap + shrink instead of clipping — 3 labelled counts don't fit a ~230px card on one line */}
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

          {/* Analytics — primary focus, asymmetric 8/4 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            {/* Trend */}
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

            {/* Donut */}
            <div className="xl:col-span-4 bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 flex flex-col" style={cardShadow}>
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Status Distribution</h2>
              {/* ponytail: wrap, not min-w-0 — legend drops under the donut when the card is too narrow instead of spilling out */}
              <div className="flex flex-wrap items-center justify-center gap-6 flex-1">
                <DonutChart approved={agg.approved} pending={agg.pending} rejected={agg.rejected} />
                <div className="space-y-3 text-sm flex-1 min-w-[170px]">
                  {[
                    ['Approved', agg.approved, C.green2],
                    ['Pending', agg.pending, C.warning],
                    ['Rejected', agg.rejected, C.danger]
                  ].map(([label, v, color]) => {
                    const total = agg.approved + agg.pending + agg.rejected || 1;
                    return (
                      <div key={label} className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="font-medium text-[#111827]">{label}</span>
                        <span className="text-[#6B7280] whitespace-nowrap ml-auto">{Math.round((v / total) * 100)}% ({v})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Recent row — asymmetric 7/5 */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
            {/* Recent Submissions */}
            <div className="xl:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-6" style={cardShadow}>
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Recent Submissions</h2>
              {recentSubmissions.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentSubmissions.slice(0, 4).map((submission, index) => {
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

            {/* Recent Admins */}
            <div className="xl:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-6" style={cardShadow}>
              <h2 className="text-xl font-semibold text-[#111827] mb-4">Recently Added Admins</h2>
              {recentAdmins.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentAdmins.map((admin, index) => (
                    <div key={index} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                      <span className="w-11 h-11 rounded-full bg-[#EAF6EF] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#1F6B3A]" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#111827] text-sm truncate">{admin.username}</p>
                        <p className="text-xs text-[#6B7280] truncate">{admin.district}{admin.area ? ` · ${admin.area}` : ''}</p>
                      </div>
                      <span className="text-xs text-[#6B7280] flex-shrink-0">
                        {new Date(admin.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6B7280]">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No admins yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Management */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden" style={cardShadow}>
            {/* Toolbar */}
            <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-[#111827] flex items-center gap-2.5 mr-auto">
                <span className="w-9 h-9 rounded-full bg-[#EAF6EF] flex items-center justify-center">
                  <Users style={{ width: 18, height: 18 }} className="text-[#1F6B3A]" />
                </span>
                Admin Management
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admin..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                  className="h-10 w-44 sm:w-56 pl-9 pr-3 border border-[#E5E7EB] rounded-xl text-sm text-[#111827] bg-white focus:outline-none focus:border-[#2E7D4F] focus:ring-2 focus:ring-[#2E7D4F]/15 transition-all"
                />
              </div>
              <button
                onClick={exportAdminsCsv}
                className="h-10 inline-flex items-center gap-2 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#111827] bg-white hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={openCreateModal}
                className="h-10 inline-flex items-center gap-2 px-4 rounded-xl text-sm font-semibold text-white bg-[#1F6B3A] hover:bg-[#2E7D4F] shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Admin</span>
              </button>
            </div>

            {/* Table — desktop/tablet */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="sticky top-0 bg-[#F7F9FB]">
                  <tr>
                    {['Username', 'Phone Number', 'District', 'Area', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedAdmins.map((admin, i) => (
                    <tr key={admin._id} className={`transition-colors hover:bg-[#EAF6EF]/40 ${i % 2 ? 'bg-[#F7F9FB]/50' : 'bg-white'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#111827]">{admin.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{admin.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{admin.district}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#374151]">{admin.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">
                        {new Date(admin.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleEdit(admin)}
                            aria-label={`Edit ${admin.username}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#1F6B3A] bg-[#EAF6EF] hover:bg-green-100 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin._id)}
                            aria-label={`Delete ${admin.username}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile, no horizontal scroll */}
            <div className="sm:hidden divide-y divide-gray-100">
              {pagedAdmins.map((admin) => (
                <div key={admin._id} className="px-4 py-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827] truncate">{admin.username}</p>
                    <p className="text-xs text-[#6B7280] truncate">{admin.phoneNumber}</p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {admin.district}{admin.area ? ` · ${admin.area}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(admin)}
                      aria-label={`Edit ${admin.username}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#1F6B3A] bg-[#EAF6EF] hover:bg-green-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin._id)}
                      aria-label={`Delete ${admin.username}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredAdmins.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-medium text-[#111827] mb-1">No admins found</h3>
                <p className="text-[#6B7280] text-sm">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first admin.'}
                </p>
              </div>
            ) : (
              <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-sm text-[#6B7280]">
                <span>
                  Showing {(safePage - 1) * PAGE_SIZE + 1} to {Math.min(safePage * PAGE_SIZE, filteredAdmins.length)} of {filteredAdmins.length} results
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        n === safePage ? 'bg-[#1F6B3A] text-white' : 'border border-[#E5E7EB] bg-white text-[#111827] hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto p-4">
          <div className="relative mx-auto my-8 w-full max-w-md p-6 rounded-2xl bg-white border border-[#E5E7EB]" style={{ boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#111827]">
                {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
              </h3>
              <p className="text-sm text-[#6B7280] mt-1">
                {editingAdmin ? 'Update the admin account details.' : 'Password is auto-generated from the phone number.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2E7D4F] focus:ring-2 focus:ring-[#2E7D4F]/15 transition-all"
                  placeholder="Enter admin username"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2E7D4F] focus:ring-2 focus:ring-[#2E7D4F]/15 transition-all"
                  placeholder="Enter 10-digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">District</label>
                <SelectField
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  required
                  disabled={loadingDropdowns}
                >
                  <option value="">{loadingDropdowns ? "Loading..." : "Select District"}</option>
                  {Array.isArray(districts) && districts.map((district) => (
                    <option key={district.id || district._id} value={district.title || district.name}>
                      {district.title || district.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">
                  Area {!formData.district && <span className="text-[#6B7280] font-normal">(Select district first)</span>}
                </label>
                <SelectField
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  required
                  disabled={loadingDropdowns || !formData.district}
                >
                  <option value="">
                    {!formData.district ? 'Select district first' : 'Select Area'}
                  </option>
                  {Array.isArray(filteredAreas) && filteredAreas.map((area) => (
                    <option key={area.id || area._id} value={area.title || area.name}>
                      {area.title || area.name}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-10 px-5 border border-[#E5E7EB] rounded-xl text-[#374151] hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#1F6B3A] text-white rounded-xl hover:bg-[#2E7D4F] transition-colors text-sm font-semibold shadow-sm"
                >
                  {editingAdmin ? 'Update Admin' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
