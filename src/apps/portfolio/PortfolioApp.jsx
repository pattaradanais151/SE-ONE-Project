// src/apps/landing/PortfolioApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, Code, Github, Users, Search, UserCheck, Sparkles } from 'lucide-react';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function PortfolioApp() {
  const navigate = useNavigate();
  
  // 🌓 บันทึก Theme ลง localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [developers, setDevelopers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const githubUsernames = [
    "SirSuPa", "BEER-B0Y", "AmBoutToCook", "PacharaponKan", 
    "pattaradanais151", "eagpatipanpat", "Synnado", "WaiwaiTomyum", 
    "thani5896", "kuroko29", "67319080013-ctrl", "Updura", 
    "santi789", "ulssea0", "Atomkung", "lnwzaez007", 
    "pop25491", "IceKunGzCH", "rt45oh", "T5r1F", 
    "MarchMlow", "paliguy", "Vergil-sparda01", "formosttttt", 
    "ZeSkyTH", "uwu11211", "icerock5555"
  ];

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
    const fetchGithubData = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.allSettled(
          githubUsernames.map(username => 
            fetch(`https://api.github.com/users/${username}`).then(res => {
              if (!res.ok) throw new Error('API Limit');
              return res.json();
            })
          )
        );

        const profilesData = results.map((result, index) => {
          const username = githubUsernames[index];
          if (result.status === 'fulfilled' && result.value.login) {
            return result.value;
          } else {
            return {
              login: username,
              name: username,
              avatar_url: `https://github.com/${username}.png`,
              bio: "Software Engineering Student @ RMUTL",
              public_repos: "N/A",
              followers: "N/A",
              following: "N/A",
              html_url: `https://github.com/${username}`,
              fallback: true
            };
          }
        });

        profilesData.sort((a, b) => {
          const reposA = typeof a.public_repos === 'number' ? a.public_repos : 0;
          const reposB = typeof b.public_repos === 'number' ? b.public_repos : 0;
          return reposB - reposA;
        });

        setDevelopers(profilesData);
      } catch (error) {
        console.error("Error fetching GitHub data", error);
      }
      setIsLoading(false);
    };

    fetchGithubData();
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);
  const preventAll = (e) => e.preventDefault();

  const filteredDevs = developers.filter(dev => 
    dev.login.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (dev.name && dev.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div 
      onContextMenu={preventAll} 
      onCopy={preventAll} 
      onCut={preventAll} 
      className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-[#0071e3] selection:text-white transition-colors duration-500 overflow-x-hidden select-none"
    >
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
        .hero-pattern { background-image: radial-gradient(rgba(0, 113, 227, 0.15) 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>
      
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          SE Gen 4 Talent Hub — Explore our talented developers.
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
            <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Talents</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/showcase')}>Projects</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/guestbook')}>Guestbook</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/support')}>Support</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={toggleTheme} 
              aria-label="Toggle Theme"
              className="p-2 rounded-full hover:bg-gray-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition-colors outline-none text-zinc-600 dark:text-zinc-300"
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

      <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-50 dark:opacity-20 -z-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <div className={`z-10 px-4 max-w-4xl mx-auto ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-[#0071e3] text-xs font-bold uppercase tracking-widest mb-6">
            <Code className="w-4 h-4" /> Software Engineers
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-6">
            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071e3] to-purple-600">Our Talents.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#86868b] dark:text-[#a1a1a6] font-medium leading-relaxed max-w-2xl mx-auto mb-10">
            รวมหน้าพอร์ตโฟลิโอและผลงานการเขียนโค้ด (GitHub) ของนักศึกษาสาขาวิศวกรรมซอฟต์แวร์ รุ่นที่ 4 (ห้องเทียบโอน)
          </p>
          
          <div className="relative max-w-lg mx-auto shadow-2xl rounded-full group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-full px-6 py-4 transition-all">
              <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="ค้นหาชื่อ หรือ Username..." 
                className="w-full bg-transparent outline-none text-zinc-900 dark:text-white font-medium placeholder-zinc-500" 
              />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1400px] mx-auto px-6 pb-32 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-200 dark:border-zinc-800/80 pb-4 gap-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
            <Users className="w-5 h-5 text-[#0071e3]" /> SE Developers ({githubUsernames.length})
          </h3>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest mr-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500"/> Core Skills:
            </span>
            {['React', 'Node.js', 'Python', 'Flutter', 'SQL'].map(skill => (
              <span key={skill} className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800/60 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/50 dark:bg-[#121214]/50 border border-gray-200 dark:border-zinc-800 rounded-[2rem] p-6 h-[320px] animate-pulse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4"></div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-zinc-800 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 dark:bg-zinc-800 rounded mb-6"></div>
              </div>
            ))}
          </div>
        ) : filteredDevs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem]">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold text-xl">ไม่พบรายชื่อนักพัฒนา</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDevs.map((dev, index) => {
              const badges = ["Frontend", "Backend", "Fullstack", "UI/UX", "Database", "DevOps"];
              const randomBadge = badges[index % badges.length];

              return (
                <div 
                  key={dev.login} 
                  className={`group bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 flex flex-col ${css`animation: ${fadeInUp} 0.5s ease-out ${index * 0.05}s both;`}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-20 h-20 rounded-[1.25rem] bg-gray-100 dark:bg-zinc-800 overflow-hidden shadow-inner border border-gray-200 dark:border-zinc-700">
                      <img src={dev.avatar_url} alt={dev.login} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    </div>
                    <div className="bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {randomBadge}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white truncate" title={dev.name || dev.login}>
                      {dev.name || dev.login}
                    </h3>
                    <p className="text-xs font-mono text-zinc-500 truncate mb-2">@{dev.login}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 h-10 leading-snug">
                      {dev.bio || "Software Engineering Student @ RMUTL"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Repos</span>
                      <span className="text-base font-black text-zinc-900 dark:text-white">{dev.public_repos}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-zinc-800"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Followers</span>
                      <span className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> {dev.followers}
                      </span>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-zinc-800"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Following</span>
                      <span className="text-base font-black text-zinc-900 dark:text-white">{dev.following}</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <a 
                      href={dev.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:bg-[#0071e3] dark:hover:bg-[#0071e3] hover:text-white dark:hover:text-white transition-colors shadow-sm"
                    >
                      <Github className="w-4 h-4" /> ดูผลงานบน GitHub
                    </a>
                  </div>
                </div>
              );
            })}
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