// src/apps/landing/SupportApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { 
  Sun, Moon, LifeBuoy, Send, Loader2, HelpCircle, 
  ChevronDown, Mail, MessageCircle
} from 'lucide-react';
import 'animate.css';

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function SupportApp() {
  const navigate = useNavigate();
  
  // 🌓 บันทึก Theme ลง localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  }); 
  const [scrolled, setScrolled] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "เข้าสู่ระบบ (Login) ไม่ได้ ต้องทำอย่างไร?",
      a: "หากคุณลืมรหัสผ่าน หรือเข้าสู่ระบบไม่ได้ โปรดติดต่อแอดมินประจำสาขาผ่านทาง Discord หรือส่ง Ticket แจ้งปัญหาด้านล่าง เพื่อขอทำการรีเซ็ตรหัสผ่านใหม่"
    },
    {
      q: "ระบบ SE-Job ใช้ทำอะไรได้บ้าง?",
      a: "ระบบ SE-Job ถูกออกแบบมาเพื่อนักศึกษาสาขาวิศวกรรมซอฟต์แวร์โดยเฉพาะ ใช้สำหรับจัดการการส่งงาน ดูตารางเรียน รับประกาศสำคัญจากอาจารย์ และติดตามคะแนนเก็บของคุณแบบเรียลไทม์"
    },
    {
      q: "ต้องการติดต่อจ้างงานนักพัฒนา ต้องทำอย่างไร?",
      a: "คุณสามารถเข้าไปที่หน้า 'Talents' เพื่อค้นหาโปรไฟล์และความเชี่ยวชาญของนักพัฒนาแต่ละคน และสามารถติดต่อพวกเขาผ่าน GitHub หรือช่องทางที่พวกเขาระบุไว้ได้โดยตรง"
    },
    {
      q: "พบเจอบั๊ก (Bug) ในระบบ แจ้งได้ที่ไหน?",
      a: "คุณสามารถแจ้งบั๊กได้โดยการกรอกฟอร์ม 'Submit a Ticket' ในหน้านี้ โดยเลือกหัวข้อเป็น 'รายงานปัญหา/บั๊ก' ทีมผู้พัฒนาจะรีบดำเนินการแก้ไขโดยเร็วที่สุด"
    }
  ];

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
  // 🌓 Theme & Scroll Management
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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // ------------------------------------------
  // 📨 ยิงแจ้งเตือนไป Discord โดยตรง (ไม่ลง Database)
  // ------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !subject.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
      if (!webhookUrl) {
        throw new Error("ระบบยังไม่ได้ตั้งค่า Discord Webhook");
      }

      // จัดเตรียมข้อมูลส่งเข้า Discord แบบ Embed (การ์ดข้อความสวยๆ)
      const embed = {
        title: "🆘 New Support Ticket (แจ้งปัญหา/ติดต่อ)",
        color: 3447003, // สีน้ำเงิน
        fields: [
          { name: "📌 หัวข้อ (Subject)", value: subject, inline: false },
          { name: "📧 อีเมลติดต่อกลับ", value: email, inline: false },
          { name: "📝 รายละเอียด (Message)", value: message, inline: false }
        ],
        footer: { text: "SE Portal Support System" },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!response.ok) throw new Error('ไม่สามารถส่งข้อความไปยัง Discord ได้');
      
      setIsSuccess(true);
      setEmail('');
      setSubject('');
      setMessage('');
      
      // ซ่อนข้อความ Success หลังจาก 5 วินาที
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        .hero-pattern { background-image: radial-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px); background-size: 32px 32px; }
      `}</style>

      {/* ------------------------------------------
          🍎 Global Navbar 
          ------------------------------------------ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm' : 'bg-transparent'}`}>
        <div className="w-full bg-[#1d1d1f] dark:bg-[#121214] text-white text-[11px] py-1.5 flex items-center justify-center gap-2 tracking-wide font-medium relative z-20">
          <LifeBuoy className="w-3 h-3 text-blue-500" /> Need help? We are here to support you.
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
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/roadmap')}>Roadmap</span>
            <span className="cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#0071e3] dark:hover:text-[#0071e3] transition-colors" onClick={() => navigate('/guestbook')}>Guestbook</span>
            <span className="cursor-pointer text-[#0071e3] transition-colors" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>Support</span>
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

      {/* ------------------------------------------
          🍎 Header Section
          ------------------------------------------ */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-50 dark:opacity-20 -z-10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        
        <div className={`max-w-3xl mx-auto px-4 ${css`animation: ${fadeInUp} 0.8s ease-out;`}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-6 border border-blue-200 dark:border-blue-500/20 shadow-sm">
            <LifeBuoy className="w-4 h-4" /> Help Center
          </div>
          <h1 className="text-5xl sm:text-7xl md:text-[5rem] font-black tracking-tighter mb-4 leading-tight">
            How can we <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">help?</span>
          </h1>
          <p className="text-lg md:text-xl text-[#86868b] dark:text-[#a1a1a6] font-medium max-w-xl mx-auto mb-10">
            พบปัญหาการใช้งาน มีข้อสงสัย หรือต้องการติดต่อทีมงาน SE Gen 4 สามารถดูคำตอบเบื้องต้นหรือส่งข้อความหาเราได้เลย
          </p>
        </div>
      </section>

      {/* ------------------------------------------
          🍎 Support Content (FAQ & Form)
          ------------------------------------------ */}
      <section className="max-w-[1200px] mx-auto px-6 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: Contact Info & FAQ */}
          <div className={`flex flex-col gap-8 ${css`animation: ${fadeInUp} 0.8s ease-out 0.1s both;`}`}>
            
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 p-6 rounded-[2rem] shadow-sm flex flex-col items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Email Support</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">ติดต่อเราผ่านทางอีเมล</p>
                  <a href="mailto:support@seone.site" className="text-sm font-bold text-[#0071e3] mt-2 inline-block hover:underline">support@seone.site</a>
                </div>
              </div>
              <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 p-6 rounded-[2rem] shadow-sm flex flex-col items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Discord Channel</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">แชทกับทีมแอดมินโดยตรง</p>
                  <a href="#" className="text-sm font-bold text-[#0071e3] mt-2 inline-block hover:underline">Join our Discord</a>
                </div>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle className="w-5 h-5 text-[#0071e3]" />
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">คำถามที่พบบ่อย (FAQ)</h3>
              </div>
              <div className="flex flex-col gap-3">
                {faqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <button 
                      onClick={() => toggleFaq(index)} 
                      className="w-full flex items-center justify-between p-5 text-left outline-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <span className="font-bold text-zinc-900 dark:text-white pr-4">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48 border-t border-gray-100 dark:border-zinc-800/80' : 'max-h-0'}`}>
                      <p className="p-5 text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50/50 dark:bg-[#09090b]/50">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Support Ticket Form */}
          <div className={`${css`animation: ${fadeInUp} 0.8s ease-out 0.2s both;`}`}>
            <div className="bg-white/70 dark:bg-[#121214]/70 backdrop-blur-2xl border border-white dark:border-zinc-800/80 p-8 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-none relative overflow-hidden h-full flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Submit a Ticket</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">กรอกข้อมูลด้านล่างเพื่อแจ้งปัญหา ทีมงานจะติดต่อกลับทางอีเมลที่คุณระบุไว้</p>
              </div>

              {isSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center animate__animated animate__fadeIn">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                    <LifeBuoy className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ส่งข้อความสำเร็จ!</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm">ทีมงานได้รับข้อความของคุณเรียบร้อยแล้ว และจะรีบดำเนินการตรวจสอบโดยเร็วที่สุด</p>
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 px-6 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-full text-sm transition-colors"
                  >
                    ส่งข้อความใหม่
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 pl-2">อีเมลติดต่อกลับ (Email) <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" required value={email} onChange={e => setEmail(e.target.value)} 
                      placeholder="you@example.com" 
                      className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-black focus:border-[#0071e3] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 shadow-inner"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 pl-2">หัวข้อ (Subject) <span className="text-rose-500">*</span></label>
                    <select 
                      required value={subject} onChange={e => setSubject(e.target.value)} 
                      className="w-full bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-[15px] text-zinc-900 dark:text-white focus:bg-white dark:focus:bg-black focus:border-[#0071e3] focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-300 shadow-inner appearance-none cursor-pointer"
                    >
                      <option value="" disabled>-- เลือกหัวข้อที่ต้องการติดต่อ --</option>
                      <option value="เข้าสู่ระบบไม่ได้/ลืมรหัสผ่าน">เข้าสู่ระบบไม่ได้ / ลืมรหัสผ่าน</option>
                      <option value="รายงานปัญหา/บั๊ก">รายงานปัญหา (Bug Report)</option>
                      <option value="ติดต่อสอบถามทั่วไป">ติดต่อสอบถามทั่วไป</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  </div>

                  <div className="flex flex-col flex-1">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 pl-2">รายละเอียด (Message) <span className="text-rose-500">*</span></label>
                    <textarea 
                      required value={message} onChange={e => setMessage(e.target.value)} 
                      placeholder="อธิบายปัญหาที่คุณพบ หรือข้อความที่ต้องการติดต่อ..." 
                      className="w-full flex-1 min-h-[120px] bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl px-5 py-4 text-[15px] text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-black focus:border-[#0071e3] focus:ring-4 focus:ring-blue-500/10 outline-none resize-none transition-all duration-300 shadow-inner"
                    ></textarea>
                  </div>

                  <div className="flex justify-end mt-2 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                    <button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-3.5 rounded-full font-bold text-[15px] flex items-center gap-2 transition-all shadow-[0_10px_20px_rgba(0,113,227,0.2)] hover:shadow-[0_10px_25px_rgba(0,113,227,0.4)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                      {isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อความ'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </section>

      {/* ------------------------------------------
          🍎 Footer 
          ------------------------------------------ */}
      <footer className="w-full bg-[#fbfbfd] dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-16 transition-colors duration-500 relative z-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[#86868b] dark:text-[#a1a1a6] font-medium tracking-wide">
            <p>Copyright © {new Date().getFullYear()} Pattaradanai Saiwongkham. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span onClick={() => navigate('/pdpa')} className="hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span onClick={() => navigate('/pdpa')} className="border-l border-gray-400 dark:border-gray-700 pl-4 hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer transition-colors">Terms of Use</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}