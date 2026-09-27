// src/apps/job/views/admin/Leaderboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Trophy, Medal, Search, Plus, Minus, Hash
} from 'lucide-react';
import 'animate.css';

export default function Leaderboard() {
  const { userProfile } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const preventAction = (e) => e.preventDefault();
  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลเฉพาะ User และเรียงตามคะแนน (Points) จากมากไปน้อย
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, points, avatar_url')
        .eq('role', 'User')
        .order('points', { ascending: false })
        .order('first_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (studentName, oldPoints, newPoints) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const actionType = newPoints > oldPoints ? 'เพิ่ม' : 'ลด';
      const color = newPoints > oldPoints ? 3066993 : 16711680; // เขียว หรือ แดง
      const adminName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: `🏆 ${actionType}คะแนนนักศึกษา`,
          color: color,
          fields: [
            { name: "🧑‍🎓 นักศึกษา", value: studentName, inline: true },
            { name: "📊 การเปลี่ยนแปลง", value: `${oldPoints} ➔ **${newPoints}** คะแนน`, inline: true },
            { name: "👤 แอดมินผู้ทำรายการ", value: `${adminName} (${userProfile?.role || 'Unknown'})`, inline: false }
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

  const updatePoints = async (id, name, currentPoints, amount) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newPoints = (currentPoints || 0) + amount;
      if (newPoints < 0) return; // ไม่ให้คะแนนติดลบ
      
      const { error } = await supabase.from('profiles').update({ points: newPoints }).eq('id', id);
      if (error) throw error;

      // Update State locally for instant UI response
      setStudents(students.map(s => s.id === id ? { ...s, points: newPoints } : s).sort((a, b) => b.points - a.points));

      await sendDiscordLog(name, currentPoints || 0, newPoints);
      await logActivity('อัปเดตคะแนน', `ปรับคะแนนของ ${name} เป็น ${newPoints}`);
      
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      fetchLeaderboard(); // รีโหลดข้อมูลใหม่ถ้าอัปเดตพลาด
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-600 dark:text-yellow-500 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">กระดานคะแนน (Leaderboard)</h1>
            <p className="text-sm text-zinc-500">ติดตามและปรับปรุงคะแนนเก็บของนักศึกษา</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อนักศึกษา..." 
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-yellow-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[50vh]">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-yellow-500"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-400 opacity-60">
            <Trophy className="w-16 h-16 mb-4" />
            <p>ไม่พบข้อมูลนักศึกษาในระบบ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((student, index) => {
              // จัดอันดับ 1, 2, 3 ให้มีสีพิเศษ
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              let rankStyle = "bg-zinc-50 dark:bg-[#09090b] border-gray-100 dark:border-zinc-800/50 text-zinc-500";
              let badgeIcon = <Hash className="w-4 h-4 opacity-50"/>;
              
              if (isFirst) {
                rankStyle = "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-700/50 text-yellow-600 dark:text-yellow-500 shadow-sm";
                badgeIcon = <Trophy className="w-5 h-5 text-yellow-500" />;
              } else if (isSecond) {
                rankStyle = "bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800/40 dark:to-gray-800/20 border-slate-200 dark:border-slate-600/50 text-slate-600 dark:text-slate-400 shadow-sm";
                badgeIcon = <Medal className="w-5 h-5 text-slate-400" />;
              } else if (isThird) {
                rankStyle = "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 border-orange-200 dark:border-orange-700/50 text-orange-600 dark:text-orange-500 shadow-sm";
                badgeIcon = <Medal className="w-5 h-5 text-orange-500" />;
              }

              return (
                <div key={student.id} className={`flex items-center justify-between p-4 rounded-[1.5rem] border hover:scale-[1.01] transition-all duration-300 ${rankStyle}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isFirst || isSecond || isThird ? 'bg-white dark:bg-black/20 shadow-sm' : ''}`}>
                      {badgeIcon}
                      {(!isFirst && !isSecond && !isThird) && <span>{index + 1}</span>}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden shrink-0">
                        {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover"/> : student.first_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-[11px] font-medium opacity-70">@{student.nickname || 'student'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-2xl font-black">{student.points || 0}</span>
                      <span className="text-[10px] uppercase tracking-wider opacity-60 ml-1">pts</span>
                    </div>

                    {!isUser && (
                      <div className="flex items-center gap-1.5 ml-2 border-l border-zinc-200 dark:border-zinc-700 pl-4">
                        <button 
                          onClick={() => updatePoints(student.id, student.first_name, student.points, 1)}
                          disabled={isUpdating}
                          className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updatePoints(student.id, student.first_name, student.points, -1)}
                          disabled={isUpdating || (student.points || 0) <= 0}
                          className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}