// src/apps/coding/CodingLanding.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Terminal, Code2, Zap, ArrowRight, Lock, Layout, Coffee, FileJson, UserCircle, TerminalSquare, Braces } from 'lucide-react';
import { supabase } from '../../shared/lib/supabase';
import SEO from '../../components/seo/SEO';
import BreadcrumbsJsonLd from '../../components/seo/BreadcrumbsJsonLd';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

export default function CodingLanding() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const SESSION_TIMEOUT = 5 * 60 * 60 * 1000;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const loginTime = localStorage.getItem('code_login_time');
        if (loginTime && Date.now() - parseInt(loginTime) > SESSION_TIMEOUT) {
          await supabase.auth.signOut();
          localStorage.removeItem('code_login_time');
          setUser(null);
        } else {
          setUser(session.user);
        }
      }
    };
    
    checkAuth();
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const preventAll = (e) => e.preventDefault();

  const handleActionClick = () => {
    if (user) {
      navigate('/code/workspace');
    } else {
      navigate('/code/login');
    }
  };

  return (
    <>
      <SEO 
        title="SE-ONE IDE | Pro Web-Based Coding Playground" 
        description="พื้นที่สำหรับนักพัฒนา SE Gen 4 ฝึกเขียนและทดสอบโค้ดบนเบราว์เซอร์ พร้อมการรัน Python (WebAssembly), React 18, และ TypeScript"
        url="/code"
      />
      <BreadcrumbsJsonLd 
        items={[
          { name: "Home", path: "/" },
          { name: "SE-ONE IDE", path: "/code" }
        ]}
      />
      <div 
        onContextMenu={preventAll} onCopy={preventAll} onCut={preventAll}
        className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden select-none"
      >
        <style>{`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
          .grid-bg { background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px); background-size: 32px 32px; }
        `}</style>

        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5">
          <div className="max-w-[1200px] mx-auto h-16 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                <Code2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-bold tracking-tight text-sm">SE-ONE.SITE <span className="text-emerald-400 font-mono">IDE</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {!user ? (
                <button onClick={() => navigate('/code/login')} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                  Sign In
                </button>
              ) : null}
              
              <button onClick={handleActionClick} className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-full text-sm font-bold transition-all hover:scale-95 flex items-center gap-2">
                {user ? <UserCircle className="w-4 h-4" /> : <Lock className="w-3 h-3" />}
                {user ? 'Go to Workspace' : 'Get Started'}
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden flex flex-col items-center text-center grid-bg">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          
          <div className={`max-w-4xl z-10 ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-mono mb-8 backdrop-blur-sm">
              <Zap className="w-4 h-4" /> v3.0 Native Python & TS Engine
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tighter leading-[1.1] mb-6">
              Write Code.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                Anywhere. Anytime.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
              พื้นที่สำหรับนักพัฒนา SE Gen 4 ฝึกเขียนและทดสอบโค้ดได้ทันทีบนเบราว์เซอร์ พร้อมการรัน Python รูปแบบ WebAssembly ของแท้
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleActionClick}
                className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full font-black text-base flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
              >
                {user ? 'Open Workspace' : 'Start Coding Now'} <ArrowRight className="w-5 h-5" />
              </button>
              {!user && (
                <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Requires Authentication
                </div>
              )}
            </div>
          </div>

          {/* Mockup Editor */}
          <div className={`mt-20 w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1e1e1e] flex flex-col relative z-10 ${css`animation: ${float} 6s ease-in-out infinite;`}`}>
            <div className="h-10 bg-[#2d2d2d] flex items-center px-4 gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 text-xs font-mono text-zinc-400 flex items-center gap-2">
                <TerminalSquare className="w-3 h-3" /> workspace / main.py
              </div>
            </div>
            <div className="p-6 text-left font-mono text-sm md:text-base overflow-hidden">
              <p className="text-purple-400">def <span className="text-blue-300">hello_world</span><span className="text-white">():</span></p>
              <p className="pl-8 text-cyan-300">print<span className="text-white">(</span><span className="text-orange-300">"Welcome to SE-ONE Python Engine"</span><span className="text-white">)</span></p>
              <p><br/></p>
              <p className="text-white">hello_world()</p>
            </div>
            {!user && (
              <div 
                onClick={() => navigate('/code/login')}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <div className="bg-emerald-500 text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Click to Unlock Editor
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Feature Section */}
        <section className="py-24 px-6 border-t border-white/5 relative z-10 bg-black">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4">Pro Execution Engine</h2>
              <p className="text-zinc-400">เรารองรับภาษาหลักของอุตสาหกรรม และคอมไพล์ได้เสมือนโปรแกรมจริงๆ</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <TerminalSquare className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="font-bold text-lg mb-2 text-white">Native Python</h3>
                <p className="text-sm text-zinc-400">รันไพธอน 100% ผ่านเทคโนโลยี Pyodide (WASM) ในเบราว์เซอร์ พร้อมดึง Output ออกจอ Console</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <Braces className="w-8 h-8 text-blue-500 mb-4" />
                <h3 className="font-bold text-lg mb-2 text-white">TypeScript</h3>
                <p className="text-sm text-zinc-400">คอมไพล์ TypeScript ด้วย Babel Standalone ตรวจสอบ Type และรันสดๆ ทันที</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <FileJson className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="font-bold text-lg mb-2 text-white">React 18</h3>
                <p className="text-sm text-zinc-400">จำลอง Environment ของ React สามารถประกาศ State และ Hook ต่างๆ เข้าไปหน้า Preview ได้</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="w-full border-t border-white/5 py-8 text-center text-xs text-zinc-600 font-mono bg-black">
          <p>SE-ONE.SITE IDE © {new Date().getFullYear()} • Secure WebAssembly Environment</p>
        </footer>
      </div>
    </>
  );
}