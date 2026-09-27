// src/apps/job/views/admin/Users.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Users as UsersIcon, Search, ShieldAlert, Ban, CheckCircle2, MoreVertical
} from 'lucide-react';
import 'animate.css';

export default function Users() {
  const { userProfile } = useOutletContext();
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const preventAction = (e) => e.preventDefault();
  const isSuperAdmin = useMemo(() => userProfile?.role === 'Super Admin', [userProfile]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'User')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (studentName, isBanning) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = isBanning ? 16711680 : 3066993; // แดง หรือ เขียว
      const actionText = isBanning ? "🚫 ระงับการใช้งานบัญชี" : "✅ ปลดระงับการใช้งาน";
      const adminName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: actionText,
          color: color,
          fields: [
            { name: "🧑‍🎓 บัญชีนักศึกษา", value: studentName, inline: true },
            { name: "สถานะ", value: isBanning ? 'Banned' : 'Active', inline: true },
            { name: "👤 ผู้ทำรายการ", value: `${adminName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const logActivity = async (action, details) => {
    if (userProfile) {
      await supabase.from('activity_logs').insert({ action, details, user_id: userProfile.id });
    }
  };

  const toggleBanStatus = async (id, name, isCurrentlyBanned) => {
    if (!isSuperAdmin) return alert('เฉพาะ Super Admin เท่านั้นที่สามารถระงับบัญชีได้');
    
    const confirmMsg = isCurrentlyBanned 
      ? `คุณต้องการปลดระงับการใช้งานบัญชีของ ${name} ใช่หรือไม่?` 
      : `⚠️ คุณต้องการระงับการใช้งานบัญชีของ ${name} ใช่หรือไม่?\nนักศึกษาจะไม่สามารถเข้าสู่ระบบได้`;
      
    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(true);
    try {
      // ตั้งเวลาแบนไปอนาคตไกลๆ (เช่น +10 ปี) ถ้าต้องการแบน, หรือ null ถ้าปลดแบน
      const banDate = isCurrentlyBanned ? null : new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase.from('profiles').update({ is_banned_until: banDate }).eq('id', id);
      if (error) throw error;

      // Update State Locally
      setUsersList(usersList.map(u => u.id === id ? { ...u, is_banned_until: banDate } : u));

      await sendDiscordLog(name, !isCurrentlyBanned);
      await logActivity(!isCurrentlyBanned ? 'ระงับบัญชี' : 'ปลดระงับบัญชี', `เปลี่ยนสถานะบัญชีของ ${name}`);
      
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsUpdating(false);
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
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm">
            <UsersIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">รายชื่อนักศึกษา (Users)</h1>
            <p className="text-sm text-zinc-500">ดูและจัดการบัญชีผู้ใช้งานระบบทั้งหมด</p>
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
                  <th className="pb-4 px-4 w-32">สถานะ</th>
                  <th className="pb-4 px-4 w-32 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="py-10 text-center text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl block mt-4 bg-gray-50 dark:bg-white/5">ไม่พบข้อมูลนักศึกษา</td></tr>
                ) : (
                  filteredUsers.map(user => {
                    const banned = isBanned(user.is_banned_until);
                    return (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden shrink-0">
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : user.first_name?.charAt(0) || 'U'}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-zinc-900 dark:text-white">{user.first_name} {user.last_name}</div>
                          <div className="text-[11px] font-mono opacity-70 mt-0.5">@{user.nickname || 'student'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-xs text-zinc-500">{user.email || 'No email provided'}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{user.phone || '-'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${banned ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                            {banned ? <><ShieldAlert className="w-3 h-3"/> Banned</> : <><CheckCircle2 className="w-3 h-3"/> Active</>}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isSuperAdmin ? (
                            <button 
                              onClick={() => toggleBanStatus(user.id, user.first_name, banned)}
                              disabled={isUpdating}
                              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50 ${banned ? 'bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300' : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50'}`}
                            >
                              {banned ? 'ปลดระงับ' : 'ระงับบัญชี'}
                            </button>
                          ) : (
                            <button disabled className="p-1.5 text-zinc-300 dark:text-zinc-700 cursor-not-allowed">
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
    </div>
  );
}