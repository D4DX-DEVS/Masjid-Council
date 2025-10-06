import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import Home from './pages/Home';
import About from './pages/About';
import AffiliationForm from './pages/AffiliationForm';
import MedicalAidForm from './pages/MedicalAidForm';
import MosqueFundForm from './pages/MosqueFundForm';
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
    '/mosque-list-admin'
  ];

  const superAdminRoutes = [
    '/superadmin-dashboard',
    '/superadmin-affiliation-list',
    '/superadmin-medical-list',
    '/superadmin-mosque-fund-list',
    '/superadmin-affiliation-details',
    '/superadmin-medical-details',
    '/superadmin-mosque-fund-details'
  ];

  const formRoutes = [
    '/affiliation',
    '/medical-aid',
    '/mosque-fund'
  ];

  const isAdminRoute = adminRoutes.includes(location.pathname);
  const isSuperAdminRoute = superAdminRoutes.includes(location.pathname);
  const isFormRoute = formRoutes.includes(location.pathname);
  const isAdminLogin = location.pathname === '/admin-login';
  const isSuperAdminLogin = location.pathname === '/superadmin-login';

  return (
    <>
      {!isAdminLogin && !isSuperAdminLogin && !isFormRoute && (isAdminRoute ? <AdminNavbar /> : isSuperAdminRoute ? null : <Navbar />)}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/affiliation" element={<AffiliationForm />} />
        <Route path="/medical-aid" element={<MedicalAidForm />} />
        <Route path="/mosque-fund" element={<MosqueFundForm />} />
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
