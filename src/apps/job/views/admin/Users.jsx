// src/apps/job/views/admin/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Users as UsersIcon, Search, ShieldAlert, Ban, CheckCircle2, 
  Settings2, X, Save, Edit2, ShieldCheck, Trash2, UserPlus, Lock, KeyRound, Loader2, AlertCircle
} from 'lucide-react';
import 'animate.css';

export default function Users() {
  const { userProfile } = useOutletContext();
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  
  // Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', nickname: '', role: '' });
  
  // Reset Password State (Inside Manage Modal)
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  const [showResetPwdFields, setShowResetPwdFields] = useState(false);
  const [resetPwdForm, setResetPwdForm] = useState({ newPassword: '', confirmPassword: '' });

  // Create User States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '', password: '', confirmPassword: '', email: '', 
    facebook: '', instagram: '', phone: '', first_name: '', last_name: '', nickname: ''
  });

  const preventAction = (e) => e.preventDefault();

  const isSuperAdmin = useMemo(() => userProfile?.role === 'Super Admin', [userProfile]);
  const isAdmin = useMemo(() => userProfile?.role === 'Admin', [userProfile]);

  const canManage = (targetUser) => {
    if (isSuperAdmin) return true; 
    if (isAdmin && targetUser.role === 'User') return true; 
    return false; 
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Function for displaying toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 5000);
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false }) 
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน');
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = logData.type === 'delete' ? 16711680 : logData.type === 'ban' ? 15158332 : logData.type === 'create' ? 3066993 : logData.type === 'pwd_reset' ? 3447003 : 16753920; 
      const adminName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: logData.actionTitle,
          color: color,
          fields: [
            { name: "👤 บัญชีเป้าหมาย", value: logData.targetName, inline: true },
            { name: "📝 รายละเอียด", value: logData.details, inline: true },
            { name: "👮 ผู้ทำรายการ", value: `${adminName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  // ---------------- CREATE USER ---------------- //
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน!');
      return;
    }

    setIsCreating(true);
    try {
      const finalEmail = createForm.email.includes('@') 
        ? createForm.email.trim() 
        : `${createForm.email.trim()}@se-rmutl.com`;

      const { data, error } = await supabase.auth.signUp({
        email: finalEmail,
        password: createForm.password,
        options: {
          data: {
            username: createForm.username,
            first_name: createForm.first_name,
            last_name: createForm.last_name,
            nickname: createForm.nickname,
            phone: createForm.phone,
            facebook: createForm.facebook,
            instagram: createForm.instagram,
            role: 'User' 
          }
        }
      });

      if (error) throw error;

      await sendDiscordLog({
        actionTitle: "🆕 สร้างบัญชีผู้ใช้ใหม่ (โดย Admin)",
        targetName: `${createForm.first_name} ${createForm.last_name}`,
        details: `Email: ${finalEmail}\nUsername: ${createForm.username}`,
        type: "create"
      });

      showToast('สร้างบัญชีผู้ใช้งานสำเร็จ!', 'success');
      setIsCreateModalOpen(false);
      
      setCreateForm({
        username: '', password: '', confirmPassword: '', email: '', 
        facebook: '', instagram: '', phone: '', first_name: '', last_name: '', nickname: ''
      });
      
      fetchUsers();
    } catch (error) {
      showToast(`เกิดข้อผิดพลาดในการสร้างบัญชี: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // ---------------- MANAGE USER ---------------- //
  const openManageModal = (user) => {
    setSelectedUser(user);
    setForm({ 
      first_name: user.first_name || '', 
      last_name: user.last_name || '', 
      nickname: user.nickname || '', 
      role: user.role || 'User' 
    });
    setResetPwdForm({ newPassword: '', confirmPassword: '' });
    setShowResetPwdFields(false);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setShowResetPwdFields(false);
    document.body.style.overflow = 'auto';
  };

  const saveUserData = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form };
      const { error } = await supabase.from('profiles').update(payload).eq('id', selectedUser.id);
      if (error) throw error;

      setUsersList(usersList.map(u => u.id === selectedUser.id ? { ...u, ...payload } : u));
      await sendDiscordLog({
        actionTitle: "✏️ แก้ไขข้อมูล/สิทธิ์ผู้ใช้งาน",
        targetName: payload.first_name,
        details: `ปรับเป็นสิทธิ์: ${payload.role}`,
        type: "update"
      });

      closeModal();
      showToast('บันทึกการแก้ไขเรียบร้อยแล้ว', 'success');
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------------- RESET PASSWORD (ADMIN ACTION) ---------------- //
  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    
    if (resetPwdForm.newPassword !== resetPwdForm.confirmPassword) {
      return showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
    }
    
    if (resetPwdForm.newPassword.length < 6) {
      return showToast('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะทำการเปลี่ยนรหัสผ่านใหม่ให้กับบัญชี ${selectedUser.first_name}?`)) return;

    setIsResettingPwd(true);
    try {
      // เรียกใช้ API Route ที่อยู่บน Cloudflare Pages
      const response = await fetch('/api/reset-password', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          newPassword: resetPwdForm.newPassword 
        })
      });
      
      if (!response.ok) {
         const errData = await response.json().catch(()=>({}));
         throw new Error(errData.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      }

      await sendDiscordLog({
        actionTitle: "🔑 บังคับเปลี่ยนรหัสผ่านผู้ใช้งาน (Admin Override)",
        targetName: `${selectedUser.first_name} ${selectedUser.last_name}`,
        details: `แอดมินทำการตั้งค่ารหัสผ่านใหม่ให้ผู้ใช้`,
        type: "pwd_reset"
      });

      showToast(`เปลี่ยนรหัสผ่านให้ ${selectedUser.first_name} สำเร็จ!`, 'success');
      setShowResetPwdFields(false);
      setResetPwdForm({ newPassword: '', confirmPassword: '' });
      
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsResettingPwd(false);
    }
  };

  const toggleBanStatus = async () => {
    const isCurrentlyBanned = isBanned(selectedUser.is_banned_until);
    const confirmMsg = isCurrentlyBanned 
      ? `ต้องการปลดระงับบัญชีของ ${selectedUser.first_name} หรือไม่?` 
      : `⚠️️ ต้องการระงับบัญชีของ ${selectedUser.first_name} หรือไม่?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const banDate = isCurrentlyBanned ? null : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('profiles').update({ is_banned_until: banDate }).eq('id', selectedUser.id);
      if (error) throw error;

      setUsersList(usersList.map(u => u.id === selectedUser.id ? { ...u, is_banned_until: banDate } : u));
      setSelectedUser({ ...selectedUser, is_banned_until: banDate });

      await sendDiscordLog({
        actionTitle: isCurrentlyBanned ? "✅ ปลดระงับการใช้งานบัญชี" : "🚫 ระงับการใช้งานบัญชี",
        targetName: selectedUser.first_name,
        details: isCurrentlyBanned ? "สถานะ: Active" : "สถานะ: Banned",
        type: "ban"
      });

      showToast(isCurrentlyBanned ? 'ปลดแบนเรียบร้อยแล้ว' : 'ระงับบัญชีเรียบร้อยแล้ว', 'success');
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm(`🚨 คำเตือน: การลบบัญชี ${selectedUser.first_name} จะทำให้ข้อมูลการส่งงานและประวัติหายไปทั้งหมด!\nคุณยืนยันที่จะลบใช่หรือไม่?`)) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', selectedUser.id);
      if (error) throw error;

      await sendDiscordLog({
        actionTitle: "🗑️ ลบบัญชีผู้ใช้งาน",
        targetName: selectedUser.first_name,
        details: "ลบข้อมูลออกจาก Database แล้ว",
        type: "delete"
      });

      setUsersList(usersList.filter(u => u.id !== selectedUser.id));
      closeModal();
      showToast('ลบบัญชีผู้ใช้ถาวรเรียบร้อยแล้ว', 'success');
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  const isBanned = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.nickname || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [usersList, searchQuery]);

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10 relative">
      
      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-md px-4 pointer-events-none flex flex-col items-center">
        {toast.show && (
          <div className={`animate__animated animate__fadeInDown animate__faster w-full flex items-start gap-3 p-4 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-md
            ${toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' : 
              'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'}`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'error' })} className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm shrink-0">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">จัดการบัญชีผู้ใช้งาน</h1>
            <p className="text-sm text-zinc-500">ดูข้อมูล แก้ไขสิทธิ์ และจัดการสถานะบัญชี</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, ชื่อเล่น, หรืออีเมล..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0071e3] transition-colors"
            />
          </div>
          
          {isSuperAdmin && (
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white text-sm font-bold rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> สร้างผู้ใช้งาน
            </button>
          )}
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[50vh]">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#0071e3]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[800px]">
              <thead className="border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                <tr>
                  <th className="pb-4 px-4 w-16">Profile</th>
                  <th className="pb-4 px-4">ชื่อ-นามสกุล</th>
                  <th className="pb-4 px-4">ข้อมูลติดต่อ</th>
                  <th className="pb-4 px-4 w-32">สิทธิ์/สถานะ</th>
                  <th className="pb-4 px-4 w-24 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="py-10 text-center text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl block mt-4 bg-gray-50 dark:bg-white/5">ไม่พบข้อมูลผู้ใช้งาน</td></tr>
                ) : (
                  filteredUsers.map(user => {
                    const banned = isBanned(user.is_banned_until);
                    const hasAccess = canManage(user);

                    return (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden shrink-0">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : user.first_name?.charAt(0) || 'U'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-zinc-900 dark:text-white">{user.first_name} {user.last_name}</div>
                          <div className="text-[11px] font-mono opacity-70 mt-0.5">@{user.username || user.nickname || 'user'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-zinc-500">{user.email || 'No email provided'}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{user.phone || '-'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${user.role === 'Super Admin' ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10' : user.role === 'Admin' ? 'bg-[#0071e3]/10 text-[#0071e3] border-[#0071e3]/20' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                              {user.role}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${banned ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10'}`}>
                              {banned ? <><ShieldAlert className="w-2.5 h-2.5"/> Banned</> : <><CheckCircle2 className="w-2.5 h-2.5"/> Active</>}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {hasAccess ? (
                            <button onClick={() => openManageModal(user)} className="p-2 text-[#0071e3] bg-blue-50 hover:bg-blue-100 dark:bg-[#0071e3]/10 dark:hover:bg-[#0071e3]/20 rounded-lg transition-colors">
                              <Settings2 className="w-4 h-4"/>
                            </button>
                          ) : (
                            <button disabled className="p-2 text-zinc-300 dark:text-zinc-700 cursor-not-allowed">
                              <Ban className="w-4 h-4"/>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal จัดการผู้ใช้งาน */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster" onClick={closeModal}>
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster" onClick={e=>e.stopPropagation()}>
            
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#121214] shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0071e3]" /> จัดการบัญชี
              </h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-white bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b]">
              
              <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-50 dark:bg-[#121214] rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover"/> : selectedUser.first_name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden w-full">
                  <h3 className="font-bold text-zinc-900 dark:text-white truncate">{selectedUser.email}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">ID: {selectedUser.id}</p>
                </div>
              </div>

              {/* Form อัปเดตข้อมูล */}
              <form onSubmit={saveUserData} className="space-y-4 mb-8 pb-8 border-b border-zinc-200 dark:border-zinc-800/80">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">ชื่อจริง</label>
                    <input type="text" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 mb-1">นามสกุล</label>
                    <input type="text" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">ชื่อเล่น</label>
                  <input type="text" value={form.nickname} onChange={e => setForm({...form, nickname: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-1">ระดับสิทธิ์ (Role)</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]">
                    <option value="User">User (นักศึกษา)</option>
                    <option value="Admin">Admin (แอดมิน)</option>
                    {isSuperAdmin && <option value="Super Admin">Super Admin (ผู้ดูแลระบบสูงสุด)</option>}
                  </select>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isSaving} className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95 disabled:opacity-50">
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}
                  </button>
                </div>
              </form>

              {/* ---------------- RESET PASSWORD SECTION ---------------- */}
              <div className="mb-8">
                {!showResetPwdFields ? (
                  <button 
                    onClick={() => setShowResetPwdFields(true)}
                    className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1e1e24] dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
                  >
                    <KeyRound className="w-4 h-4" /> บังคับตั้งรหัสผ่านใหม่ (Admin Override)
                  </button>
                ) : (
                  <form onSubmit={handleAdminResetPassword} className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 space-y-4 animate__animated animate__fadeIn">
                    <h3 className="text-sm font-bold text-orange-600 dark:text-orange-500 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> เปลี่ยนรหัสผ่านให้ผู้ใช้นี้
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <input 
                          type="text" required placeholder="รหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)"
                          value={resetPwdForm.newPassword} onChange={e => setResetPwdForm({...resetPwdForm, newPassword: e.target.value})}
                          className="w-full bg-white dark:bg-black border border-orange-200 dark:border-orange-900/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" required placeholder="ยืนยันรหัสผ่านใหม่"
                          value={resetPwdForm.confirmPassword} onChange={e => setResetPwdForm({...resetPwdForm, confirmPassword: e.target.value})}
                          className="w-full bg-white dark:bg-black border border-orange-200 dark:border-orange-900/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setShowResetPwdFields(false)} className="px-4 py-2 bg-white dark:bg-black text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold transition-colors">
                        ยกเลิก
                      </button>
                      <button type="submit" disabled={isResettingPwd} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                        {isResettingPwd ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 
                        ยืนยันเปลี่ยนรหัสผ่าน
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* ---------------- ACTION ZONE FOR BAN & DELETE ---------------- */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleBanStatus}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${isBanned(selectedUser.is_banned_until) ? 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300' : 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-900/50'}`}
                >
                  {isBanned(selectedUser.is_banned_until) ? <><CheckCircle2 className="w-4 h-4"/> ปลดระงับบัญชี</> : <><Ban className="w-4 h-4"/> ระงับบัญชี (Ban)</>}
                </button>

                <button 
                  onClick={deleteAccount}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-900/50 transition-all"
                >
                  <Trash2 className="w-4 h-4"/> ลบบัญชีผู้ใช้ถาวร
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Modal สร้างผู้ใช้งานใหม่ (Super Admin Only) (ส่วนนี้เหมือนเดิม) */}
      {isCreateModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster">
            
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#121214] shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0071e3]" /> สร้างผู้ใช้งานใหม่
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-white bg-white dark:bg-zinc-800 p-1.5 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#09090b]">
              <form onSubmit={handleCreateUser} className="space-y-6">
                
                {/* 1. Account Info */}
                <div className="p-5 bg-zinc-50 dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">ข้อมูลบัญชี (Account)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Username</label>
                      <input type="text" required value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Email <span className="font-normal opacity-70">(ไม่ต้องใส่ @se-rmutl.com ก็ได้)</span></label>
                      <input type="text" required placeholder="เช่น somchai" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">รหัสผ่าน (Password)</label>
                      <input type="password" required minLength="6" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">ยืนยันรหัสผ่าน (Confirm Password)</label>
                      <input type="password" required minLength="6" value={createForm.confirmPassword} onChange={e => setCreateForm({...createForm, confirmPassword: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                  </div>
                </div>

                {/* 2. Personal Info */}
                <div className="p-5 bg-zinc-50 dark:bg-[#121214] rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">ข้อมูลส่วนตัว (Personal Info)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">ชื่อจริง (Name)</label>
                      <input type="text" required value={createForm.first_name} onChange={e => setCreateForm({...createForm, first_name: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">นามสกุล (Surname)</label>
                      <input type="text" required value={createForm.last_name} onChange={e => setCreateForm({...createForm, last_name: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">ชื่อเล่น (Nickname)</label>
                      <input type="text" value={createForm.nickname} onChange={e => setCreateForm({...createForm, nickname: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">เบอร์โทรศัพท์ (Tel)</label>
                      <input type="tel" value={createForm.phone} onChange={e => setCreateForm({...createForm, phone: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Facebook</label>
                      <input type="text" value={createForm.facebook} onChange={e => setCreateForm({...createForm, facebook: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">Instagram</label>
                      <input type="text" value={createForm.instagram} onChange={e => setCreateForm({...createForm, instagram: e.target.value})} className="w-full bg-white dark:bg-[#1e1e24] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 pb-4">
                  <button type="submit" disabled={isCreating} className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isCreating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <UserPlus className="w-5 h-5"/>}
                    {isCreating ? 'กำลังประมวลผล...' : 'ยืนยันการสร้างบัญชีผู้ใช้งาน'}
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