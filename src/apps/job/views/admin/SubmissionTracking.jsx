// src/apps/job/views/admin/SubmissionTracking.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FileCheck, Search, ChevronDown, CheckCircle, Clock, AlertTriangle 
} from 'lucide-react';
import 'animate.css';

export default function SubmissionTracking() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (activeRoom.id) {
      fetchInitialData();
    }
  }, [activeRoom]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      if (sem && activeRoom.id) {
        // ดึงงานทั้งหมดของห้องนี้
        const { data: tasks } = await supabase
          .from('assignments')
          .select('id, title, due_date')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('created_at', { ascending: false });
        
        setAssignments(tasks || []);
        if (tasks && tasks.length > 0) {
          setSelectedAssignment(tasks[0].id);
        }

        // ดึงนักศึกษาทั้งหมด (Role = User) 
        // *หมายเหตุ: ถ้าโปรเจกต์มี Field ระบุห้องใน profile ให้ .eq('room_id', activeRoom.id) เพิ่ม
        const { data: students } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, nickname')
          .eq('role', 'User')
          .order('first_name', { ascending: true });
          
        setUsers(students || []);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions();
    }
  }, [selectedAssignment]);

  const fetchSubmissions = async () => {
    try {
      // สมมติโครงสร้าง table 'submissions': id, assignment_id, user_id, status
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', selectedAssignment);
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const sendDiscordLog = async (studentName, newStatus) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const task = assignments.find(a => a.id === selectedAssignment);
      const color = newStatus === 'ตรวจแล้ว' ? 3066993 : newStatus === 'ส่งแล้ว' ? 3447003 : 15158332;
      const userName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: "📊 อัปเดตสถานะการส่งงาน",
          color: color,
          fields: [
            { name: "📌 ชื่องาน", value: task?.title || '-', inline: false },
            { name: "🧑‍🎓 นักศึกษา", value: studentName, inline: true },
            { name: "สถานะใหม่", value: newStatus, inline: true },
            { name: "👤 ผู้ตรวจ", value: `${userName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const updateStatus = async (studentId, studentName, newStatus) => {
    setIsUpdating(true);
    try {
      // เช็คก่อนว่าเคยมี Record หรือยัง
      const existing = submissions.find(s => s.user_id === studentId);

      if (existing) {
        const { error } = await supabase.from('submissions').update({ status: newStatus }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('submissions').insert({
          assignment_id: selectedAssignment,
          user_id: studentId,
          status: newStatus
        });
        if (error) throw error;
      }

      await sendDiscordLog(studentName, newStatus);
      await fetchSubmissions();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStudentStatus = (studentId) => {
    const sub = submissions.find(s => s.user_id === studentId);
    return sub ? sub.status : 'รอส่ง';
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.nickname || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'ตรวจแล้ว':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/20"><CheckCircle className="w-3.5 h-3.5"/> ตรวจแล้ว</span>;
      case 'ส่งแล้ว':
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-[#0071e3] dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-500/20"><Clock className="w-3.5 h-3.5"/> ส่งแล้ว (รอตรวจ)</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/20"><AlertTriangle className="w-3.5 h-3.5"/> รอส่ง</span>;
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ติดตามการส่งงาน (Tracking)</h1>
            <p className="text-sm text-zinc-500">
              อัปเดตสถานะการตรวจงานของนักศึกษา <span className="font-bold text-[#0071e3]">{activeRoom.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อนักศึกษา..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Col: Task Selector */}
        <div className="lg:col-span-1 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none sticky top-24">
          <h2 className="text-sm font-bold text-zinc-500 mb-4 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800 pb-2">เลือกงานที่ต้องการตรวจ</h2>
          
          {isLoading ? (
            <div className="py-10 text-center text-sm text-zinc-500">โหลดข้อมูล...</div>
          ) : assignments.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">ไม่มีงานในระบบ</div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {assignments.map(task => (
                <button 
                  key={task.id}
                  onClick={() => setSelectedAssignment(task.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedAssignment === task.id ? 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 shadow-sm' : 'bg-zinc-50 dark:bg-[#09090b] border-gray-100 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-600'}`}
                >
                  <p className={`font-bold text-sm truncate ${selectedAssignment === task.id ? 'text-purple-700 dark:text-purple-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                    {task.title}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Student List */}
        <div className="lg:col-span-3 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[50vh]">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-purple-500"></div>
            </div>
          ) : !selectedAssignment ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 opacity-60">
              <FileCheck className="w-16 h-16 mb-4" />
              <p>กรุณาเลือกงานจากเมนูด้านซ้ายเพื่อเริ่มตรวจ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
                <thead className="border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="pb-4 px-4">ชื่อ-นามสกุล</th>
                    <th className="pb-4 px-4 w-32">ชื่อเล่น</th>
                    <th className="pb-4 px-4 w-40">สถานะปัจจุบัน</th>
                    <th className="pb-4 px-4 w-56 text-right">ปรับปรุงสถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="4" className="py-10 text-center text-zinc-400">ไม่พบข้อมูลนักศึกษา</td></tr>
                  ) : (
                    filteredUsers.map(student => {
                      const currentStatus = getStudentStatus(student.id);
                      return (
                        <tr key={student.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-bold text-zinc-900 dark:text-white">{student.first_name} {student.last_name}</span>
                          </td>
                          <td className="py-4 px-4">{student.nickname || '-'}</td>
                          <td className="py-4 px-4">
                            <StatusBadge status={currentStatus} />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {/* ไม่แสดงปุ่มเปลี่ยนสถานะถ้าผู้ใช้งานเป็นแค่ User */}
                              {!isUser && (
                                <>
                                  <button 
                                    onClick={() => updateStatus(student.id, student.first_name, 'รอส่ง')}
                                    disabled={isUpdating || currentStatus === 'รอส่ง'}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 transition-colors"
                                  >
                                    รอส่ง
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(student.id, student.first_name, 'ส่งแล้ว')}
                                    disabled={isUpdating || currentStatus === 'ส่งแล้ว'}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[#0071e3]/30 bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] hover:bg-blue-100 dark:hover:bg-[#0071e3]/20 disabled:opacity-30 transition-colors"
                                  >
                                    ส่งแล้ว
                                  </button>
                                  <button 
                                    onClick={() => updateStatus(student.id, student.first_name, 'ตรวจแล้ว')}
                                    disabled={isUpdating || currentStatus === 'ตรวจแล้ว'}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-30 transition-colors shadow-sm"
                                  >
                                    ตรวจแล้ว
                                  </button>
                                </>
                              )}
                            </div>
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
    </div>
  );
}