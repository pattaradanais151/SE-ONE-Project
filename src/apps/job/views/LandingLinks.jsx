// src/apps/job/views/LandingLinks.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { ArrowLeft, Sun, Moon, ExternalLink } from 'lucide-react';
import 'animate.css';

// ==========================================
// 🎨 Emotion CSS-in-JS (Animations & Styles)
// ==========================================

const floatAnimation = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 0.3; }
  50% { transform: translateY(-20px) scale(1.05); opacity: 0.6; }
  100% { transform: translateY(0) scale(1); opacity: 0.3; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// สไตล์ปุ่มลิงก์ (Premium Glassmorphism & Dynamic Glow)
const linkCardStyle = (color) => css`
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  .dark & {
    background: rgba(17, 24, 39, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  &:hover {
    transform: translateY(-4px) scale(1.01);
    background: #ffffff;
    border-color: ${color}60;
    box-shadow: 0 15px 35px -10px ${color}50;
    
    .dark & {
      background: rgba(30, 30, 35, 0.8);
      border-color: ${color}80;
      box-shadow: 0 15px 35px -10px ${color}70;
    }

    .brand-logo-container {
      transform: scale(1.15) rotate(-5deg);
    }
    
    .arrow-icon {
      opacity: 1;
      transform: translateX(0);
      color: ${color};
    }
  }
`;

export default function LandingLinks() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  // ระบบ Anti-Copy
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // 📌 ข้อมูลลิงก์ พร้อม Official Logos
  const linkCategories = [
    {
      title: 'AI & Assistants',
      links: [
        { name: 'Gemini', url: 'https://gemini.google.com', logo: 'https://cdn.simpleicons.org/googlegemini/8b5cf6', color: '#8b5cf6' },
        { name: 'ChatGPT', url: 'https://chatgpt.com', logo: 'https://cdn.simpleicons.org/openai/10a37f', color: '#10a37f' },
        { name: 'Claude', url: 'https://claude.ai', logo: 'https://cdn.simpleicons.org/anthropic/d97757', color: '#d97757' },
        { name: 'AIPass', url: 'https://de.aipass.net/', logo: 'https://icon.horse/icon/de.aipass.net', color: '#3b82f6' }
      ]
    },
    {
      title: 'Development & Hosting',
      links: [
        { name: 'GitHub', url: 'https://github.com', logo: 'https://cdn.simpleicons.org/github/111111', color: '#ffffff', invertDark: true },
        { name: 'Supabase', url: 'https://supabase.com', logo: 'https://cdn.simpleicons.org/supabase/3ecf8e', color: '#3ecf8e' },
        { name: 'Vercel', url: 'https://vercel.com', logo: 'https://cdn.simpleicons.org/vercel/111111', color: '#ffffff', invertDark: true },
        { name: 'Localhost :5173', url: 'http://localhost:5173', logo: 'https://cdn.simpleicons.org/vite/646cff', color: '#06b6d4' },
        { name: 'Localhost :3000', url: 'http://localhost:3000', logo: 'https://cdn.simpleicons.org/nodedotjs/339933', color: '#f59e0b' }
      ]
    },
    {
      title: 'Learning & Communities',
      links: [
        { name: 'Devtai', url: 'https://devtai.com/', logo: 'https://icon.horse/icon/devtai.com', color: '#f59e0b' },
        { name: 'BorntoDev', url: 'https://borntodev.com', logo: 'https://icon.horse/icon/borntodev.com', color: '#f97316' },
        { name: 'Milerdev', url: 'https://milerdev.com', logo: 'https://icon.horse/icon/milerdev.com', color: '#3b82f6' },
        { name: 'FreeCodeCamp', url: 'https://freecodecamp.org', logo: 'https://cdn.simpleicons.org/freecodecamp/111111', color: '#ffffff', invertDark: true },
        { name: 'FX Warrior Coding', url: 'https://thailandfxwarrior.com/coding', logo: 'https://icon.horse/icon/thailandfxwarrior.com', color: '#eab308' }
      ]
    },
    {
      title: 'Social & Media',
      links: [
        { name: 'Facebook', url: 'https://facebook.com', logo: 'https://cdn.simpleicons.org/facebook/1877f2', color: '#1877f2' },
        { name: 'Messenger', url: 'https://messenger.com', logo: 'https://cdn.simpleicons.org/messenger/00b2ff', color: '#00b2ff' },
        { name: 'Instagram', url: 'https://instagram.com', logo: 'https://cdn.simpleicons.org/instagram/e1306c', color: '#e1306c' },
        { name: 'TikTok', url: 'https://tiktok.com', logo: 'https://cdn.simpleicons.org/tiktok/111111', color: '#ffffff', invertDark: true },
        { name: 'YouTube', url: 'https://youtube.com', logo: 'https://cdn.simpleicons.org/youtube/ff0000', color: '#ff0000' }
      ]
    }
  ];

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="min-h-screen w-full overflow-y-auto flex flex-col items-center pt-8 pb-16 px-4 sm:px-6 bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative select-none"
    >
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
      `}</style>

      {/* Animated Background Orbs */}
      <div className={css`
        position: fixed; top: -10%; left: -5%; width: 35rem; height: 35rem;
        background: rgba(59, 130, 246, 0.12); border-radius: 50%; filter: blur(90px);
        animation: ${floatAnimation} 8s ease-in-out infinite; pointer-events: none; z-index: 0;
      `}></div>
      <div className={css`
        position: fixed; bottom: -10%; right: -5%; width: 35rem; height: 35rem;
        background: rgba(217, 70, 239, 0.12); border-radius: 50%; filter: blur(90px);
        animation: ${floatAnimation} 10s ease-in-out infinite reverse; pointer-events: none; z-index: 0;
      `}></div>
      
      {/* Minimal Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05] z-0" 
           style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Top Controls */}
      <div className={`w-full max-w-5xl flex justify-between items-center mb-10 relative z-20 ${css`animation: ${fadeInUp} 0.4s ease-out;`}`}>
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white/60 dark:bg-[#121214]/60 backdrop-blur-md border border-gray-200 dark:border-zinc-800 rounded-full hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
        </button>
        
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/60 dark:bg-[#121214]/60 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-all"
        >
          {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-[#0071e3]" />}
        </button>
      </div>

      {/* Header Title */}
      <div className={`text-center mb-12 relative z-10 ${css`animation: ${fadeInUp} 0.5s ease-out;`}`}>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight text-zinc-900 dark:text-white">
          Developer Workspace
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-mono text-sm max-w-lg mx-auto">
          Quick access to essential tools, learning platforms, and communities.
        </p>
      </div>

      {/* Main Grid Content */}
      <div className="w-full max-w-5xl relative z-10 space-y-12">
        {linkCategories.map((category, catIndex) => (
          <div key={catIndex} className={`${css`animation: ${fadeInUp}${0.6 + (catIndex * 0.1)}s ease-out;`}`}>
            
            <h2 className="text-lg font-bold mb-5 px-2 text-zinc-800 dark:text-zinc-200 border-b border-gray-200 dark:border-zinc-800/80 pb-2">
              {category.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {category.links.map((link, linkIndex) => {
                const activeColor = (link.invertDark && !isDark) ? '#1d1d1f' : link.color;

                return (
                  <a 
                    key={linkIndex}
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`group flex items-center p-4 rounded-2xl ${linkCardStyle(activeColor)}`}
                  >
                    <div className="flex items-center gap-4 w-full relative">
                      {/* Logo Container */}
                      <div className="brand-logo-container transition-transform duration-300 w-11 h-11 rounded-xl bg-white dark:bg-black/50 border border-gray-100 dark:border-zinc-700 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-2">
                        <img 
                          src={link.logo} 
                          alt={link.name} 
                          className={`w-full h-full object-contain ${link.invertDark ? 'dark:invert opacity-90 dark:opacity-100' : ''}`}
                          loading="lazy"
                        />
                      </div>
                      
                      {/* Text Info */}
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-[15px] text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate">
                          {link.name}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate group-hover:opacity-70 transition-opacity mt-0.5">
                          {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      </div>
                      
                      {/* Hover Arrow */}
                      <div className="arrow-icon absolute right-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center opacity-0 -translate-x-2 transition-all duration-300 ml-auto">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================== */}
      {/* ✨ Premium Footer */}
      {/* ========================================== */}
      <footer className={`w-full max-w-4xl mt-24 pt-10 border-t border-gray-200 dark:border-zinc-800/80 relative z-20 ${css`animation: ${fadeInUp} 1s ease-out;`}`}>
        <div className="flex flex-col items-center justify-center text-center pb-8">
          
          <a 
            href="https://fk-myportfolio.netlify.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={css`
              display: inline-flex; align-items: center; gap: 0.75rem;
              padding: 0.75rem 1.5rem; border-radius: 9999px;
              background: linear-gradient(to right, rgba(0, 113, 227, 0.05), rgba(217, 70, 239, 0.05));
              border: 1px solid rgba(0, 113, 227, 0.2);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              &:hover {
                transform: translateY(-3px) scale(1.02);
                background: linear-gradient(to right, rgba(0, 113, 227, 0.15), rgba(217, 70, 239, 0.15));
                border-color: rgba(217, 70, 239, 0.4);
                box-shadow: 0 10px 30px -5px rgba(217, 70, 239, 0.2);
              }
            `}
          >
            <img src="/logo.PNG" alt="Logo" className="w-7 h-7 rounded-full object-cover shadow-sm bg-white" />
            <div className="flex flex-col items-start text-left">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold leading-none mb-1">Developed By</span>
              <span className="font-extrabold text-sm bg-clip-text text-transparent bg-gradient-to-r from-[#0071e3] to-fuchsia-600 dark:from-blue-400 dark:to-fuchsia-400 leading-none">
                Pattaradanai Saiwongkham
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-fuchsia-500 ml-2" />
          </a>
        </div>
      </footer>
    </div>
  );
}