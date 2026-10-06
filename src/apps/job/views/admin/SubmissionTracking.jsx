// src/apps/job/views/admin/SubmissionTracking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FileCheck, Search, CheckCircle2, UserCheck, 
  X, Loader2, Clock, AlertTriangle, ArrowRight, Check, AlertCircle
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

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const preventAction = (e) => e.preventDefault();
  const isSuperAdminOrAdmin = useMemo(() => userProfile?.role === 'Super Admin' || userProfile?.role === 'Admin', [userProfile]);

  // Function for displaying toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 4000);
  };

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
        const { data: tasks, error: taskError } = await supabase
          .from('assignments')
          .select('id, title, subjects(code, name)')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('created_at', { ascending: false });
        
        if (taskError) throw taskError;
        setAssignments(tasks || []);

        // 🚀 ดึงผู้ใช้งานห้องนี้ + ดึง Super Admin เข้ามาแจมด้วย
        const { data: allUsers, error: userError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname, avatar_url, role')
          .or(`room_access.eq.${activeRoom.id},role.eq.Super Admin`) // <--- แก้ไขตรงนี้
          .order('first_name', { ascending: true });
          
        if (userError) throw userError;
        setUsers(allUsers || []);

        // ดึงข้อมูลการส่งงานของงานในห้องนี้
        const taskIds = tasks?.map(t => t.id) || [];
        if (taskIds.length > 0) {
          const { data: subs, error: subsError } = await supabase
            .from('submissions')
            .select('*')
            .in('assignment_id', taskIds);
            
          if (subsError) {
             if(subsError.code === 'PGRST204') {
                showToast("ไม่พบคอลัมน์ 'status' ในตาราง submissions กรุณาเพิ่มคอลัมน์ใน Supabase", "error");
             } else {
                throw subsError;
             }
          }
          setSubmissions(subs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      showToast(`โหลดข้อมูลล้มเหลว: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงข้อมูล submissions ใหม่แบบเงียบๆ ไม่ให้โหลดกระตุก
  const fetchSubmissionsSilent = async (taskIds) => {
    if (taskIds.length > 0) {
      const { data: subs } = await supabase.from('submissions').select('*').in('assignment_id', taskIds);
      setSubmissions(subs || []);
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
      const newStatus = existingSub?.status === 'ตรวจแล้ว' ? 'รอส่ง' : 'ตรวจแล้ว';

      // 1. ทำการอัปเดต Database ก่อนเพื่อให้มั่นใจว่าบันทึกสำเร็จ
      let dbError = null;

      if (existingSub) {
        const { error } = await supabase
          .from('submissions')
          .update({ status: newStatus })
          .eq('id', existingSub.id);
        dbError = error;
      } else {
        // การ Insert แบบ Array สำคัญมากสำหรับ Supabase JS v2
        const { error } = await supabase
          .from('submissions')
          .insert([{ 
            assignment_id: selectedTask.id, 
            user_id: student.id, 
            status: newStatus 
          }]);
        dbError = error;
      }

      // ตรวจสอบว่ามี Error จาก Database หรือไม่ (เช่น คอลัมน์ไม่มี)
      if (dbError) {
         if (dbError.code === 'PGRST204') {
             throw new Error("ไม่มีคอลัมน์ 'status' ในฐานข้อมูล กรุณาเพิ่มคอลัมน์ใน Supabase");
         }
         throw dbError;
      }

      // 2. เมื่อ Database สำเร็จ ค่อยอัปเดต UI 
      setSubmissions(prev => {
        const newSubs = [...prev];
        const idx = newSubs.findIndex(s => s.user_id === student.id && s.assignment_id === selectedTask.id);
        if (idx > -1) {
          newSubs[idx].status = newStatus;
        } else {
          newSubs.push({ user_id: student.id, assignment_id: selectedTask.id, status: newStatus });
        }
        return newSubs;
      });

      // 3. แจ้งเตือน Discord
      await sendDiscordLog(student.first_name, selectedTask.title, newStatus);

      // 4. หากเป็นการ Insert ใหม่ ให้ดึงข้อมูลเงียบๆ เพื่อเอา ID จากฐานข้อมูลมาผูกกับ State
      if (!existingSub) {
        const taskIds = assignments.map(t => t.id);
        fetchSubmissionsSilent(taskIds);
      }

    } catch (error) {
      console.error(error);
      showToast(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStudentStatus = (studentId, taskId) => {
    const sub = submissions.find(s => s.user_id === studentId && s.assignment_id === taskId);
    return sub ? sub.status : 'รอส่ง';
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
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10 relative">
      
      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-md px-4 pointer-events-none flex flex-col items-center">
        {toast.show && (
          <div className={`animate__animated animate__fadeInDown animate__faster w-full flex items-start gap-3 p-4 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-md
            ${toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' : 
              'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'}`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
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

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ติดตามสถานะการส่งงาน</h1>
            <p className="text-sm text-zinc-500">ตรวจสอบและเช็คชื่อการส่งงานของ {activeRoom.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="text-center bg-zinc-50 dark:bg-zinc-900 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block mb-1">งานทั้งหมด</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-white leading-none">{assignments.length}</span>
          </div>
          <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 px-5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
            <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-500 font-bold block mb-1">ผู้ใช้ในห้อง</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">{users.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[50vh]">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-zinc-800/80">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            รายการงานทั้งหมด
          </h2>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อนักศึกษาเพื่อดักจับ..." 
              className="w-full bg-zinc-50 dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]"/>
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-2xl">ไม่พบรายการงานในห้องนี้</div>
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
                <div key={task.id} className="flex items-center p-3 sm:p-4 bg-zinc-50 dark:bg-[#1e1e24] hover:bg-gray-100 dark:hover:bg-[#25252b] border border-gray-200 dark:border-zinc-800 rounded-2xl transition-colors group">
                  <div className="w-20 sm:w-24 shrink-0">
                    <span className="px-2.5 py-1 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md text-[11px] font-mono border border-gray-200 dark:border-zinc-700">
                      {task.subjects?.code || '-'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-bold text-sm sm:text-[15px] text-zinc-900 dark:text-zinc-200 truncate">{task.title}</h4>
                  </div>
                  
                  <div className="w-48 shrink-0 pr-6 hidden md:flex flex-col items-end gap-1.5">
                    <div className="flex justify-between w-full text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                      <span>ส่งแล้ว {progress.submitted}</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{progress.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
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

      {/* Check Name Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster">
          <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col h-[85vh] sm:h-[90vh] animate__animated animate__zoomIn animate__faster overflow-hidden" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50 dark:bg-[#16161a]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-1">เช็คชื่อการส่งงาน</h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 rounded text-[10px] font-mono font-bold">
                      {selectedTask.subjects?.code}
                    </span>
                    <span className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">ใบงานที่: {selectedTask.title}</span>
                  </div>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full bg-white border border-gray-200 dark:border-transparent dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-[#09090b]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {users.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
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
                          ? 'bg-emerald-50 border-emerald-500/40 dark:bg-emerald-900/10 dark:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                          : 'bg-zinc-50 border-gray-200 hover:border-gray-300 dark:bg-[#1e1e24] dark:border-zinc-800 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`font-bold text-sm ${isChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-200'}`}>
                            {student.first_name} {student.last_name || ''}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-zinc-500 font-mono">@{student.nickname || 'user'}</p>
                            {student.role !== 'User' && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${student.role === 'Super Admin' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'}`}>
                                {student.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2`}>
                        {status === 'ส่งแล้ว' && !isChecked && (
                          <span className="text-[10px] text-[#0071e3] font-bold bg-blue-50 dark:bg-[#0071e3]/10 px-2 py-1 rounded">ส่งแล้ว</span>
                        )}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500' : 'bg-white border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                          {isChecked && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#16161a] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-zinc-500 font-medium">ข้อมูลอัปเดตเรียลไทม์ และบันทึกลง Database ทันที</span>
              </div>
              <button onClick={closeModal} className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-bold rounded-xl text-sm transition-colors active:scale-95 shadow-sm">
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}