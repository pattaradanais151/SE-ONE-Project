// src/apps/job/views/admin/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Users as UsersIcon, Search, ShieldAlert, Ban, CheckCircle2, 
  Settings2, X, Save, Edit2, ShieldCheck, Trash2
} from 'lucide-react';
import 'animate.css';

export default function Users() {
  const { userProfile } = useOutletContext();
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', nickname: '', role: '' });

  const preventAction = (e) => e.preventDefault();

  const isSuperAdmin = useMemo(() => userProfile?.role === 'Super Admin', [userProfile]);
  const isAdmin = useMemo(() => userProfile?.role === 'Admin', [userProfile]);

  // ฟังก์ชันตรวจสอบสิทธิ์การจัดการบัญชีเป้าหมาย
  const canManage = (targetUser) => {
    if (isSuperAdmin) return true; // Super Admin ทำได้ทุกอย่าง
    if (isAdmin && targetUser.role === 'User') return true; // Admin ทำได้เฉพาะกับ User
    return false; // นอกนั้นห้ามทำ
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // ดึงทุกคนในระบบ
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false }) // เรียงสิทธิ์ก่อน
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = logData.type === 'delete' ? 16711680 : logData.type === 'ban' ? 15158332 : 3447003; 
      const adminName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: logData.actionTitle,
          color: color,
          fields: [
            { name: "👤 บัญชีที่ถูกจัดการ", value: logData.targetName, inline: true },
            { name: "รายละเอียด", value: logData.details, inline: true },
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

  const openManageModal = (user) => {
    setSelectedUser(user);
    setForm({ 
      first_name: user.first_name || '', 
      last_name: user.last_name || '', 
      nickname: user.nickname || '', 
      role: user.role || 'User' 
    });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
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
      alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBanStatus = async () => {
    const isCurrentlyBanned = isBanned(selectedUser.is_banned_until);
    const confirmMsg = isCurrentlyBanned 
      ? `ต้องการปลดระงับบัญชีของ ${selectedUser.first_name} หรือไม่?` 
      : `⚠️ ต้องการระงับบัญชีของ ${selectedUser.first_name} หรือไม่?`;
      
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

    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
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
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
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
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">จัดการบัญชีผู้ใช้งาน</h1>
            <p className="text-sm text-zinc-500">ดูข้อมูล แก้ไขสิทธิ์ และจัดการสถานะบัญชี</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อ, ชื่อเล่น, หรืออีเมล..." 
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0071e3] transition-colors"
          />
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
                          <div className="text-[11px] font-mono opacity-70 mt-0.5">@{user.nickname || 'user'}</div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster">
            
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
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
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">{selectedUser.email}</h3>
                  <p className="text-xs text-zinc-500">ID: {selectedUser.id}</p>
                </div>
              </div>

              <form onSubmit={saveUserData} className="space-y-4">
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

              {/* Action Zone for Ban & Delete */}
              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
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

    </div>
  );
}