// src/apps/job/views/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { ArrowLeft, Globe, Clock, Sun, Moon, Eye, EyeOff, User, Phone, Lock, CheckCircle2, Mail, AlertCircle, X } from 'lucide-react';
import SEO from '../../../components/seo/SEO';
import 'animate.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' }); // type: 'error' | 'success'
  
  const [form, setForm] = useState({ 
    firstName: '', 
    lastName: '', 
    phone: '', 
    email: '',
    newPassword: '', 
    confirmPassword: '' 
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [publicIp, setPublicIp] = useState('Fetching IP...');

  const preventAction = (e) => e.preventDefault();

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
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false }) + ' น.');
    updateTime();
    const timer = setInterval(updateTime, 1000);
    fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => setPublicIp(d.ip)).catch(() => setPublicIp('Unknown'));
    return () => clearInterval(timer);
  }, []);

  // Function for displaying toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 5000); // Hide after 5 seconds
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // 1. Client-side Validation
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim() || !form.email.trim() || !form.newPassword || !form.confirmPassword) {
      return showToast('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
    
    if (form.newPassword !== form.confirmPassword) {
      return showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
    }
    
    if (form.newPassword.length < 6) {
      return showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }
    
    let formattedEmail = form.email.trim().toLowerCase();
    if (!formattedEmail.includes('@')) {
      formattedEmail = `${formattedEmail}@se-rmutl.com`;
    }

    setIsLoading(true);
    setToast({ show: false, message: '', type: 'error' });
    
    try {
      // 2. Verify User Data in Database
      // Query profile matching the provided details
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('first_name', form.firstName.trim())
        .ilike('last_name', form.lastName.trim())
        .eq('phone', form.phone.trim())
        .eq('email', formattedEmail) // Ensure email matches too (requires 'email' column in 'profiles' table)
        .maybeSingle();

      if (profileError || !profile) {
        // Use generic message to prevent enumeration
        throw new Error('ข้อมูลไม่ถูกต้อง หรือไม่พบข้อมูลผู้ใช้งานที่ตรงกับระบบ');
      }

      // 3. Update Password
      // Since this is a client-side request and the user is NOT logged in, 
      // we CANNOT use `supabase.auth.updateUser` directly without a session.
      // We must rely on an Edge Function or RPC if we don't use email links.
      
      // Attempting to call the external API route (which might be causing the 404 issue if not setup correctly)
      const response = await fetch('/api/reset-password', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, newPassword: form.newPassword })
      });
      
      if (!response.ok) {
         const errData = await response.json().catch(()=>({}));
         throw new Error(errData.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ (API Route ไม่พร้อมใช้งาน)');
      }
      
      setStep(3); // Success step
    } catch (err) {
      console.error(err);
      showToast(err.message || 'เกิดข้อผิดพลาดในการยืนยันข้อมูลหรือรีเซ็ตรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Account Recovery | SE-Job" 
        description="กู้คืนรหัสผ่านและเข้าสู่ระบบ SE-Job Workspace"
        url="/sework/forgot-password"
      />
      
      {/* Toast Notification Container */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none flex flex-col items-center">
        {toast.show && (
          <div className={`animate__animated animate__fadeInDown animate__faster w-full flex items-start gap-3 p-4 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-md
            ${toast.type === 'error' ? 'bg-red-50/90 dark:bg-red-950/80 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' : 
              'bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'}`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button 
              onClick={() => setToast({ show: false, message: '', type: 'error' })}
              className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative px-4 select-none">
        
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-50">
          <button onClick={() => navigate('/sework/login')} className="flex items-center gap-2 text-sm font-medium bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm hover:scale-105 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าเข้าสู่ระบบ
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-all outline-none">
            {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-[#0071e3]" />}
          </button>
        </div>

        <div className="w-full max-w-lg z-10 animate__animated animate__fadeInUp py-20">
          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-zinc-800/80 min-h-[420px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071e3] to-indigo-500"></div>
            
            {step === 1 && (
              <div className="animate__animated animate__fadeIn">
                <div className="text-center mb-8">
                  {/* เปลี่ยนจากไอคอน User เป็น logo.png */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 mb-5 p-2 shadow-sm">
                     <img src="/logo.png" alt="SE Logo" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-2xl font-black mb-2 tracking-tight">Account Recovery</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">กรอกข้อมูลส่วนตัวและรหัสผ่านใหม่เพื่อยืนยัน</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  
                  {/* Personal Info Group */}
                  <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-[#09090b]/50 border border-gray-100 dark:border-zinc-800/50 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0071e3]"/> ข้อมูลยืนยันตัวตน
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input 
                          type="text" required value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} 
                          className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all shadow-inner" 
                          placeholder="ชื่อจริง"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" required value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} 
                          className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all shadow-inner" 
                          placeholder="นามสกุล"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="tel" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all shadow-inner" 
                          placeholder="เบอร์โทรศัพท์ (08X-XXX-XXXX)" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                          type="text" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 transition-all shadow-inner" 
                          placeholder="อีเมล หรือ Student ID" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* New Password Group */}
                  <div className="p-5 rounded-2xl bg-zinc-50/50 dark:bg-[#09090b]/50 border border-gray-100 dark:border-zinc-800/50 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500"/> ตั้งรหัสผ่านใหม่
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'} required value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})} 
                          className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner" 
                          placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 outline-none hover:text-indigo-500 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                          className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-inner" 
                          placeholder="ยืนยันรหัสผ่านใหม่"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400 outline-none hover:text-indigo-500 transition-colors">
                          {showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full py-4 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-2xl font-bold mt-2 shadow-[0_10px_20px_rgba(0,113,227,0.2)] hover:shadow-[0_10px_25px_rgba(0,113,227,0.4)] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        กำลังตรวจสอบและบันทึก...
                      </span>
                    ) : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="animate__animated animate__zoomIn text-center flex flex-col items-center justify-center h-full py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 mb-6 shadow-inner border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-black mb-3 tracking-tight">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-10 max-w-[280px] leading-relaxed">รหัสผ่านของคุณถูกอัปเดตเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที</p>
                <button onClick={() => navigate('/sework/login')} className="w-full py-4 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-2xl font-bold active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(0,113,227,0.2)]">
                  ไปที่หน้าเข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="fixed bottom-6 flex items-center justify-center gap-4 px-5 py-2.5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm text-xs font-mono text-zinc-500 z-10">
          <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /><span>IP: {publicIp}</span></div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
          <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>TH: {currentTime}</span></div>
        </div>
      </div>
    </>
  );
}