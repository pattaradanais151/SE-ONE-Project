// src/apps/job/views/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { ArrowLeft, Globe, Clock, Sun, Moon, Eye, EyeOff, User, Phone, Lock, CheckCircle2 } from 'lucide-react';
import 'animate.css';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState(null);
  
  const [verifyForm, setVerifyForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [publicIp, setPublicIp] = useState('Fetching IP...');

  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false }) + ' น.');
    updateTime();
    const timer = setInterval(updateTime, 1000);
    fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => setPublicIp(d.ip)).catch(() => setPublicIp('Unknown'));
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true); setErrorMessage('');
    try {
      const { data: profile, error } = await supabase.from('profiles').select('id')
        .ilike('first_name', verifyForm.firstName.trim())
        .ilike('last_name', verifyForm.lastName.trim())
        .eq('phone', verifyForm.phone.trim()).maybeSingle();
      if (error || !profile) throw new Error('ไม่พบข้อมูลผู้ใช้งานที่ตรงกับระบบ หรือข้อมูลไม่ถูกต้อง');
      setVerifiedUserId(profile.id);
      setStep(2);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setErrorMessage('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
    if (passwordForm.newPassword.length < 6) return setErrorMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

    setIsLoading(true); setErrorMessage('');
    try {
      // Logic backend ของ Supabase รีเซ็ตรหัสผ่านผ่าน Admin API หรือ Edge Function
      // ตัวอย่างนี้อ้างอิงจากการ Call API เดิมใน Vue
      const response = await fetch('/api/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: verifiedUserId, newPassword: passwordForm.newPassword })
      });
      if (!response.ok) throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative px-4 select-none">
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-50">
        <button onClick={() => navigate('/job/login')} className="flex items-center gap-2 text-sm font-medium bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm hover:scale-105 transition-all">
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าเข้าสู่ระบบ
        </button>
        <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:scale-110 transition-all">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-[440px] z-10 animate__animated animate__fadeInUp">
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white dark:border-zinc-800/80 min-h-[420px] flex flex-col justify-center">
          
          {step === 1 && (
            <div className="animate__animated animate__fadeIn">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-black mb-4">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Account Recovery</h2>
                <p className="text-sm text-zinc-500">กรุณากรอกข้อมูลส่วนตัวให้ตรงกับที่ลงทะเบียนไว้</p>
              </div>

              {errorMessage && <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-red-600 text-sm text-center animate__animated animate__shakeX">{errorMessage}</div>}

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อจริง</label>
                    <input type="text" required value={verifyForm.firstName} onChange={e => setVerifyForm({...verifyForm, firstName: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">นามสกุล</label>
                    <input type="text" required value={verifyForm.lastName} onChange={e => setVerifyForm({...verifyForm, lastName: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="tel" required value={verifyForm.phone} onChange={e => setVerifyForm({...verifyForm, phone: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#0071e3]" placeholder="08X-XXX-XXXX" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 bg-[#0071e3] text-white rounded-xl font-medium mt-2 shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                  {isLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันตัวตน'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate__animated animate__fadeIn">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-black mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold mb-2">ตั้งรหัสผ่านใหม่</h2>
              </div>
              {errorMessage && <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl text-red-600 text-sm text-center">{errorMessage}</div>}
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสผ่านใหม่</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full pl-4 pr-12 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl outline-none focus:border-[#0071e3]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400">{showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ยืนยันรหัสผ่านใหม่</label>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} required value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full pl-4 pr-12 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl outline-none focus:border-[#0071e3]" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 text-zinc-400">{showConfirmPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 bg-[#0071e3] text-white rounded-xl font-medium mt-2 shadow-lg active:scale-[0.98]">
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="animate__animated animate__zoomIn text-center flex flex-col items-center justify-center h-full py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3">เปลี่ยนรหัสผ่านสำเร็จ!</h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-[280px]">รหัสผ่านของคุณถูกอัปเดตเรียบร้อยแล้ว เข้าสู่ระบบได้ทันที</p>
              <button onClick={() => navigate('/job/login')} className="w-full py-3.5 px-4 bg-[#0071e3] text-white rounded-xl font-medium active:scale-[0.98]">
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="fixed bottom-6 flex items-center justify-center gap-4 px-5 py-2.5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm text-xs font-mono text-zinc-500 z-10">
        <div className="flex items-center gap-2"><Globe className="w-3.5 h-3.5" /><span>IP: {publicIp}</span></div>
        <div className="w-1 h-1 rounded-full bg-zinc-400"></div>
        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>TH: {currentTime}</span></div>
      </div>
    </div>
  );
}