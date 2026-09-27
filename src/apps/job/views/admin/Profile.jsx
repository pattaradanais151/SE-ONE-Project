// src/apps/job/views/admin/Profile.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  UserCircle, Camera, Save, Lock, Eye, EyeOff, 
  Phone, Instagram, Facebook, ShieldCheck, Loader2
} from 'lucide-react';
import 'animate.css';

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', nickname: '',
    phone: '', instagram: '', facebook: '', avatar_url: '', role: ''
  });

  const [pwdForm, setPwdForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        setCurrentUser(session.user);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error) throw error;
        
        if (data) {
          setForm({
            first_name: data.first_name || '', last_name: data.last_name || '',
            nickname: data.nickname || '', phone: data.phone || '',
            instagram: data.instagram || '', facebook: data.facebook || '',
            avatar_url: data.avatar_url || '', role: data.role || 'Admin'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (actionType) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const title = actionType === 'profile' ? "📝 แอดมินอัปเดตโปรไฟล์ส่วนตัว" : "🔑 แอดมินเปลี่ยนรหัสผ่าน";
      const color = actionType === 'profile' ? 3447003 : 16753920;
      const userName = form.first_name || currentUser?.email;

      const payload = {
        embeds: [{
          title: title,
          color: color,
          fields: [
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${form.role})`, inline: true },
            { name: "📧 อีเมล", value: currentUser?.email || '-', inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', currentUser.id);
      if (dbError) throw dbError;
      
      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      await sendDiscordLog('profile');
      alert('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        first_name: form.first_name, last_name: form.last_name,
        nickname: form.nickname, phone: form.phone,
        instagram: form.instagram, facebook: form.facebook
      };

      const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      if (error) throw error;

      await sendDiscordLog('profile');
      alert('บันทึกข้อมูลส่วนตัวสำเร็จ');
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return alert('รหัสผ่านไม่ตรงกัน');
    if (pwdForm.newPassword.length < 6) return alert('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');

    setIsChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwdForm.newPassword });
      if (error) throw error;

      await sendDiscordLog('password');
      setPwdForm({ newPassword: '', confirmPassword: '' });
      alert('เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsChangingPwd(false);
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="w-12 h-12 bg-blue-50 dark:bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm shrink-0">
          <UserCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ตั้งค่าโปรไฟล์</h1>
          <p className="text-sm text-zinc-500">จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#0071e3]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Avatar & Account Info */}
          <div className="lg:col-span-4 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center">
            
            <div className="relative w-32 h-32 mb-6 group">
              <div className="w-full h-full rounded-[2rem] bg-gradient-to-br from-[#0071e3] to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden">
                {form.avatar_url ? <img src={form.avatar_url} className="w-full h-full object-cover"/> : form.first_name.charAt(0) || 'A'}
              </div>
              <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#0071e3] rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95">
                <input type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" disabled={isUploading} />
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Camera className="w-5 h-5" />}
              </label>
            </div>
            
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">{form.first_name} {form.last_name}</h2>
            <p className="text-sm text-zinc-500 mb-4">{currentUser?.email}</p>
            
            <div className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 dark:bg-[#0071e3]/10 border border-blue-200 dark:border-[#0071e3]/20 text-[#0071e3] rounded-full text-xs font-bold">
              <ShieldCheck className="w-4 h-4"/> สิทธิ์การเข้าถึง: {form.role}
            </div>

          </div>

          {/* Right Column: Forms */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Personal Info Form */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 border-b border-gray-100 dark:border-zinc-800 pb-3">ข้อมูลส่วนตัว</h3>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">ชื่อจริง *</label>
                    <input type="text" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">นามสกุล *</label>
                    <input type="text" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">ชื่อเล่น</label>
                    <input type="text" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"><Phone className="inline w-3.5 h-3.5 mr-1"/> เบอร์โทรศัพท์ *</label>
                    <input type="text" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"><Instagram className="inline w-3.5 h-3.5 mr-1 text-pink-500"/> Instagram</label>
                    <input type="text" value={form.instagram} onChange={e => setForm({...form, instagram: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"><Facebook className="inline w-3.5 h-3.5 mr-1 text-blue-500"/> Facebook</label>
                    <input type="text" value={form.facebook} onChange={e => setForm({...form, facebook: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 outline-none" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isSaving} className="px-8 py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : <><Save className="inline w-4 h-4 mr-2"/> บันทึกการเปลี่ยนแปลง</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 border-b border-gray-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-500" /> เปลี่ยนรหัสผ่าน
              </h3>
              <form onSubmit={updatePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">รหัสผ่านใหม่</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} required value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500">{showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                  <div className="relative">
                    <input type={showConfirmPwd ? "text" : "password"} required value={pwdForm.confirmPassword} onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none" />
                    <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-500">{showConfirmPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isChangingPwd} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50">
                    {isChangingPwd ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : <><Lock className="inline w-4 h-4 mr-2"/> อัปเดตรหัสผ่าน</>}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}