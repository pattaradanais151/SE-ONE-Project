// src/apps/job/views/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, ShieldAlert, Clock, Globe, Terminal } from 'lucide-react';
import 'animate.css';

export default function Register() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [thailandTime, setThailandTime] = useState('');
  const [publicIp, setPublicIp] = useState('Fetching IP...');

  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const updateTime = () => {
      setThailandTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(new Date()));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setPublicIp(data.ip))
      .catch(() => setPublicIp('Unknown / Offline'));

    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative overflow-hidden px-4 select-none"
    >
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-50 animate__animated animate__fadeInDown">
        <button onClick={() => navigate('/job/login')} className="flex items-center gap-2 text-sm font-medium bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm hover:scale-105 transition-all">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าเข้าสู่ระบบ
        </button>
        <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:scale-110 transition-all">
          {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      <div className="w-full max-w-[440px] z-10 animate__animated animate__fadeInUp">
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white dark:border-zinc-800/80 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-black rounded-full border border-gray-200 dark:border-zinc-800">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400 font-semibold">Auth Check (auth.sh)</span>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl flex items-center justify-center border border-red-100 dark:border-red-900/30">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            กรุณาติดต่อผู้พัฒนาระบบหรือแอดมิน เพื่อสร้างบัญชีผู้ใช้งานสำหรับการเข้าถึงระบบนี้
          </p>

          <button onClick={() => navigate('/')} className="group flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            กลับสู่หน้าหลัก
          </button>
        </div>
        <div className="mt-8 text-center text-xs font-mono text-zinc-400">SE-JOB Admin System, Secured Area.<br/>Authorized personnel only.</div>
      </div>

      <div className="fixed bottom-6 flex items-center justify-center gap-4 px-5 py-2.5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm text-xs font-mono text-zinc-500 dark:text-zinc-400 z-10 animate__animated animate__fadeInUp">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline opacity-70">IP:</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">{publicIp}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-red-500/70" />
          <span className="hidden sm:inline opacity-70">TH:</span>
          <span className="font-bold text-zinc-700 dark:text-zinc-300">{thailandTime}</span>
        </div>
      </div>
    </div>
  );
}