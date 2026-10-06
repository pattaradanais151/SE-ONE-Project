// src/apps/landing/ShowcaseApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, ArrowUpRight, Layers, Sparkles } from 'lucide-react';
import { supabase } from '../../shared/lib/supabase';
import SEO from '../../components/seo/SEO';
import BreadcrumbsJsonLd from '../../components/seo/BreadcrumbsJsonLd';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function ShowcaseApp() {
  const navigate = useNavigate();
  
  // 🌓 บันทึก Theme ลง localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);
  const [projects, setProjects] = useState([]);
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
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setProjects([
            { 
              id: '1', 
              title: "SE-Job Workspace", 
              category: "Web Application", 
              description: "ระบบจัดการการเรียน ส่งงาน และติดตามคะแนนสะสมแบบเรียลไทม์ ออกแบบมาสำหรับ SE Gen 4", 
              technologies: ["React 18", "Supabase", "Tailwind v4"], 
              image_url: "https://picsum.photos/seed/sework/800/600", 
              link_url: "https://seone.site/sework", 
              is_featured: true 
            },
            { 
              id: '2', 
              title: "PinkieFlix", 
              category: "Streaming App", 
              description: "แพลตฟอร์มขายแอพพรีเมียมออนไลน์ พร้อม UI/UX ที่ลื่นไหล", 
              technologies: ["React", "Vite", "Cloudflare Pages"], 
              image_url: "https://picsum.photos/seed/pinkieflix/800/600", 
              link_url: "https://PinkieFlix.pages.dev", 
              is_featured: true 
            }
          ]);
        } else {
          setProjects(data);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const toggleTheme = () => setIsDark(prev => !prev);
  const preventAll = (e) => e.preventDefault();

  return (
    <>
      <SEO 
        title="Project Showcase" 
        description="รวมผลงานโปรเจกต์ โครงงาน และแอปพลิเคชันที่ออกแบบและพัฒนาโดยนักศึกษาสาขาวิศวกรรมซอฟต์แวร์"
        url="/showcase"
      />
      <BreadcrumbsJsonLd 
        items={[
          { name: "Home", path: "/" },
          { name: "Projects", path: "/showcase" }
        ]}
      />
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
          .hero-mesh { background-image: radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%); }
        `}</style>
        
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
          <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
            <Sparkles className="w-3 h-3 text-yellow-500" /> Discover the masterpiece projects crafted by our developers.
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
              <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/about')}>About</span>
              <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/portfolio')}>Talents</span>
              <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Projects</span>
              <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
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

        <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-24 text-center overflow-hidden">
          <div className="absolute inset-0 hero-mesh dark:opacity-100 opacity-0 -z-10 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>
          
          <div className={`z-10 px-4 max-w-4xl mx-auto ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest mb-6 border border-purple-200 dark:border-purple-500/20">
              <Layers className="w-4 h-4" /> Featured Projects
            </div>
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.1] mb-6">
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-[#0071e3]">Masterpieces.</span>
            </h1>
            <p className="text-lg text-[#86868b] dark:text-[#a1a1a6] font-medium max-w-2xl mx-auto mb-10">
              รวมผลงานโปรเจกต์ โครงงาน และแอปพลิเคชันที่ออกแบบและพัฒนาโดยนักศึกษาสาขาวิศวกรรมซอฟต์แวร์
            </p>
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 pb-32 relative z-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-4 border-[#0071e3] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <div 
                  key={project.id} 
                  className={`group bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-[2.5rem] overflow-hidden shadow-md hover:-translate-y-2 transition-transform duration-500 flex flex-col ${project.is_featured ? 'md:col-span-2 md:flex-row md:h-[400px]' : 'h-[450px]'}`}
                >
                  <div className={`relative overflow-hidden ${project.is_featured ? 'w-full md:w-1/2 h-64 md:h-full' : 'h-1/2 w-full'}`}>
                    <img src={project.image_url} alt={project.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  </div>

                  <div className={`p-8 md:p-10 flex flex-col justify-between ${project.is_featured ? 'w-full md:w-1/2' : 'h-1/2 w-full'}`}>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-widest text-[#86868b] dark:text-[#a1a1a6] mb-2">{project.category}</div>
                      <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-4 group-hover:text-[#0071e3] transition-colors">{project.title}</h3>
                      <p className="text-[#86868b] dark:text-[#a1a1a6] font-medium leading-relaxed line-clamp-3">{project.description}</p>
                    </div>

                    <div className="mt-6">
                      <div className="flex flex-wrap gap-2 mb-6">
                        {project.technologies.map(tech => (
                          <span key={tech} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                      <a 
                        href={project.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-[14px] font-bold text-white bg-[#1d1d1f] dark:bg-white dark:text-black px-6 py-3 rounded-full hover:scale-95 transition-transform"
                      >
                        View Project <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
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
    </>
  );
}