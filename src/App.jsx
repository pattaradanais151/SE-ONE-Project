// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// ====================================
// 📥 นำเข้า Component (อ้างอิงตามโครงสร้างโฟลเดอร์จริง)
// ====================================

// โซน Landing & Portfolio
import LandingApp from './apps/landing/LandingApp';
import PortfolioApp from './apps/portfolio/PortfolioApp';

// โซนระบบ SE-JOB (แก้ Path ให้ชี้ไปที่โฟลเดอร์ views)
import JobHome from './apps/job/views/Home';
import JobLogin from './apps/job/views/Login';

// ====================================
// 🔐 ระบบ Protected Route (จำลองการเช็กสิทธิ์)
// ====================================
const ProtectedRoute = ({ children }) => {
  // TODO: เปลี่ยนเป็นเช็ก Token จาก Supabase จริงๆ
  const isAuthenticated = localStorage.getItem('supabase.auth.token'); 
  
  if (!isAuthenticated) {
    // ถ้ายังไม่ได้ล็อกอิน ให้เด้งกลับไปหน้า Login
    return <Navigate to="/job/login" replace />;
  }
  return children;
};

// ====================================
// 🚀 Main Router
// ====================================
export default function App() {
  return (
    <Router>
      <Routes>
        
        {/* ------------------------------------
            1. โซนเว็บหลัก (Root)
            ------------------------------------ */}
        <Route path="/" element={<LandingApp />} />
        
        {/* ถ้ามีหน้า Policy ให้สร้างไฟล์และเอาคอมเมนต์ออก */}
        {/* <Route path="/policy" element={<PolicyPage />} /> */}

        {/* ------------------------------------
            2. โซน Portfolio
            ------------------------------------ */}
        <Route path="/portfolio" element={<PortfolioApp />} />

        {/* ------------------------------------
            3. โซนระบบ SE-JOB
            ------------------------------------ */}
        {/* 
            เนื่องจากคุณยังไม่มีไฟล์ JobLayout 
            ตอนนี้เราจะปล่อยให้มัน Route เข้าหน้าตรงๆ ไปก่อน 
        */}
        <Route path="/job">
          <Route index element={<JobHome />} /> {/* ตรงกับ seone.site/job */}
          <Route path="login" element={<JobLogin />} /> {/* ตรงกับ seone.site/job/login */}
          
          {/* ตัวอย่างหน้า Admin (ตอนนี้ยังไม่มีไฟล์ ให้เป็น div ไปก่อน) */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute>
                <div className="p-10 text-2xl font-bold">Admin Dashboard (Protected)</div>
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* ------------------------------------
            4. Error Page (ไม่พบหน้า)
            ------------------------------------ */}
        {/* ถ้าคุณยังไม่มีไฟล์ NotFound.jsx ให้แสดงเป็น div แทน */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-3xl font-bold">
              404 - Page Not Found
            </div>
          } 
        />

      </Routes>
    </Router>
  );
}