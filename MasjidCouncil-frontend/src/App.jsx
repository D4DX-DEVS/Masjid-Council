import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
// Old hardcoded form pages retired — public routes now use DynamicForm.
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AffiliationFormList from './pages/AffiliationFormList';
import AffiliationFormListAdmin from './pages/AffiliationFormListAdmin';
import AdminHome from './pages/AdminHome';
import MedicalAidDataList from './pages/MedicalAidDataList';
import MedicalAidDataListAdmin from './pages/MedicalAidDataListAdmin';
import MosqueFundList from './pages/MosqueFundList';
import MosqueFundListAdmin from './pages/MosqueFundListAdmin';
import SuperAdminAffiliationList from './pages/SuperAdminAffiliationList';
import SuperAdminMedicalAidList from './pages/SuperAdminMedicalAidList';
import SuperAdminMosqueFundList from './pages/SuperAdminMosqueFundList';
import SuperAdminAffiliationDetails from './pages/SuperAdminAffiliationDetails';
import SuperAdminMedicalAidDetails from './pages/SuperAdminMedicalAidDetails';
import SuperAdminMosqueFundDetails from './pages/SuperAdminMosqueFundDetails';
import KhateebRegistrationList from './pages/KhateebRegistrationList';
import KhateebRegistrationDetails from './pages/KhateebRegistrationDetails';
import MasterDataSetup from './pages/MasterDataSetup';
import DynamicForm from './pages/DynamicForm';
import FormBuilder from './pages/FormBuilder';
import SubmissionList from './pages/SubmissionList';
import SubmissionDetails from './pages/SubmissionDetails';
import AreaAdminHome from './pages/AreaAdminHome';
import AreaAdminSubmissionDetails from './pages/AreaAdminSubmissionDetails';
import SpendingReport from './pages/SpendingReport';


// Helper component to wrap Routes and conditional navbar
const Layout = () => {
  const location = useLocation();

  const adminRoutes = [
    '/affiliation-list',
    '/affiliation-list-admin',
    '/admin-home',
    '/medical-list',
    '/medical-list-admin',
    '/mosque-list',
    '/mosque-list-admin',
    '/khateeb-list-admin',
    '/khateeb-details-admin',
    '/master-data'
  ];

  const superAdminRoutes = [
    '/superadmin-dashboard',
    '/superadmin-affiliation-list',
    '/superadmin-medical-list',
    '/superadmin-mosque-fund-list',
    '/superadmin-affiliation-details',
    '/superadmin-medical-details',
    '/superadmin-mosque-fund-details',
    '/superadmin-khateeb-list',
    '/superadmin-khateeb-details'
  ];

  // Parameterized dashboard routes hide the navbar too
  const adminPrefixes = ['/submissions', '/area-home', '/area-submissions', '/spending-report'];
  const superAdminPrefixes = ['/superadmin-submissions', '/superadmin-form-builder', '/superadmin-spending-report'];

  const isAdminRoute =
    adminRoutes.includes(location.pathname) ||
    adminPrefixes.some((p) => location.pathname.startsWith(p));
  const isSuperAdminRoute =
    superAdminRoutes.includes(location.pathname) ||
    superAdminPrefixes.some((p) => location.pathname.startsWith(p));
  const isAdminLogin = location.pathname === '/admin-login';
  const isSuperAdminLogin = location.pathname === '/superadmin-login';

  return (
    <>
      {!isAdminLogin && !isSuperAdminLogin && !isAdminRoute && !isSuperAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        {/* Public forms now render from admin-configured FormConfigurations */}
        <Route path="/affiliation" element={<DynamicForm formType="affiliation" />} />
        <Route path="/medical-aid" element={<DynamicForm formType="welfarefund" />} />
        <Route path="/mosque-fund" element={<DynamicForm formType="mosquefund" />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/superadmin-dashboard" element={<SuperAdminDashboard />} />
        <Route path="/affiliation-list" element={<AffiliationFormList />} />
        <Route path="/affiliation-list-admin" element={<AffiliationFormListAdmin />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/medical-list" element={<MedicalAidDataList />} />
        <Route path="/medical-list-admin" element={<MedicalAidDataListAdmin />} />
        <Route path="/mosque-list" element={<MosqueFundList />} />
        <Route path="/mosque-list-admin" element={<MosqueFundListAdmin />} />
        <Route path="/superadmin-affiliation-list" element={<SuperAdminAffiliationList />} />
        <Route path="/superadmin-medical-list" element={<SuperAdminMedicalAidList />} />
        <Route path="/superadmin-mosque-fund-list" element={<SuperAdminMosqueFundList />} />
        <Route path="/superadmin-affiliation-details" element={<SuperAdminAffiliationDetails />} />
        <Route path="/superadmin-medical-details" element={<SuperAdminMedicalAidDetails />} />
        <Route path="/superadmin-mosque-fund-details" element={<SuperAdminMosqueFundDetails />} />
        <Route path="/master-data" element={<MasterDataSetup />} />
        <Route path="/khateeb-registration" element={<DynamicForm formType="khateeb" />} />
        <Route path="/khateeb-list-admin" element={<KhateebRegistrationList role="admin" />} />
        <Route path="/khateeb-details-admin" element={<KhateebRegistrationDetails role="admin" />} />
        <Route path="/superadmin-khateeb-list" element={<KhateebRegistrationList role="superadmin" />} />
        <Route path="/superadmin-khateeb-details" element={<KhateebRegistrationDetails role="superadmin" />} />

        {/* Dynamic forms */}
        <Route path="/apply/:formType" element={<DynamicForm />} />
        <Route path="/superadmin-form-builder" element={<FormBuilder role="superadmin" />} />
        <Route path="/submissions/:formType" element={<SubmissionList role="admin" />} />
        <Route path="/submissions/:formType/:id" element={<SubmissionDetails role="admin" />} />
        <Route path="/superadmin-submissions/:formType" element={<SubmissionList role="superadmin" />} />
        <Route path="/superadmin-submissions/:formType/:id" element={<SubmissionDetails role="superadmin" />} />

        {/* Area admin */}
        <Route path="/area-home" element={<AreaAdminHome />} />
        <Route path="/area-submissions/:id" element={<AreaAdminSubmissionDetails />} />

        {/* Spending report */}
        <Route path="/spending-report" element={<SpendingReport role="admin" />} />
        <Route path="/superadmin-spending-report" element={<SpendingReport role="superadmin" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
