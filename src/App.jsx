// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './shared/lib/supabase';

// ====================================
// 🌍 Public Pages (หน้าหลักและระบบทั่วไป)
// ====================================
import LandingApp from './apps/landing/LandingApp';
import PortfolioApp from './apps/portfolio/PortfolioApp';
import LandingLinks from './apps/job/views/LandingLinks';
import NotFound from './apps/landing/NotFound';
import PDPAPolicyLA from './apps/job/views/PDPAPolicyLA';
import ShowcaseApp from './apps/landing/ShowcaseApp';
import RoadmapApp from './apps/landing/RoadmapApp';
import GuestbookApp from './apps/landing/GuestbookApp';
import SupportApp from './apps/landing/SupportApp';

// ====================================
// 🔐 Auth & SE-Work System (หน้า Login / Register / Error)
// ====================================
import JobHome from './apps/job/views/Home';
import JobLogin from './apps/job/views/Login';
import Register from './apps/job/views/Register';
import ForgotPassword from './apps/job/views/ForgotPassword';
import Maintenance from './apps/job/views/Maintenance';
import ContactProfile from './apps/job/views/ContactProfile';

// ====================================
// 🛠️ Admin Workspace (ระบบหลังบ้าน)
// ====================================
import AdminLayout from './apps/job/layouts/AdminLayout';
import Dashboard from './apps/job/views/admin/Dashboard';
import Announcements from './apps/job/views/admin/Announcements';
import Assignments from './apps/job/views/admin/Assignments';
import Schedules from './apps/job/views/admin/Schedules';
import Subjects from './apps/job/views/admin/Subjects';
import SubmissionLinks from './apps/job/views/admin/SubmissionLinks';
import SubmissionTracking from './apps/job/views/admin/SubmissionTracking';
import Leaderboard from './apps/job/views/admin/Leaderboard';
import Users from './apps/job/views/admin/Users';
import AdminContacts from './apps/job/views/admin/AdminContacts';
import Semesters from './apps/job/views/admin/Semesters';
import ExportData from './apps/job/views/admin/ExportData';
import Profile from './apps/job/views/admin/Profile';
import InternalLink from './apps/job/views/admin/InternalLink';
import ResourceCenter from './apps/job/views/admin/ResourceCenter';
import SheetData from './apps/job/views/admin/SheetData';

// ====================================
// 🛡️ Protected Route Wrapper
// ====================================
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-black">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-zinc-800 border-t-[#0071e3] dark:border-t-[#0071e3]"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/sework/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Public Routes */}
        <Route path="/" element={<LandingApp />} />
        <Route path="/portfolio" element={<PortfolioApp />} />
        <Route path="/showcase" element={<ShowcaseApp />} />
        <Route path="/roadmap" element={<RoadmapApp />} />
        <Route path="/guestbook" element={<GuestbookApp />} />
        <Route path="/support" element={<SupportApp />} />
        
        <Route path="/links" element={<LandingLinks />} />
        <Route path="/pdpa" element={<PDPAPolicyLA />} />
        <Route path="/legal" element={<PDPAPolicyLA />} />

        {/* 2. SE-Work Core Routes */}
        <Route path="/sework">
          <Route index element={<JobHome />} /> 
          <Route path="login" element={<JobLogin />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="contact-profile" element={<ContactProfile />} />

          {/* 3. SE-Work Admin Workspace */}
          <Route path="admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="schedules" element={<Schedules />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="submission-links" element={<SubmissionLinks />} />
            <Route path="submission-tracking" element={<SubmissionTracking />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="users" element={<Users />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="semesters" element={<Semesters />} />
            <Route path="export" element={<ExportData />} />
            <Route path="profile" element={<Profile />} />
            <Route path="internal-links" element={<InternalLink />} />
            <Route path="resource-center" element={<ResourceCenter />} />
            <Route path="sheet-data" element={<SheetData />} />
          </Route>
        </Route>

        {/* 4. 404 Error Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}