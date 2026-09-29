// src/apps/landing/AboutApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, Info, Users, Target, Code2, ArrowRight } from 'lucide-react';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function AboutApp() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const preventAll = (e) => e.preventDefault();

  return (
    <div 
      onContextMenu={preventAll} onCopy={preventAll} onCut={preventAll}
      className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-[#0071e3] selection:text-white transition-colors duration-500 overflow-x-hidden select-none flex flex-col"
    >
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
      `}</style>
      
      {/* ------------------------------------------
          🍎 Global Navbar
          ------------------------------------------ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        
        {/* Announcement Bar */}
        <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SE-ONE.SITE Workspace v2.0 is now live. Experience the new Pro performance.
          <span onClick={() => navigate('/code')} className="text-[#0071e3] hover:underline flex items-center gap-0.5 ml-2 font-bold cursor-pointer">
            Learn more <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Main Bar */}
        <div className="max-w-[1200px] mx-auto h-[54px] px-4 flex items-center justify-between text-xs font-bold tracking-wide relative">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-sm hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight hidden sm:block">SE-ONE.SITE<span className="text-[#0071e3]">.</span></span>
          </div>
          
          <div className="hidden lg:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2 w-max">
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/')}>Home</span>
            <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>About</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/portfolio')}>Talents</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/showcase')}>Projects</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/guestbook')}>Guestbook</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] transition-colors" onClick={() => navigate('/support')}>Support</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => navigate('/sework/login')} className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full hover:scale-95 transition-transform shadow-md font-bold">
              Job System
            </button>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------
          🍎 Hero Section
          ------------------------------------------ */}
      <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-24 text-center overflow-hidden flex-1">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <div className={`z-10 px-4 max-w-4xl mx-auto ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <Info className="w-4 h-4" /> About SE Gen 4
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
            We are <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[#0071e3]">Software Engineers.</span>
          </h1>
          <p className="text-lg text-[#86868b] dark:text-[#a1a1a6] font-medium max-w-2xl mx-auto mb-10">
            วิศวกรรมซอฟต์แวร์ มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา (เชียงใหม่) รุ่นที่ 4 เราคือกลุ่มคนรุ่นใหม่ที่หลงใหลในการเขียนโค้ด สร้างสรรค์นวัตกรรม และแก้ปัญหาด้วยเทคโนโลยี
          </p>
        </div>

        {/* Info Cards */}
        <div className="max-w-[1200px] mx-auto px-6 pb-20 relative z-10 mt-12 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-sm hover:-translate-y-2 transition-transform">
              <Target className="w-10 h-10 text-[#0071e3] mb-6" />
              <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-white">Our Vision</h3>
              <p className="text-zinc-500 dark:text-zinc-400">มุ่งมั่นสร้างสรรค์ซอฟต์แวร์ที่มีคุณภาพ ตอบโจทย์ผู้ใช้งาน และผลักดันเทคโนโลยีใหม่ๆ ให้เกิดขึ้นจริงในอุตสาหกรรม</p>
            </div>
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-sm hover:-translate-y-2 transition-transform">
              <Code2 className="w-10 h-10 text-purple-500 mb-6" />
              <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-white">Core Skills</h3>
              <p className="text-zinc-500 dark:text-zinc-400">เชี่ยวชาญทั้ง Frontend, Backend, Database และ DevOps พร้อมลุยทุกโปรเจกต์ด้วยสแต็คเทคโนโลยีที่ทันสมัยที่สุด</p>
            </div>
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-sm hover:-translate-y-2 transition-transform">
              <Users className="w-10 h-10 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-black mb-3 text-zinc-900 dark:text-white">Community</h3>
              <p className="text-zinc-500 dark:text-zinc-400">เราเรียนรู้ร่วมกัน แบ่งปันความรู้ และเติบโตไปด้วยกันในฐานะครอบครัว SE Gen 4 ที่แข็งแกร่ง</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------
          🍎 Footer 
          ------------------------------------------ */}
      <footer className="w-full bg-[#fbfbfd] dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-16 transition-colors duration-500 relative z-20 mt-auto">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[#86868b] dark:text-[#a1a1a6] font-medium tracking-wide">
            <p>Copyright © {new Date().getFullYear()} Pattaradanai Saiwongkham. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span onClick={() => navigate('/pdpa')} className="hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}