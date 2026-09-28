// src/apps/landing/RoadmapApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, Map, GraduationCap, Loader2, Code, Database, MonitorSmartphone, Server } from 'lucide-react';
import { supabase } from '../../shared/lib/supabase';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function RoadmapApp() {
  const navigate = useNavigate();
  
  // 🌓 บันทึก Theme ลง localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);
  const [roadmapData, setRoadmapData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
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

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const { data, error } = await supabase.from('roadmap').select('*').order('year', { ascending: true }).order('term', { ascending: true });
        if (error) throw error;
        setRoadmapData(data || []);
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmap();
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);
  const preventAll = (e) => e.preventDefault();

  const groupedByYear = roadmapData.reduce((acc, curr) => {
    if (!acc[curr.year]) acc[curr.year] = {};
    if (!acc[curr.year][curr.term]) acc[curr.year][curr.term] = [];
    acc[curr.year][curr.term].push(curr);
    return acc;
  }, {});

  return (
    <div 
      onContextMenu={preventAll} 
      onCopy={preventAll} 
      onCut={preventAll} 
      className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 select-none overflow-x-hidden"
    >
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
      `}</style>
      
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
          <Map className="w-3 h-3 text-emerald-500" /> Roadmap for Software Engineering Journey.
        </div>

        <div className="max-w-[1200px] mx-auto h-[54px] px-4 flex items-center justify-between text-xs font-bold tracking-wide relative">
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <div className="w-9 h-9 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-sm hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight hidden sm:block">SE-ONE.SITE<span className="text-[#0071e3]">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2 w-max">
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/')}>Home</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/portfolio')}>Talents</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/showcase')}>Projects</span>
            <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Roadmap</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/guestbook')}>Guestbook</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/support')}>Support</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={toggleTheme} 
              aria-label="Toggle Theme"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors outline-none text-zinc-600 dark:text-zinc-300"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => navigate('/sework/login')} 
              className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full hover:scale-95 transition-transform shadow-md font-bold"
            >
              Job System
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-10 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10"></div>
        <div className={`max-w-3xl mx-auto px-4 ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6 border border-emerald-200 dark:border-emerald-500/20">
            <Map className="w-4 h-4" /> Developer Journey
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4">SE <span className="text-[#0071e3]">Roadmap.</span></h1>
          <p className="text-lg text-[#86868b] dark:text-[#a1a1a6] font-medium mb-12">เส้นทางการเรียนรู้ตลอดหลักสูตร วิศวกรรมซอฟต์แวร์</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left max-w-4xl mx-auto">
            <div className="bg-white/60 dark:bg-[#121214]/60 border border-gray-200 dark:border-zinc-800 p-5 rounded-[1.5rem] backdrop-blur-md shadow-sm">
              <Code className="w-6 h-6 text-[#0071e3] mb-3" />
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Core Concept</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Algorithms & Data Structures</p>
            </div>
            <div className="bg-white/60 dark:bg-[#121214]/60 border border-gray-200 dark:border-zinc-800 p-5 rounded-[1.5rem] backdrop-blur-md shadow-sm">
              <MonitorSmartphone className="w-6 h-6 text-fuchsia-500 mb-3" />
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Frontend Dev</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">React, Vue, Tailwind CSS</p>
            </div>
            <div className="bg-white/60 dark:bg-[#121214]/60 border border-gray-200 dark:border-zinc-800 p-5 rounded-[1.5rem] backdrop-blur-md shadow-sm">
              <Server className="w-6 h-6 text-emerald-500 mb-3" />
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Backend Dev</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Node.js, APIs, Microservices</p>
            </div>
            <div className="bg-white/60 dark:bg-[#121214]/60 border border-gray-200 dark:border-zinc-800 p-5 rounded-[1.5rem] backdrop-blur-md shadow-sm">
              <Database className="w-6 h-6 text-orange-500 mb-3" />
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1">Data & Systems</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">PostgreSQL, Docker, Cloud</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-32 pt-10">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]" />
          </div>
        ) : Object.keys(groupedByYear).length === 0 ? (
          <div className="text-center py-20 text-zinc-500 bg-white/40 dark:bg-white/5 border border-dashed border-gray-300 dark:border-zinc-800 rounded-[2rem]">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">ยังไม่มีข้อมูล Roadmap ในระบบ</p>
          </div>
        ) : (
          <div className="space-y-16 relative">
            <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-zinc-800 -z-10"></div>
            
            {Object.keys(groupedByYear).sort().map((year) => (
              <div key={year} className="relative z-10">
                <div className="flex items-center justify-start md:justify-center mb-10">
                  <span className="bg-[#0071e3] text-white px-6 py-2 rounded-full font-black text-lg shadow-lg">
                    ชั้นปีที่ {year}
                  </span>
                </div>

                {Object.keys(groupedByYear[year]).sort().map((term) => (
                  <div key={term} className="mb-12">
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6 ml-16 md:ml-0 md:text-center">
                      ภาคเรียนที่ {term}
                    </h3>
                    <div className="space-y-6">
                      {groupedByYear[year][term].map((item, idx) => (
                        <div key={item.id} className={`flex flex-col md:flex-row items-start ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''} group`}>
                          <div className="w-14 md:w-1/2 flex justify-center md:justify-end shrink-0">
                            <div className="w-4 h-4 bg-white dark:bg-zinc-900 border-4 border-[#0071e3] rounded-full mt-5 md:mt-0 shadow-[0_0_0_4px_rgba(0,113,227,0.2)]"></div>
                          </div>
                          <div className={`w-full md:w-1/2 pl-14 md:pl-0 mt-[-24px] md:mt-0 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm group-hover:-translate-y-1 transition-transform">
                              <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h4>
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
      
      <footer className="w-full bg-[#fbfbfd] dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-16 transition-colors duration-500 relative z-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[#86868b] dark:text-[#a1a1a6] font-medium tracking-wide">
            <p>Copyright © {new Date().getFullYear()} Pattaradanai Saiwongkham. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}