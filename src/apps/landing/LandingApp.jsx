// src/apps/landing/LandingApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, ChevronRight, Briefcase, Code, Terminal, ArrowUpRight } from 'lucide-react';
import 'animate.css';

// ==========================================
// 🎨 Emotion Animations (Apple-style smooth reveals)
// ==========================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const textClip = keyframes`
  to { background-position: 200% center; }
`;

export default function LandingApp() {
  const navigate = useNavigate();
  // ค่าเริ่มต้น Dark Mode เป็น true ตามดีไซน์
  const [isDark, setIsDark] = useState(true); 

  // ------------------------------------------
  // 🛡️ ระบบป้องกันระดับสูงสุด (Anti-Copy / Anti-Inspect)
  // ------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // บล็อกคีย์ลัดต่างๆ (F12, Ctrl+Shift+I ฯลฯ)
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ------------------------------------------
  // 🌓 ระบบจัดการ Dark/Light Mode ที่เสถียร
  // ------------------------------------------
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const preventAll = (e) => e.preventDefault();

  return (
    <div 
      onContextMenu={preventAll}
      onCopy={preventAll}
      onCut={preventAll}
      onDragStart={preventAll}
      className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-[#0071e3] selection:text-white transition-colors duration-500 overflow-x-hidden select-none"
    >
      <style>{`
        /* Custom Scrollbar Apple Style */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
      `}</style>
      
      {/* ------------------------------------------
          🍎 Global Navbar (Apple Glassmorphism)
          ------------------------------------------ */}
      <nav className="fixed top-0 w-full h-[52px] bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-200/50 dark:border-white/10 z-50 transition-colors duration-500">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-6">
            {/* โลโก้แอปที่ดึงมาจากไฟล์ */}
            <div className="cursor-pointer shrink-0 flex items-center justify-center" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
              <div className="w-8 h-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-sm transition-transform hover:scale-105">
                <img 
                  src="/logo.png" 
                  alt="SE Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
            </div>
            
            <span className="hidden sm:inline cursor-pointer hover:text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>SE Workspace</span>
            <span className="hidden sm:inline cursor-pointer hover:text-[#0071e3] transition-colors" onClick={() => navigate('/portfolio')}>Portfolio</span>
            <span className="hidden sm:inline cursor-pointer hover:text-[#0071e3] transition-colors" onClick={() => navigate('/sework')}>Job System</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="hover:opacity-70 transition-opacity outline-none p-1">
              {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
            </button>
            <button 
              onClick={() => navigate('/sework/login')}
              className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full hover:scale-95 transition-transform font-bold"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------
          🍎 Hero Section (iPhone Pro Style)
          ------------------------------------------ */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-20 pb-10 text-center overflow-hidden">
        <div className={`z-10 px-4 ${css`animation: ${fadeInUp} 1.2s cubic-bezier(0.16, 1, 0.3, 1);`}`}>
          <h2 className="text-[#86868b] dark:text-[#a1a1a6] text-lg sm:text-2xl font-semibold tracking-tight mb-2">
            Software Engineering Gen 4
          </h2>
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-bold tracking-tighter leading-none mb-6">
            Pro.<br/>
            <span className={`text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] via-indigo-500 to-purple-600 bg-[200%_auto] ${css`animation: ${textClip} 4s linear infinite;`}`}>
              Everywhere.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[#1d1d1f] dark:text-[#f5f5f7] font-medium tracking-tight max-w-2xl mx-auto mb-10 opacity-90">
            ระบบจัดการการเรียน และ พอร์ตโฟลิโอส่วนตัว<br className="hidden sm:block"/> 
            ออกแบบใหม่หมดจด ทรงพลังกว่าที่เคย
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-lg font-medium">
            <button 
              onClick={() => navigate('/sework')}
              className="bg-[#0071e3] text-white px-8 py-3.5 rounded-full hover:bg-[#0077ED] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
            >
              เข้าสู่ระบบ SE-Job <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/portfolio')}
              className="text-[#0071e3] hover:underline flex items-center justify-center gap-2 group"
            >
              ดู Portfolio <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Subtle Background Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      </section>

      {/* ------------------------------------------
          🍎 Grid Features (iPad Pro Style)
          ------------------------------------------ */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        
        {/* Box 1: SE Job System */}
        <div 
          onClick={() => navigate('/sework')}
          className="group cursor-pointer bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-10 sm:p-14 h-[500px] flex flex-col justify-between overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:scale-[1.02] transition-transform duration-500"
        >
          <div className="relative z-10">
            <Briefcase className="w-10 h-10 mb-6 text-[#1d1d1f] dark:text-white" />
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">SE Job System.</h3>
            <p className="text-[#86868b] dark:text-[#a1a1a6] text-lg font-medium leading-relaxed">จัดการตารางเรียน ส่งงาน และประกาศ<br/> จบครบในที่เดียว</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-[#0071e3] font-medium text-lg mt-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            เริ่มต้นใช้งาน <ChevronRight className="w-5 h-5" />
          </div>

          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-[#0071e3]/20 to-blue-500/0 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        {/* Box 2: Portfolio */}
        <div 
          onClick={() => navigate('/portfolio')}
          className="group cursor-pointer bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-10 sm:p-14 h-[500px] flex flex-col justify-between overflow-hidden relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:scale-[1.02] transition-transform duration-500"
        >
          <div className="relative z-10">
            <Code className="w-10 h-10 mb-6 text-[#1d1d1f] dark:text-white" />
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Dev Portfolio.</h3>
            <p className="text-[#86868b] dark:text-[#a1a1a6] text-lg font-medium leading-relaxed">รวบรวมผลงาน เทคโนโลยีที่ใช้<br/>และทักษะตลอด 4 ปี</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-[#0071e3] font-medium text-lg mt-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            สำรวจผลงาน <ChevronRight className="w-5 h-5" />
          </div>

          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/0 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>

        {/* Box 3: Terminal Full width */}
        <div className="md:col-span-2 bg-[#1d1d1f] dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-[2rem] p-10 sm:p-14 flex flex-col md:flex-row items-center justify-between overflow-hidden relative shadow-2xl mt-6 group hover:scale-[1.01] transition-transform duration-500">
          <div className="relative z-10 max-w-lg mb-8 md:mb-0">
            <Terminal className="w-10 h-10 mb-6 text-white" />
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-white">Engineered for SE.</h3>
            <p className="text-[#a1a1a6] text-lg font-medium leading-relaxed">พัฒนาด้วย React, Tailwind v4, Emotion, และ Supabase <br className="hidden lg:block"/> ประสิทธิภาพระดับโปร พร้อม Real-time Sync.</p>
          </div>
          <div className="relative z-10 text-white font-mono text-sm bg-black/50 dark:bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-md w-full md:w-auto shadow-inner">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <p className="text-emerald-400">~ $ system_status</p>
            <p className="text-gray-300">&gt; Engine: React Vite</p>
            <p className="text-gray-300">&gt; Database: Supabase Connected</p>
            <p className="text-gray-300">&gt; Security: Anti-Inspect Active</p>
            <p className="text-[#0071e3] font-bold mt-2">All systems operational.</p>
          </div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#0071e3]/10 to-transparent pointer-events-none"></div>
        </div>

      </section>

      {/* ------------------------------------------
          🍎 Footer (Apple Style Minimalist)
          ------------------------------------------ */}
      <footer className="w-full bg-[#fbfbfd] dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-16 transition-colors duration-500 relative z-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-[#86868b] dark:text-[#a1a1a6] text-xs pb-4 border-b border-gray-200 dark:border-white/10">
            * ซอร์สโค้ดและดีไซน์นี้ถูกออกแบบและพัฒนาเพื่อการใช้งานภายในสาขาวิชา ไม่อนุญาตให้คัดลอกหรือทำซ้ำ
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-xs text-[#86868b] dark:text-[#a1a1a6] font-medium tracking-wide">
            <p>Copyright © {new Date().getFullYear()} Pattaradanai Saiwongkham. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span onClick={() => navigate('/pdpa')} className="hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span onClick={() => navigate('/pdpa')} className="border-l border-gray-400 dark:border-gray-700 pl-4 hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">Terms of Use</span>
              <span onClick={() => navigate('/pdpa')} className="border-l border-gray-400 dark:border-gray-700 pl-4 hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">PDPA</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}