// src/apps/job/views/Maintenance.jsx
import React, { useState, useEffect } from 'react';
import { ServerCog, Wrench, Terminal, Globe, Clock, ShieldAlert } from 'lucide-react';
import 'animate.css';

export default function Maintenance() {
  const [publicIp, setPublicIp] = useState('Fetching IP...');
  const [currentTime, setCurrentTime] = useState('');
  const [dots, setDots] = useState('');

  // ระบบ Anti-Copy
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    // Theme
    document.documentElement.classList.add('dark'); // หน้า Maintenance บังคับ Dark Mode ให้ดูขลังๆ ได้ หรือจะสลับตามเครื่องก็ได้ (ในโค้ดนี้ปล่อย Default)

    // IP Fetch
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setPublicIp(data.ip))
      .catch(() => setPublicIp('Unknown / Offline'));

    // Clock
    const updateClock = () => {
      setCurrentTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(new Date()) + ' น.');
    };
    updateClock();
    const timeInterval = setInterval(updateClock, 1000);

    // Terminal dots animation
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="min-h-screen w-full flex flex-col bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-transparent transition-colors duration-500 overflow-hidden relative select-none"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-3xl animate-[pulse_4s_ease-in-out_infinite] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl animate-[pulse_5s_ease-in-out_infinite] pointer-events-none"></div>
      
      {/* Minimal Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Top Navbar */}
      <nav className="w-full px-6 h-[72px] flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl shrink-0 z-20">
        <div className="flex items-center gap-4">
          <img src="/logo.PNG" alt="SE Logo" className="h-8 w-auto object-contain drop-shadow-sm" onError={(e) => e.target.outerHTML = '<div class="font-black text-2xl">SE.</div>'} />
          <div className="hidden sm:flex flex-col border-l border-gray-300 dark:border-gray-700 pl-4">
            <span className="text-[14px] font-bold leading-tight">Software Engineering</span>
            <span className="text-[11px] font-mono opacity-50 leading-tight mt-0.5">Admin Portal Workspace</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5" /> Maintenance
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full flex items-center justify-center p-4 relative z-10">
        <div className="max-w-2xl w-full bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] border border-white dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] p-8 md:p-12 relative animate__animated animate__fadeInUp animate__faster">
          
          {/* Icon Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-default">
              <div className="absolute inset-0 bg-[#0071e3]/20 dark:bg-[#0071e3]/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500">
                <ServerCog className="w-12 h-12 text-[#0071e3] dark:text-[#0071e3] animate-[spin_8s_linear_infinite]" />
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border border-gray-100 dark:border-gray-700">
                   <Wrench className="w-5 h-5 text-indigo-500 dark:text-indigo-400 animate-[bounce_2s_infinite]" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight text-zinc-900 dark:text-white">
              ระบบกำลังปิดปรับปรุง
            </h1>
            <p className="text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
              ขออภัยในความไม่สะดวก เรากำลังดำเนินการอัปเดตโครงสร้างระบบและฐานข้อมูล กรุณากลับมาใหม่ในภายหลัง
            </p>
          </div>

          {/* Terminal Diagnostic Panel */}
          <div className="w-full bg-[#1e1e1e] border border-[#333] rounded-[1.25rem] p-5 font-mono text-left shadow-inner transition-colors">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 font-semibold text-xs tracking-wider uppercase">system_diagnostics.sh</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs md:text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">CLIENT_IP:</span>
                <div className="flex items-center gap-2 text-gray-300">
                  <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-emerald-400 font-bold truncate">{publicIp}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">SERVER_TIME (TH):</span>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-4 h-4 text-[#0071e3] shrink-0" />
                  <span className="text-[#0071e3] font-bold truncate">{currentTime}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#333] space-y-1.5 text-xs md:text-sm">
              <p className="text-gray-500">&gt; VERIFYING_CONNECTION... <span className="text-emerald-500">OK</span></p>
              <p className="text-gray-500">&gt; INITIATING_MAINTENANCE_PROTOCOL... <span className="text-emerald-500">DONE</span></p>
              <p className="text-amber-500 font-bold flex items-center gap-1 mt-2">
                &gt; SYSTEM_OFFLINE_PLEASE_WAIT <span className="inline-block w-4">{dots}</span>
              </p>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full text-center py-6 shrink-0 z-20 border-t border-gray-200 dark:border-white/10 bg-[#fbfbfd]/80 dark:bg-black/80 backdrop-blur-xl">
        <p className="text-[12px] opacity-60 font-mono text-zinc-800 dark:text-zinc-300">
          © {new Date().getFullYear()} Pattaradanai Saiwongkham. All rights reserved.<br/>
          <span className="opacity-70 mt-1 inline-block">SE-JOB System • Maintenance Protocol Active</span>
        </p>
      </footer>
    </div>
  );
}