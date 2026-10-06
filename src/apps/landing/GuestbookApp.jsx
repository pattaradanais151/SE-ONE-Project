// src/apps/landing/GuestbookApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Sun, Moon, MessageSquare, Send, Loader2, Sparkles, Activity } from 'lucide-react';
import { supabase } from '../../shared/lib/supabase';
import SEO from '../../components/seo/SEO';
import BreadcrumbsJsonLd from '../../components/seo/BreadcrumbsJsonLd';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function GuestbookApp() {
  const navigate = useNavigate();
  
  // 🌓 บันทึก Theme ลง localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    fetchMessages();
    const channel = supabase.channel('public:guestbook')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
        setMessages((prev) => [payload.new, ...prev]);
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.from('guestbook').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('guestbook').insert([{ name, message }]);
      if (error) throw error;
      setName('');
      setMessage('');
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่งข้อความ: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => setIsDark(prev => !prev);
  const preventAll = (e) => e.preventDefault();

  return (
    <>
      <SEO 
        title="Guestbook" 
        description="แวะมาลงชื่อ หรือฝากข้อความทักทายพวกเรา SE Gen 4 ได้ที่นี่เลย!"
        url="/guestbook"
      />
      <BreadcrumbsJsonLd 
        items={[
          { name: "Home", path: "/" },
          { name: "Guestbook", path: "/guestbook" }
        ]}
      />
      <div 
        onContextMenu={preventAll} 
        onCopy={preventAll} 
        onCut={preventAll} 
        onDragStart={preventAll}
        className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 select-none overflow-x-hidden"
      >
        <style>{`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
          .hero-pattern { background-image: radial-gradient(rgba(244, 63, 94, 0.1) 1px, transparent 1px); background-size: 32px 32px; }
        `}</style>

        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
          <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
            <MessageSquare className="w-3 h-3 text-rose-500" /> Leave a message and say hi to SE Gen 4.
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
              <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/showcase')}>Projects</span>
              <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
              <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Guestbook</span>
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

        <section className="pt-32 pb-12 md:pt-40 md:pb-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 hero-pattern opacity-50 dark:opacity-20 -z-10 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className={`max-w-3xl mx-auto px-4 ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-widest mb-6 border border-rose-200 dark:border-rose-500/20 shadow-sm">
              <MessageSquare className="w-4 h-4" /> Digital Wall
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-[5rem] font-black tracking-tighter mb-4 leading-tight">
              Guest<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">book.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#86868b] dark:text-[#a1a1a6] font-medium max-w-xl mx-auto mb-10">
              แวะมาลงชื่อ หรือฝากข้อความทักทายพวกเรา SE Gen 4 ได้ที่นี่เลย!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium text-zinc-500 bg-white/40 dark:bg-white/5 py-4 px-6 rounded-full max-w-2xl mx-auto border border-white/40 dark:border-white/10 backdrop-blur-md">
              <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500"/> ใช้คำสุภาพ</span>
              <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
              <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-500"/> ข้อความขึ้นทันทีแบบ Real-time</span>
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-32 relative z-10">
          <div className={`bg-white/70 dark:bg-[#121214]/70 backdrop-blur-2xl border border-white dark:border-zinc-800/80 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-none mb-12 relative overflow-hidden ${css`animation: ${fadeInUp} 1s ease-out 0.1s both;`}`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 pl-2">ชื่อของคุณ (Name) <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="เช่น สมชาย, John Doe" 
                  maxLength={50} 
                  className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-black focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all duration-300 shadow-inner" 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 pl-2">ข้อความ (Message) <span className="text-rose-500">*</span></label>
                <textarea 
                  required 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="พิมพ์ข้อความทักทายที่นี่..." 
                  rows={4} 
                  maxLength={300} 
                  className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-black focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none resize-none transition-all duration-300 shadow-inner"
                ></textarea>
              </div>
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white px-8 py-3.5 rounded-full font-bold text-[15px] flex items-center gap-2 transition-all shadow-[0_10px_20px_rgba(244,63,94,0.2)] hover:shadow-[0_10px_25px_rgba(244,63,94,0.4)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                  {isSubmitting ? 'กำลังส่ง...' : 'โพสต์ข้อความ'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Messages</h3>
              <div className="h-px flex-1 bg-gray-200 dark:bg-zinc-800/80"></div>
              <span className="text-sm font-bold text-zinc-400 bg-gray-100 dark:bg-zinc-900 px-3 py-1 rounded-full">{messages.length}</span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-10 h-10 animate-spin text-rose-500" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-[#121214]/40 border-2 border-dashed border-gray-200 dark:border-zinc-800/80 rounded-[2.5rem]">
                <MessageSquare className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-lg font-bold text-zinc-500 dark:text-zinc-400 mb-1">ยังไม่มีข้อความ</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">มาเป็นคนแรกที่ฝากข้อความทักทายพวกเราสิ!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((msg, index) => {
                  const gradients = ["from-rose-400 to-orange-500", "from-blue-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-purple-400 to-fuchsia-500", "from-amber-400 to-yellow-500"];
                  const gradient = gradients[(msg.name.charCodeAt(0) || 0) % gradients.length];
                  return (
                    <div 
                      key={msg.id} 
                      className={`relative p-6 sm:p-8 bg-white dark:bg-[#121214] border border-gray-100 dark:border-zinc-800/80 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow group ${css`animation: ${fadeInUp} 0.5s ease-out${index * 0.05}s both;`}`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-black text-xl shadow-sm shrink-0`}>
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-3 gap-1">
                            <span className="font-bold text-zinc-900 dark:text-white text-[16px] truncate pr-4">{msg.name}</span>
                            <span className="text-[11px] text-zinc-400 font-mono tracking-tight bg-gray-50 dark:bg-zinc-900/80 px-2.5 py-1 rounded-md shrink-0 border border-gray-100 dark:border-zinc-800">
                              {new Date(msg.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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