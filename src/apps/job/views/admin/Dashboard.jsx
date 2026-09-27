// src/apps/job/views/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  RefreshCw, Users, BookOpen, ClipboardList, 
  Activity, ArrowUpRight, Clock, ShieldCheck
} from 'lucide-react';
import 'animate.css';

export default function Dashboard() {
  const { userProfile, activeRoom } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentLogs, setRecentLogs] = useState([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalAssignments: 0,
    activeSemester: null
  });

  const preventAction = (e) => e.preventDefault();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. ดึงเทอมปัจจุบัน
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      
      let usersCount = 0, subsCount = 0, assignsCount = 0;

      // 2. นับจำนวน Users ทั้งหมด (นักศึกษา)
      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'User');
      usersCount = uCount || 0;

      if (activeRoom?.id && sem) {
        // 3. นับจำนวนวิชา
        const { count: sCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        subsCount = sCount || 0;

        // 4. นับจำนวนงานที่สั่ง
        const { count: aCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        assignsCount = aCount || 0;
      }

      setStats({
        totalUsers: usersCount,
        totalSubjects: subsCount,
        totalAssignments: assignsCount,
        activeSemester: sem
      });

      // 5. ดึง Activity Logs 5 รายการล่าสุด
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*, profiles(first_name, role)')
        .order('created_at', { ascending: false })
        .limit(5);
        
      setRecentLogs(logs || []);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeRoom]);

  // ระบบส่ง Discord เวลา Refresh Stats
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();

    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (webhookUrl && userProfile) {
      try {
        const payload = {
          embeds: [{
            title: "🔄 Dashboard Synced",
            description: `แอดมิน **${userProfile.first_name}** อัปเดตข้อมูลสถิติล่าสุดในหน้า Dashboard\nห้องที่จัดการ: **${activeRoom.name}**`,
            color: 3447003,
            timestamp: new Date().toISOString()
          }]
        };
        await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        console.error('Discord Webhook error:', e);
      }
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">System Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            สรุปข้อมูลสถิติของ <span className="font-bold text-[#0071e3]">{activeRoom.name}</span>
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-full font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:shadow-lg transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none active:scale-95 disabled:opacity-70"
        >
          <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin text-[#0071e3]' : 'text-[#0071e3]'}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-zinc-800 border-t-[#0071e3] dark:border-t-[#0071e3]"></div>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Card 1: Users */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-[#0071e3]/10 rounded-[1.25rem] flex items-center justify-center text-[#0071e3]">
                  <Users size={26} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <ArrowUpRight size={14} /> Active
                </span>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1">นักศึกษาในระบบทั้งหมด</h3>
              <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{stats.totalUsers}</p>
            </div>

            {/* Card 2: Subjects */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.25rem] flex items-center justify-center text-indigo-500">
                  <BookOpen size={26} />
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700">
                  {stats.activeSemester ? `เทอม ${stats.activeSemester.term}/${stats.activeSemester.year}` : 'N/A'}
                </span>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1">รายวิชาในห้องนี้</h3>
              <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{stats.totalSubjects}</p>
            </div>

            {/* Card 3: Assignments */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start mb-4">
                <div className="w-14 h-14 bg-orange-500/10 rounded-[1.25rem] flex items-center justify-center text-orange-500">
                  <ClipboardList size={26} />
                </div>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1">งานที่สั่งทั้งหมดในห้องนี้</h3>
              <p className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">{stats.totalAssignments}</p>
            </div>
            
          </div>

          {/* Bottom Section: Recent Activity */}
          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 dark:border-zinc-800/80 pb-4">
              <h2 className="text-xl font-bold flex items-center gap-3 text-zinc-900 dark:text-white tracking-tight">
                <Activity className="text-[#0071e3] p-1.5 bg-[#0071e3]/10 rounded-lg" size={28} />
                Recent Activities
              </h2>
            </div>
            
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-zinc-800/80 rounded-2xl bg-zinc-50 dark:bg-[#09090b]">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">ยังไม่มีความเคลื่อนไหวในระบบ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-5 p-5 rounded-2xl bg-zinc-50 dark:bg-[#09090b] border border-gray-100 dark:border-zinc-800/50 hover:border-[#0071e3]/30 transition-colors group">
                    <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-sm ${log.action.includes('ลบ') ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : log.action.includes('แก้ไข') ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                      <ShieldCheck size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#0071e3] transition-colors">{log.action}</p>
                        <span className="text-[11px] font-mono text-zinc-400 bg-white dark:bg-[#121214] px-2.5 py-1 rounded-md border border-gray-200 dark:border-zinc-800 shrink-0 flex items-center gap-1.5 w-fit">
                          <Clock size={12} /> {formatTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-[13px] text-zinc-600 dark:text-zinc-400 truncate mt-1 leading-relaxed">{log.details}</p>
                      <p className="text-[11px] text-[#0071e3] font-bold mt-2 bg-[#0071e3]/10 w-fit px-2 py-0.5 rounded">โดย: {log.profiles?.first_name || 'System'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}