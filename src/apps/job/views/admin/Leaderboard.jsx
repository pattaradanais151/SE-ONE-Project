// src/apps/job/views/admin/Leaderboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Trophy, Medal, Search, Hash, Loader2, 
  CheckCircle2, AlertCircle, X, Crown, Zap
} from 'lucide-react';
import 'animate.css';

export default function Leaderboard() {
  const { userProfile, activeRoom } = useOutletContext();
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // UseRef สำหรับเก็บข้อมูลล่าสุดไว้เทียบตอน Realtime ทำงาน
  const studentsRef = useRef([]);

  const preventAction = (e) => e.preventDefault();
  const isAdminOrSuperAdmin = useMemo(() => userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin', [userProfile]);

  // ฟังก์ชันแสดง Toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 4000);
  };

  // ฟังก์ชันจัดเรียงลำดับ (คะแนนมากไปน้อย, ถ้าเท่ากันเรียงตามตัวอักษร)
  const sortStudents = (arr) => {
    return arr.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return (a.first_name || '').localeCompare(b.first_name || '');
    });
  };

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  useEffect(() => {
    if (activeRoom?.id) {
      fetchInitialLeaderboard();

      // ⚡️ Setup Realtime Listener สำหรับตาราง submissions
      const channel = supabase.channel('public:submissions_leaderboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
          handleRealtimeUpdate();
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [activeRoom]);

  // ==========================================
  // ⚙️ Core Calculation Engine
  // ==========================================
  const calculateLeaderboardData = async () => {
    try {
      // 1. ดึง Users (ดึงคนที่อยู่ในห้องนี้ OR เป็น Super Admin)
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, nickname, avatar_url, role, room_access')
        .or(`room_access.eq.${activeRoom.id},role.eq.Super Admin`);
      
      if (pError) throw pError;

      // 2. ดึง Assignments ทั้งหมดในห้องนี้
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('room_id', activeRoom.id);

      const assignmentIds = assignments?.map(a => a.id) || [];
      let submissions = [];

      // 3. ดึง Submissions เฉพาะงานในห้องนี้
      if (assignmentIds.length > 0) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('user_id, status')
          .in('assignment_id', assignmentIds);
        submissions = subs || [];
      }

      // 4. คำนวณคะแนนอัตโนมัติ (1 งานที่ส่งแล้ว/ตรวจแล้ว = 300 แต้ม)
      const calculatedStudents = profiles.map(user => {
        const validSubs = submissions.filter(s => 
          s.user_id === user.id && 
          (s.status === 'ส่งแล้ว' || s.status === 'ตรวจแล้ว')
        );
        return {
          ...user,
          points: validSubs.length * 300
        };
      });

      return sortStudents(calculatedStudents);
    } catch (error) {
      console.error('Calculation Error:', error);
      showToast(`เกิดข้อผิดพลาดในการคำนวณคะแนน: ${error.message}`, 'error');
      return null;
    }
  };

  const fetchInitialLeaderboard = async () => {
    setIsLoading(true);
    const data = await calculateLeaderboardData();
    if (data) setStudents(data);
    setIsLoading(false);
  };

  const handleRealtimeUpdate = async () => {
    const newData = await calculateLeaderboardData();
    if (!newData) return;

    const oldData = studentsRef.current;

    // เช็คหาคนที่มีการเปลี่ยนแปลงคะแนน
    newData.forEach((newStudent, newIndex) => {
      const oldIndex = oldData.findIndex(s => s.id === newStudent.id);
      const oldStudent = oldData[oldIndex];

      if (oldStudent && oldStudent.points !== newStudent.points) {
        const oldRank = oldIndex + 1;
        const newRank = newIndex + 1;
        
        // ยิง Discord เฉพาะ Admin เท่านั้น (เพื่อป้องกันบั๊ก Webhook ยิงซ้ำจากฝั่ง User หลายคนพร้อมกัน)
        if (isAdminOrSuperAdmin) {
          sendDiscordLog(newStudent, oldStudent.points, newStudent.points, oldRank, newRank);
        }
      }
    });

    setStudents(newData);
  };

  const sendDiscordLog = async (student, oldPoints, newPoints, oldRank, newRank) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const studentName = `${student.first_name} ${student.last_name || ''}`.trim();
      let rankChangeText = "อันดับคงที่ ➖";
      let color = 3447003; // สีฟ้า
      let actionTitle = "อัปเดตคะแนนอัตโนมัติ";

      if (newRank < oldRank) {
        rankChangeText = `พุ่งขึ้นมา ${oldRank - newRank} อันดับ 📈 (จากที่ ${oldRank} ➔ ที่ ${newRank})`;
        color = 3066993; // สีเขียว
        actionTitle = "📈 อันดับพุ่ง! (งานได้รับการตรวจ/ส่ง)";
      } else if (newRank > oldRank) {
        rankChangeText = `ร่วงลง ${newRank - oldRank} อันดับ 📉 (จากที่ ${oldRank} ➔ ที่ ${newRank})`;
        color = 16711680; // สีแดง
        actionTitle = "📉 อันดับตก! (มีคนแซงหรือโดนยกเลิกงาน)";
      } else {
        rankChangeText = `อันดับคงที่ ➖ (ยังคงอยู่ที่ ${newRank})`;
        actionTitle = newPoints > oldPoints ? "➕ ได้รับคะแนนเพิ่ม (อันดับคงที่)" : "➖ ถูกหักคะแนน (อันดับคงที่)";
      }

      const payload = {
        embeds: [{
          title: `🏆 ${actionTitle}`,
          color: color,
          fields: [
            { name: "👤 ผู้ใช้งาน", value: studentName, inline: true },
            { name: "📊 คะแนนที่เปลี่ยน", value: `${oldPoints} ➔ **${newPoints}** XP`, inline: true },
            { name: "🏆 สถานะตารางคะแนน", value: rankChangeText, inline: false },
            { name: "⚙️ ระบบคำนวณ", value: `Auto-Calculated from Submissions`, inline: false }
          ],
          footer: { text: `SE Portal Leaderboard • ${activeRoom.name}` },
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const top3 = filteredStudents.slice(0, 3);
  const restStudents = filteredStudents.slice(3);

  // ฟังก์ชันสำหรับเรนเดอร์แท่น Podium
  const renderPodiumCard = (user, rank) => {
    if (!user) return null;

    let styles = {};
    if (rank === 1) {
      styles = {
        wrapperOrder: 'order-2 z-20',
        height: 'h-[220px] sm:h-[260px]',
        border: 'border-yellow-400 dark:border-yellow-500/50',
        bg: 'bg-gradient-to-t from-yellow-50 to-white dark:from-yellow-500/10 dark:to-transparent',
        badgeBg: 'bg-yellow-500',
        avatarRing: 'ring-4 ring-yellow-400 dark:ring-yellow-500',
        icon: <Crown className="w-8 h-8 text-yellow-500 drop-shadow-md mb-2 animate-[bounce_2s_infinite]" />,
        textColor: 'text-yellow-600 dark:text-yellow-400',
        avatarSize: 'w-20 h-20 sm:w-28 sm:h-28'
      };
    } else if (rank === 2) {
      styles = {
        wrapperOrder: 'order-1 z-10',
        height: 'h-[180px] sm:h-[210px]',
        border: 'border-slate-300 dark:border-slate-500/50',
        bg: 'bg-gradient-to-t from-slate-50 to-white dark:from-slate-500/10 dark:to-transparent',
        badgeBg: 'bg-slate-400 dark:bg-slate-500',
        avatarRing: 'ring-4 ring-slate-300 dark:ring-slate-500',
        icon: <Medal className="w-6 h-6 text-slate-400 mb-2" />,
        textColor: 'text-slate-600 dark:text-slate-400',
        avatarSize: 'w-16 h-16 sm:w-20 sm:h-20'
      };
    } else {
      styles = {
        wrapperOrder: 'order-3 z-10',
        height: 'h-[160px] sm:h-[190px]',
        border: 'border-orange-300 dark:border-orange-600/50',
        bg: 'bg-gradient-to-t from-orange-50 to-white dark:from-orange-600/10 dark:to-transparent',
        badgeBg: 'bg-orange-400 dark:bg-orange-600',
        avatarRing: 'ring-4 ring-orange-300 dark:ring-orange-600',
        icon: <Medal className="w-6 h-6 text-orange-400 dark:text-orange-500 mb-2" />,
        textColor: 'text-orange-600 dark:text-orange-500',
        avatarSize: 'w-16 h-16 sm:w-20 sm:h-20'
      };
    }

    return (
      <div className={`flex flex-col items-center flex-1 max-w-[200px] ${styles.wrapperOrder} animate__animated animate__fadeInUp`}>
        {styles.icon}
        <div className="relative mb-[-2rem] z-10">
          <div className={`${styles.avatarSize} rounded-full overflow-hidden ${styles.avatarRing} shadow-lg bg-white dark:bg-black`}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-2xl font-bold text-zinc-500">
                {user.first_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white dark:border-[#121214] ${styles.badgeBg}`}>
            {rank}
          </div>
        </div>
        
        <div className={`w-full ${styles.bg} border-t-2 ${styles.border} ${styles.height} rounded-t-[2rem] pt-12 pb-4 px-2 flex flex-col items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] dark:shadow-none`}>
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate w-full text-center px-2">{user.first_name}</h3>
          <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate w-full text-center px-2">@{user.nickname || 'user'}</p>
          
          <div className={`mt-auto mb-4 flex items-center gap-1 font-black text-sm sm:text-xl ${styles.textColor}`}>
            <Zap className="w-3 h-3 sm:w-5 sm:h-5 fill-current" /> {user.points || 0} XP
          </div>
        </div>
      </div>
    );
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10 relative min-h-screen">
      
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

      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              Wall of Fame ✨
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">จัดอันดับยอดนักปั่นงาน (1 งาน = 300 XP) • <span className="text-[#0071e3] font-bold">{activeRoom.name}</span></p>
          </div>
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้ใช้งาน..." 
            className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-11 pr-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[60vh] flex flex-col">
        
        {isLoading ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 opacity-60 py-20">
            <Trophy className="w-16 h-16 mb-4" />
            <p className="font-bold">ไม่พบข้อมูลผู้ใช้งานในระบบ</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-10">
            
            {/* 🏆 Podium Section (Top 3) */}
            {searchQuery === '' && top3.length > 0 && (
              <div className="flex items-end justify-center gap-2 sm:gap-6 pt-10 border-b border-gray-200 dark:border-zinc-800/80 pb-0">
                {renderPodiumCard(top3[1], 2)}
                {renderPodiumCard(top3[0], 1)}
                {renderPodiumCard(top3[2], 3)}
              </div>
            )}

            {/* 📋 List Section (Rank 4+) หรือถ้า Search ให้โชว์เป็น List ทั้งหมด */}
            <div className="space-y-3 pt-4">
              {(searchQuery !== '' ? filteredStudents : restStudents).map((student, index) => {
                const actualRank = searchQuery !== '' ? index + 1 : index + 4;
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/50 bg-zinc-50 dark:bg-[#09090b] hover:bg-white dark:hover:bg-[#16161a] hover:scale-[1.01] hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-zinc-400 dark:text-zinc-600 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm shrink-0">
                        {actualRank}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden shrink-0">
                          {student.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover"/> : student.first_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-[15px] text-zinc-900 dark:text-white leading-tight flex items-center gap-2 group-hover:text-[#0071e3] transition-colors">
                            {student.first_name} {student.last_name}
                            {student.role !== 'User' && <span className="text-[9px] bg-blue-50 dark:bg-blue-500/10 text-[#0071e3] border border-blue-200 dark:border-blue-500/20 px-1.5 py-0.5 rounded uppercase font-bold">{student.role}</span>}
                          </h3>
                          <p className="text-[11px] font-medium text-zinc-500 mt-0.5">@{student.nickname || 'user'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right flex items-center gap-1.5 bg-white dark:bg-[#121214] px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <Zap className="w-4 h-4 text-[#0071e3] fill-current" />
                        <span className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-none">{student.points || 0}</span>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}