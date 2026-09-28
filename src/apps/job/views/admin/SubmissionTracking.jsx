// src/apps/job/views/admin/SubmissionTracking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FileCheck, Search, CheckCircle2, UserCheck, 
  X, Loader2, Clock, AlertTriangle, ArrowRight, Check
} from 'lucide-react';
import 'animate.css';

export default function SubmissionTracking() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const preventAction = (e) => e.preventDefault();
  const isSuperAdminOrAdmin = useMemo(() => userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin', [userProfile]);
  const isUserRole = useMemo(() => userProfile?.role === 'User', [userProfile]);

  useEffect(() => {
    if (activeRoom?.id) {
      fetchInitialData();
    }
  }, [activeRoom]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      if (sem && activeRoom.id) {
        // ดึงงานเฉพาะของห้องที่เลือก
        const { data: tasks } = await supabase
          .from('assignments')
          .select('id, title, subjects(code, name)')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('created_at', { ascending: false });
        
        setAssignments(tasks || []);

        // 📌 ดึงผู้ใช้งาน "แยกตามห้อง (room_access)" ที่เลือกอยู่เท่านั้น (แก้ไขแล้ว)
        const { data: allUsers, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname, avatar_url, role')
          .eq('room_access', activeRoom.id) // <--- เปลี่ยนตรงนี้เป็น room_access
          .order('first_name', { ascending: true });
          
        if (userError) console.error("Profile Fetch Error:", userError);
        setUsers(allUsers || []);

        // ดึงข้อมูลการส่งงานของงานในห้องนี้
        const taskIds = tasks?.map(t => t.id) || [];
        if (taskIds.length > 0) {
          const { data: subs } = await supabase.from('submissions').select('*').in('assignment_id', taskIds);
          setSubmissions(subs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (studentName, taskTitle, newStatus) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = newStatus === 'ตรวจแล้ว' ? 3066993 : newStatus === 'ส่งแล้ว' ? 3447003 : 15158332;
      const adminName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: "📊 อัปเดตสถานะการส่งงาน",
          color: color,
          fields: [
            { name: "📌 ชื่องาน", value: taskTitle || '-', inline: false },
            { name: "🧑‍🎓 ผู้ใช้งาน", value: studentName, inline: true },
            { name: "สถานะใหม่", value: newStatus, inline: true },
            { name: "👤 ผู้ตรวจ", value: `${adminName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          footer: { text: `SE Portal Tracking • ${activeRoom.name}` },
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const openCheckModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const toggleStudentStatus = async (student) => {
    if (!isSuperAdminOrAdmin || !selectedTask) return;
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const existingSub = submissions.find(s => s.user_id === student.id && s.assignment_id === selectedTask.id);
      const currentStatus = existingSub?.status === 'ตรวจแล้ว' ? 'รอส่ง' : 'ตรวจแล้ว';

      setSubmissions(prev => {
        const newSubs = [...prev];
        const idx = newSubs.findIndex(s => s.user_id === student.id && s.assignment_id === selectedTask.id);
        if (idx > -1) newSubs[idx].status = currentStatus;
        else newSubs.push({ user_id: student.id, assignment_id: selectedTask.id, status: currentStatus });
        return newSubs;
      });

      if (existingSub) {
        await supabase.from('submissions').update({ status: currentStatus }).eq('id', existingSub.id);
      } else {
        await supabase.from('submissions').insert({ assignment_id: selectedTask.id, user_id: student.id, status: currentStatus });
      }

      await sendDiscordLog(student.first_name, selectedTask.title, currentStatus);

    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      fetchInitialData();
    } finally {
      setIsUpdating(false);
    }
  };

  const getStudentStatus = (studentId, taskId) => {
    const sub = submissions.find(s => s.user_id === studentId && s.assignment_id === taskId);
    return sub ? sub.status : 'รอส่ง';
  };

  const updateStatusDirectly = async (studentId, studentName, taskId, taskTitle, newStatus) => {
    if (!isSuperAdminOrAdmin) return;
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      const existing = submissions.find(s => s.user_id === studentId && s.assignment_id === taskId);
      
      setSubmissions(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(s => s.user_id === studentId && s.assignment_id === taskId);
        if (idx !== -1) copy[idx].status = newStatus;
        else copy.push({ user_id: studentId, assignment_id: taskId, status: newStatus });
        return copy;
      });

      if (existing) {
        await supabase.from('submissions').update({ status: newStatus }).eq('id', existing.id);
      } else {
        await supabase.from('submissions').insert({ assignment_id: taskId, user_id: studentId, status: newStatus });
      }

      await sendDiscordLog(studentName, taskTitle, newStatus);
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
      fetchInitialData();
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const getProgress = (taskId) => {
    if (users.length === 0) return { percent: 0, submitted: 0, total: 0 };
    const submittedCount = submissions.filter(s => s.assignment_id === taskId && (s.status === 'ตรวจแล้ว' || s.status === 'ส่งแล้ว')).length;
    const percentage = Math.round((submittedCount / users.length) * 100) || 0;
    return { percent: percentage, submitted: submittedCount, total: users.length };
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      <div className="bg-[#121214] border border-zinc-800/80 rounded-[1.5rem] p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">ติดตามสถานะการส่งงาน</h1>
            <p className="text-sm text-zinc-400">ตรวจสอบและเช็คชื่อการส่งงานของ {activeRoom.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="text-center bg-zinc-900 px-5 py-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">งานทั้งหมด</span>
            <span className="text-xl font-bold text-white leading-none">{assignments.length}</span>
          </div>
          <div className="text-center bg-emerald-900/20 px-5 py-2.5 rounded-xl border border-emerald-500/20">
            <span className="text-[10px] uppercase text-emerald-500 font-bold block mb-1">ผู้ใช้ในห้อง</span>
            <span className="text-xl font-bold text-emerald-400 leading-none">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-[#121214] border border-zinc-800/80 rounded-[1.5rem] p-6 md:p-8 min-h-[50vh]">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            รายการงานทั้งหมด
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อนักศึกษาเพื่อดักจับ..." 
              className="w-full bg-[#1e1e24] border border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-[#0071e3] transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]"/>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">ไม่พบรายการงานในห้องนี้</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              <div className="w-24 shrink-0">รหัสวิชา</div>
              <div className="flex-1">ชื่องาน</div>
              <div className="w-48 text-right pr-6 hidden md:block">ความคืบหน้า</div>
              <div className="w-28 text-center shrink-0">เช็คชื่อ</div>
            </div>

            {assignments.map(task => {
              const progress = getProgress(task.id);
              return (
                <div key={task.id} className="flex items-center p-3 sm:p-4 bg-[#1e1e24] hover:bg-[#25252b] border border-zinc-800 rounded-2xl transition-colors group">
                  <div className="w-20 sm:w-24 shrink-0">
                    <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md text-[11px] font-mono border border-zinc-700">
                      {task.subjects?.code || '-'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-sm sm:text-[15px] text-zinc-200 truncate">{task.title}</h4>
                  </div>
                  
                  <div className="w-48 shrink-0 pr-6 hidden md:flex flex-col items-end gap-1.5">
                    <div className="flex justify-between w-full text-[10px] font-medium text-zinc-400">
                      <span>ส่งแล้ว {progress.submitted}</span>
                      <span className="text-emerald-400">{progress.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress.percent}%` }}></div>
                    </div>
                  </div>

                  <div className="w-24 sm:w-28 shrink-0 flex justify-end">
                    <button 
                      onClick={() => openCheckModal(task)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-lg shadow-blue-500/10 active:scale-95"
                    >
                      <UserCheck className="w-4 h-4" /> ตรวจงาน
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster">
          <div className="bg-[#121214] border border-zinc-800 rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] sm:h-[90vh] animate__animated animate__zoomIn animate__faster overflow-hidden" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#16161a]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">เช็คชื่อการส่งงาน</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-mono font-bold">
                      {selectedTask.subjects?.code}
                    </span>
                    <span className="text-xs sm:text-sm text-zinc-400 font-medium">ใบงานที่: {selectedTask.title}</span>
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#09090b]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
                    ไม่พบผู้ใช้ในห้องนี้
                  </div>
                ) : filteredUsers.map(student => {
                  const status = getStudentStatus(student.id, selectedTask.id);
                  const isChecked = status === 'ตรวจแล้ว';

                  return (
                    <div 
                      key={student.id}
                      onClick={() => toggleStudentStatus(student)}
                      className={`relative flex items-center justify-between p-4 rounded-[1.25rem] cursor-pointer transition-all duration-300 border-2 ${
                        isChecked 
                          ? 'bg-emerald-900/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'bg-[#1e1e24] border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isChecked ? 'text-emerald-400' : 'text-zinc-200'}`}>
                            {student.first_name} {student.last_name || ''}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-zinc-500 font-mono">@{student.nickname || 'user'}</p>
                            {student.role !== 'User' && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">{student.role}</span>}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2`}>
                        {status === 'ส่งแล้ว' && !isChecked && (
                          <span className="text-[10px] text-[#0071e3] font-bold bg-[#0071e3]/10 px-2 py-1 rounded">ส่งแล้ว</span>
                        )}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500' : 'bg-zinc-800 border border-zinc-700'}`}>
                          {isChecked && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-zinc-800 bg-[#16161a] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-zinc-500 font-medium">ข้อมูลอัปเดตเรียลไทม์ (Auto-Save)</span>
              </div>
              <button onClick={closeModal} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl text-sm hover:bg-zinc-200 transition-colors active:scale-95 shadow-sm">
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}