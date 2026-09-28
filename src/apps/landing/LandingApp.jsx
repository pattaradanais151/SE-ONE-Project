// src/apps/landing/LandingApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { 
  Sun, Moon, ChevronRight, Briefcase, Code, Terminal, 
  ArrowUpRight, Globe, Layers, ShieldCheck, ArrowRight, Cpu, Network
} from 'lucide-react';
import 'animate.css';

// ==========================================
// 🎨 Emotion Animations
// ==========================================
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const textClip = keyframes`
  to { background-position: 200% center; }
`;

const pulseGlow = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

export default function LandingApp() {
  const navigate = useNavigate();
  
  // 🌓 ระบบจำ Theme ผ่าน localStorage สลับหน้าไหนก็ไม่หลุด
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);

  // ------------------------------------------
  // 🛡️ Security & Anti-Inspect
  // ------------------------------------------
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

  // ------------------------------------------
  // 🌓 บันทึก Theme ลง Class และ localStorage
  // ------------------------------------------
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

  const toggleTheme = () => setIsDark(prev => !prev);
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
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
        .tech-grid { background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 24px 24px; }
      `}</style>
      
      {/* ------------------------------------------
          🍎 Global Navbar (ตัด Scrollbar ขาวออก + จัดกึ่งกลางเป๊ะ)
          ------------------------------------------ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        
        {/* Announcement Bar */}
        <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          SE-ONE.SITE Workspace v2.0 is now live. Experience the new Pro performance.
          <a href="#tech-stack" className="text-[#0071e3] hover:underline flex items-center gap-0.5 ml-2 font-bold">
            Learn more <ArrowRight className="w-3 h-3" />
          </a>
        </div>

        {/* Main Bar */}
        <div className="max-w-[1200px] mx-auto h-[54px] px-4 flex items-center justify-between text-xs font-bold tracking-wide relative">
          {/* Logo Left */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
            <div className="w-9 h-9 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-sm hover:scale-105 transition-transform">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-sm font-black tracking-tight hidden sm:block">SE-ONE.SITE<span className="text-[#0071e3]">.</span></span>
          </div>
          
          {/* Menu Center (Absolute Center - No Horizontal Scrollbar) */}
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 -translate-x-1/2 w-max">
            <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Home</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/portfolio')}>Talents</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/showcase')}>Projects</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/guestbook')}>Guestbook</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/support')}>Support</span>
          </div>

          {/* Action Right */}
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

      {/* ------------------------------------------
          🍎 Hero Section 
          ------------------------------------------ */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-28 pb-10 text-center overflow-hidden">
        <div className={`z-10 px-4 ${css`animation: ${fadeInUp} 1.2s cubic-bezier(0.16, 1, 0.3, 1);`}`}>
          <h2 className="text-[#86868b] dark:text-[#a1a1a6] text-lg sm:text-2xl font-semibold tracking-tight mb-2">
            Software Engineering Gen 4
          </h2>
          <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black tracking-tighter leading-none mb-6">
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
              className="bg-[#0071e3] text-white px-8 py-3.5 rounded-full hover:bg-[#0077ED] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,113,227,0.3)] hover:shadow-[0_0_40px_rgba(0,113,227,0.5)] active:scale-95"
            >
              เข้าสู่ระบบ SE-Job <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/portfolio')} 
              className="text-[#1d1d1f] dark:text-white hover:text-[#0071e3] dark:hover:text-[#0071e3] flex items-center justify-center gap-2 group transition-colors font-semibold"
            >
              ดูผลงาน (Portfolio) <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-600/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      </section>

      {/* ------------------------------------------
          🍎 Features & About Us
          ------------------------------------------ */}
      <section className="max-w-[1200px] mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <Globe className="w-12 h-12 mx-auto mb-6 text-[#0071e3]" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">สร้างเพื่อ SE โดยเฉพาะ</h2>
          <p className="text-xl text-[#86868b] dark:text-[#a1a1a6] font-medium leading-relaxed">
            เว็บไซต์นี้ถูกออกแบบขึ้นด้วยความตั้งใจที่จะสร้าง <span className="text-[#1d1d1f] dark:text-white font-bold">"Ecosystem การเรียนรู้ของตัวเอง"</span> รวบรวมทุกอย่างตั้งแต่การส่งงาน ตารางเรียน ไปจนถึงผลงาน Portfolio ไว้ในที่เดียว
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div onClick={() => navigate('/sework')} className="group cursor-pointer bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-10 h-[450px] flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="relative z-10">
              <Briefcase className="w-10 h-10 mb-6 text-[#1d1d1f] dark:text-white" />
              <h3 className="text-3xl font-bold tracking-tight mb-3">SE Job System.</h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6] text-lg font-medium leading-relaxed">จัดการตารางเรียน ส่งงาน เช็คชื่อ<br/> และประกาศ จบครบในที่เดียว</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-[#0071e3] font-medium text-lg mt-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              เข้าสู่ระบบ <ChevronRight className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-[#0071e3]/20 to-transparent rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          </div>

          <div onClick={() => navigate('/portfolio')} className="group cursor-pointer bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-10 h-[450px] flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="relative z-10">
              <Code className="w-10 h-10 mb-6 text-[#1d1d1f] dark:text-white" />
              <h3 className="text-3xl font-bold tracking-tight mb-3">Dev Portfolio.</h3>
              <p className="text-[#86868b] dark:text-[#a1a1a6] text-lg font-medium leading-relaxed">พื้นที่จัดแสดงผลงาน ทักษะ และ<br/>เทคโนโลยีที่เชี่ยวชาญตลอด 4 ปี</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-fuchsia-500 font-medium text-lg mt-8 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              สำรวจผลงาน <ChevronRight className="w-5 h-5" />
            </div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-br from-fuchsia-500/20 to-transparent rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------
          🔥 Tech Stack Showcase (Hardcore Bento Grid)
          ------------------------------------------ */}
      <section id="tech-stack" className="py-32 bg-white/30 dark:bg-[#0a0a0c] border-t border-gray-200 dark:border-white/5 relative z-10 overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-50 dark:opacity-20 pointer-events-none"></div>
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
              Core Architecture.
            </h2>
            <p className="text-xl text-[#86868b] dark:text-zinc-400 font-medium max-w-2xl">
              สถาปัตยกรรมระดับโปรที่ขับเคลื่อนระบบด้วยความเร็วสูง ปลอดภัย และรองรับการขยายตัวในอนาคต
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1: Edge Computing & Serverless */}
            <div className="md:col-span-2 bg-[#f5f5f7] dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                  <span className={`w-2 h-2 rounded-full bg-emerald-500 ${css`animation: ${pulseGlow} 2s infinite;`}`}></span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Realtime Sync Active</span>
                </div>
              </div>
              <Network className="w-12 h-12 text-[#0071e3] mb-6" />
              <h3 className="text-3xl font-black mb-2 tracking-tight">Cloud Serverless Engine</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-8 max-w-md">ระบบฐานข้อมูลและ API ทำงานบนสถาปัตยกรรมไร้เซิร์ฟเวอร์ รองรับ WebSockets ซิงค์ข้อมูลข้ามอุปกรณ์ทันทีระดับมิลลิวินาที</p>
              <div className="flex gap-4 font-mono text-xs">
                <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-zinc-800 px-4 py-2 rounded-lg">
                  <span className="text-zinc-400 block mb-1">LATENCY</span>
                  <span className="text-[#0071e3] font-bold text-lg">&lt; 30ms</span>
                </div>
                <div className="bg-white dark:bg-black/50 border border-gray-200 dark:border-zinc-800 px-4 py-2 rounded-lg">
                  <span className="text-zinc-400 block mb-1">NETWORK UPTIME</span>
                  <span className="text-zinc-900 dark:text-white font-bold text-lg">99.99%</span>
                </div>
              </div>
              <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-[#0071e3]/10 rounded-full blur-[80px] group-hover:bg-[#0071e3]/20 transition-colors duration-500"></div>
            </div>

            {/* Box 2: Security */}
            <div className="md:col-span-1 bg-[#f5f5f7] dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-8 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <ShieldCheck className="w-10 h-10 text-red-500 mb-6" />
                <h3 className="text-2xl font-black mb-2 tracking-tight">Anti-Inspect Core</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">ระบบรักษาความปลอดภัยระดับสูงสุด ป้องกันการคัดลอก ถอดรหัส และบล็อก DevTools อย่างสมบูรณ์</p>
              </div>
              <div className="mt-8 bg-black dark:bg-white/5 border border-zinc-800 dark:border-white/10 rounded-xl p-4 font-mono text-[10px] text-zinc-400">
                <span className="text-red-400">ERR:</span> Context menu blocked.<br/>
                <span className="text-red-400">ERR:</span> F12/Inspect disabled.<br/>
                <span className="text-emerald-400">SYS:</span> Security mode active.
              </div>
            </div>

            {/* Box 3: React 18 */}
            <div className="md:col-span-1 bg-gradient-to-br from-zinc-900 to-black dark:from-white dark:to-zinc-300 rounded-[2rem] p-8 text-white dark:text-black relative overflow-hidden group">
              <Cpu className="w-10 h-10 mb-6 text-white dark:text-black" />
              <h3 className="text-2xl font-black mb-2 tracking-tight">Next-Gen React</h3>
              <p className="text-zinc-400 dark:text-zinc-600 text-sm mb-6">ขับเคลื่อนด้วย React 18 Concurrent Rendering เรนเดอร์ UI ซับซ้อนได้อย่างลื่นไหลไร้สะดุด</p>
              <div className="w-full h-1 bg-white/20 dark:bg-black/20 rounded-full overflow-hidden">
                <div className="w-[98%] h-full bg-white dark:bg-black rounded-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white dark:bg-black rounded-full shadow-[0_0_10px_white] dark:shadow-[0_0_10px_black]"></div>
                </div>
              </div>
              <p className="text-[10px] font-mono mt-2 opacity-70">Rendering Speed: Ultra-Fast</p>
            </div>

            {/* Box 4: Terminal CSS */}
            <div className="md:col-span-2 bg-[#1d1d1f] dark:bg-[#000] border border-gray-200 dark:border-white/10 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group shadow-2xl">
              <div className="flex-1 z-10">
                <Terminal className="w-10 h-10 text-white mb-6" />
                <h3 className="text-2xl font-black mb-2 tracking-tight text-white">Fluid UI & Styling Engine</h3>
                <p className="text-zinc-400 text-sm">ออกแบบโครงสร้าง CSS Architecture ด้วย TailwindCSS ร่วมกับ Emotion สร้างระบบ UI สไตล์ Glassmorphism ที่ยืดหยุ่นและตอบสนองทุกขนาดหน้าจอ</p>
              </div>
              <div className="w-full md:w-auto flex-1 bg-[#121214] border border-zinc-800 rounded-xl p-4 font-mono text-xs z-10 shadow-inner">
                <div className="flex gap-2 mb-3 border-b border-zinc-800 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-1.5">
                  <p><span className="text-pink-500">import</span> {'{'} css {'}'} <span className="text-pink-500">from</span> <span className="text-yellow-300">'@emotion/css'</span>;</p>
                  <p><span className="text-blue-400">const</span> glass = <span className="text-emerald-400">css</span>`</p>
                  <p className="pl-4 text-zinc-300">backdrop-filter: blur(20px);</p>
                  <p className="pl-4 text-zinc-300">background: rgba(255,255,255,0.8);</p>
                  <p>`</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#fbfbfd] dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-16 transition-colors duration-500 relative z-20">
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