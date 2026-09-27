// src/apps/job/views/ContactProfile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { Sun, Moon, CheckCircle2, User, Phone, Instagram, Facebook } from 'lucide-react';
import 'animate.css';

export default function ContactProfile() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    nickname: '',
    instagram: '',
    facebook: '',
    phone: ''
  });

  // ระบบ Anti-Copy
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/job/login');
          return;
        }
        
        setUserId(session.user.id);
        setUserEmail(session.user.email);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          setFormData({
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            nickname: profile.nickname || '',
            instagram: profile.instagram || '',
            facebook: profile.facebook || '',
            phone: profile.phone || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // ฟังก์ชันส่งแจ้งเตือนเข้า Discord
  const sendDiscordNotification = async (updatedData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const payload = {
        embeds: [
          {
            title: "📝 อัปเดตข้อมูลการติดต่อ (Contact Profile)",
            color: 3447003, // สีฟ้า
            fields: [
              { name: "📧 อีเมลบัญชี", value: userEmail, inline: false },
              { name: "👤 ชื่อ-นามสกุล", value: `${updatedData.first_name} ${updatedData.last_name} (${updatedData.nickname || '-'})`, inline: true },
              { name: "📱 เบอร์โทรศัพท์", value: updatedData.phone, inline: true },
              { name: "🌐 โซเชียลมีเดีย", value: `IG: ${updatedData.instagram || '-'}\nFB: ${updatedData.facebook || '-'}`, inline: false }
            ],
            footer: { text: "SE Portal Workspace Gen 4" },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Discord Notification Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { error } = await supabase.from('profiles').update({
        first_name: formData.first_name,
        last_name: formData.last_name,
        nickname: formData.nickname,
        instagram: formData.instagram,
        facebook: formData.facebook,
        phone: formData.phone,
      }).eq('id', userId);

      if (error) throw error;

      // ส่งแจ้งเตือน Discord เมื่อบันทึกสำเร็จ
      await sendDiscordNotification(formData);

      navigate('/job'); // หรือไปหน้า Dashboard
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-black transition-colors duration-300">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-zinc-800 border-t-[#0071e3] dark:border-t-[#0071e3]"></div>
      </div>
    );
  }

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="min-h-screen flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black p-4 relative transition-colors duration-500 font-sans select-none"
    >
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 animate__animated animate__fadeInDown">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-all text-zinc-500 dark:text-zinc-400"
        >
          {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 w-full max-w-2xl rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate__animated animate__fadeInUp">
        
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-zinc-900 dark:text-white tracking-tight">อัปเดตข้อมูลการติดต่อ</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">จำเป็นต้องกรอกข้อมูลให้ครบถ้วนก่อนเข้าใช้งานระบบ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"><User className="inline w-4 h-4 mr-1"/> ชื่อจริง *</label>
              <input 
                type="text" required value={formData.first_name} 
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">นามสกุล *</label>
              <input 
                type="text" required value={formData.last_name} 
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">ชื่อเล่น</label>
            <input 
              type="text" value={formData.nickname} 
              onChange={(e) => setFormData({...formData, nickname: e.target.value})}
              className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"><Instagram className="inline w-4 h-4 mr-1 text-pink-500"/> Instagram</label>
              <input 
                type="text" value={formData.instagram} 
                onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"><Facebook className="inline w-4 h-4 mr-1 text-blue-500"/> Facebook</label>
              <input 
                type="text" value={formData.facebook} 
                onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"><Phone className="inline w-4 h-4 mr-1"/> เบอร์โทรศัพท์ *</label>
              <input 
                type="text" required value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">อีเมล (ห้ามแก้ไข)</label>
              <input 
                type="email" disabled value={userEmail} 
                className="block w-full px-4 py-3 bg-gray-100 dark:bg-[#09090b]/40 border border-gray-200 dark:border-zinc-800/50 text-gray-500 rounded-xl text-sm cursor-not-allowed outline-none" 
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-3.5 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-70 active:scale-[0.98]"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  กำลังบันทึกข้อมูล...
                </span>
              ) : 'ยืนยันและเข้าสู่ระบบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}