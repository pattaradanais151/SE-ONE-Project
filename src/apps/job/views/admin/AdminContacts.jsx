// src/apps/job/views/admin/AdminContacts.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  UsersRound, Search, Phone, Instagram, Facebook, 
  X, Edit2, Save, Mail, Camera, Loader2 
} from 'lucide-react';
import 'animate.css';

export default function AdminContacts() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Edit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [editForm, setEditForm] = useState({
    id: '', first_name: '', last_name: '', nickname: '',
    instagram: '', facebook: '', phone: '', avatar_url: ''
  });

  const isSuperAdmin = useMemo(() => userProfile?.role === 'Super Admin', [userProfile]);

  const preventAction = (e) => e.preventDefault();

  // ดึงข้อมูลผู้ใช้งานปัจจุบัน
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setUserProfile(data);
      }
    };
    fetchSession();
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['Admin', 'Super Admin'])
        .order('role', { ascending: false })
        .order('first_name', { ascending: true });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionUser = () => {
    return userProfile?.first_name 
      ? `${userProfile.first_name} (${userProfile.role})` 
      : currentUser?.email?.split('@')[0] || 'Admin';
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;
    try {
      const color = logData.type === 'warning' ? 16753920 : logData.type === 'info' ? 3447003 : 3447003;
      const payload = {
        embeds: [{
          title: logData.title,
          description: logData.description,
          color: color,
          fields: [{ name: "👤 ผู้ทำรายการ", value: logData.user, inline: true }],
          footer: { text: "SE Portal Admin System" },
          timestamp: new Date().toISOString()
        }]
      };
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Log Error:', error);
    }
  };

  const openModal = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({ ...admin });
    setIsEditMode(false);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedAdmin(null);
    document.body.style.overflow = 'auto';
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) setEditForm({ ...selectedAdmin });
  };

  const handleUploadAvatar = async (e) => {
    if (!isSuperAdmin) return alert('เฉพาะ Super Admin เท่านั้นที่สามารถเปลี่ยนรูปโปรไฟล์ได้');
    
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const targetUserId = selectedAdmin.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', targetUserId);
      if (dbError) throw dbError;
      
      setSelectedAdmin(prev => ({ ...prev, avatar_url: publicUrl }));
      setEditForm(prev => ({ ...prev, avatar_url: publicUrl }));
      setAdmins(admins.map(a => a.id === targetUserId ? { ...a, avatar_url: publicUrl } : a));

      await sendDiscordLog({
        title: "📸 เปลี่ยนรูปโปรไฟล์แอดมิน",
        description: `เปลี่ยนรูปโปรไฟล์ของ: ${selectedAdmin.first_name}`,
        type: "info",
        user: getActionUser()
      });

      alert('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const saveContactInfo = async () => {
    if (!isSuperAdmin) return alert('เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขข้อมูลได้');
    
    setIsSaving(true);
    try {
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        nickname: editForm.nickname,
        instagram: editForm.instagram,
        facebook: editForm.facebook,
        phone: editForm.phone
      };

      const { error } = await supabase.from('profiles').update(payload).eq('id', editForm.id);
      if (error) throw error;

      setAdmins(admins.map(a => a.id === editForm.id ? { ...a, ...payload } : a));
      setSelectedAdmin({ ...selectedAdmin, ...payload });

      await sendDiscordLog({
        title: "✏️ แก้ไขข้อมูลแอดมิน",
        description: `อัปเดตข้อมูลการติดต่อของ: ${payload.first_name}`,
        type: "warning",
        user: getActionUser()
      });

      setIsEditMode(false);
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter(a => 
      (a.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="animate__animated animate__fadeIn h-full pb-10 select-none font-sans"
    >
      {/* Header Panel (Apple Glass) */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm">
            <UsersRound className="w-6 h-6"/>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">รายชื่อแอดมิน</h1>
            <p className="text-sm text-zinc-500">คลิกที่การ์ดเพื่อดูและจัดการโปรไฟล์</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น..." 
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" 
          />
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10 text-zinc-500">โหลดข้อมูล...</div>
        ) : filteredAdmins.map(admin => (
          <div 
            key={admin.id} 
            onClick={() => openModal(admin)}
            className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                {admin.avatar_url ? <img src={admin.avatar_url} className="w-full h-full object-cover"/> : admin.first_name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-zinc-900 dark:text-white truncate">{admin.first_name} {admin.last_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${admin.role === 'Super Admin' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400' : 'bg-blue-50 text-[#0071e3] border-blue-200 dark:bg-[#0071e3]/10 dark:text-blue-400'}`}>
                    {admin.role}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">({admin.nickname || '-'})</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 bg-zinc-50 dark:bg-[#09090b] rounded-2xl p-4 border border-gray-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-3 text-sm"><Instagram className="w-4 h-4 text-pink-500 shrink-0"/><span className="text-zinc-700 dark:text-zinc-300 truncate">{admin.instagram || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Facebook className="w-4 h-4 text-[#0071e3] shrink-0"/><span className="text-zinc-700 dark:text-zinc-300 truncate">{admin.facebook || '-'}</span></div>
              <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-emerald-500 shrink-0"/><span className="text-zinc-700 dark:text-zinc-300 truncate">{admin.phone || '-'}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Modal */}
      {isModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster" onClick={closeModal}>
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800 rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate__animated animate__zoomIn animate__faster" onClick={e => e.stopPropagation()}>
            
            <div className="flex-1 overflow-y-auto w-full relative">
              <div className="relative h-24 bg-gradient-to-r from-[#0071e3] to-purple-600 shrink-0 w-full">
                <button onClick={closeModal} className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 backdrop-blur-md p-1.5 rounded-full transition-colors z-50">
                  <X className="w-5 h-5"/>
                </button>
              </div>

              <div className="px-6 pb-6 relative z-10">
                <div className="flex flex-col items-center -mt-12 mb-6 relative">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-[#121214] p-1 shadow-md mb-3 relative group">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0071e3] to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                      {selectedAdmin.avatar_url ? <img src={selectedAdmin.avatar_url} className="w-full h-full object-cover"/> : selectedAdmin.first_name?.charAt(0) || 'A'}
                    </div>
                    {isSuperAdmin && (
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 active:scale-95 z-30">
                        <input type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" disabled={isUploading} />
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Camera className="w-4 h-4" />}
                      </label>
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white text-center">
                    {selectedAdmin.first_name} {selectedAdmin.last_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedAdmin.role === 'Super Admin' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10' : 'bg-blue-50 text-[#0071e3] border-blue-200 dark:bg-[#0071e3]/10'}`}>
                      {selectedAdmin.role}
                    </span>
                    <span className="text-sm text-zinc-500 font-medium">@{selectedAdmin.nickname || 'user'}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">ชื่อจริง</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{selectedAdmin.first_name || '-'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">นามสกุล</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{selectedAdmin.last_name || '-'}</div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">ชื่อเล่น</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.nickname} onChange={e => setEditForm({...editForm, nickname: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium">{selectedAdmin.nickname || '-'}</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">เบอร์โทรศัพท์</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0"/> {selectedAdmin.phone || '-'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">Instagram</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.instagram} onChange={e => setEditForm({...editForm, instagram: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-500 shrink-0"/> {selectedAdmin.instagram || '-'}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">Facebook</label>
                      {isEditMode ? (
                        <input type="text" value={editForm.facebook} onChange={e => setEditForm({...editForm, facebook: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                      ) : (
                        <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 font-medium flex items-center gap-2">
                          <Facebook className="w-4 h-4 text-[#0071e3] shrink-0"/> {selectedAdmin.facebook || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1.5 ml-1">อีเมล (Email) - <span className="font-normal">ห้ามแก้ไข</span></label>
                    <div className="w-full bg-gray-100 dark:bg-[#09090b]/50 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-gray-500 font-medium flex items-center gap-2 cursor-not-allowed">
                      <Mail className="w-4 h-4 shrink-0 opacity-50"/> {selectedAdmin.email || '-'}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#121214] flex justify-end gap-3 shrink-0 rounded-b-[2rem]">
              {isSuperAdmin && !isEditMode && (
                <button onClick={toggleEditMode} className="px-5 py-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> แก้ไขข้อมูล
                </button>
              )}
              
              {isEditMode && (
                <>
                  <button onClick={toggleEditMode} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:text-white rounded-xl font-bold text-sm transition-colors">
                    ยกเลิก
                  </button>
                  <button onClick={saveContactInfo} disabled={isSaving} className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-md disabled:opacity-50">
                    {isSaving ? 'กำลังบันทึก...' : <><Save className="w-4 h-4" /> บันทึกข้อมูล</>}
                  </button>
                </>
              )}
              
              {!isEditMode && !isSuperAdmin && (
                <button onClick={closeModal} className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:text-white rounded-xl font-bold text-sm transition-colors">
                  ปิดหน้าต่าง
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}