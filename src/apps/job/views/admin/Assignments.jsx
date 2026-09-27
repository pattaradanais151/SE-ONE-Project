// src/apps/job/views/admin/Assignments.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  ClipboardList, Plus, Edit, Trash2, ArrowLeft, 
  Save, FileText, UploadCloud, X, Clock, AlertCircle, Eye 
} from 'lucide-react';
import 'animate.css';

export default function Assignments() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  const [activeRoom, setActiveRoom] = useState({ id: '', name: '' });
  const [activeSemester, setActiveSemester] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [isEditing, setIsEditing] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);

  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [form, setForm] = useState({
    id: null, subject_id: '', title: '', description: '', due_date: '', file_url: null, file_name: null 
  });

  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);

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

    const room = localStorage.getItem('activeRoom');
    if (room) setActiveRoom(JSON.parse(room));
  }, []);

  useEffect(() => {
    if (activeRoom.id) fetchData();
  }, [activeRoom]);

  const logActivity = async (action, details) => {
    if (currentUser) {
      await supabase.from('activity_logs').insert({ action, details, user_id: currentUser.id });
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      if (sem && activeRoom.id) {
        const { data: tasks } = await supabase
          .from('assignments')
          .select('*, subjects(code, name)')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('due_date', { ascending: false });
        setAssignments(tasks || []);

        const { data: sub } = await supabase
          .from('subjects')
          .select('id, code, name')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('code', { ascending: true });
        setSubjects(sub || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatToDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const formatDisplayDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const isExpired = (dateStr) => new Date(dateStr) < new Date();

  // --- Actions ---
  const openView = (task) => { setViewingTask(task); document.body.style.overflow = 'hidden'; };
  const closeView = () => { setViewingTask(null); document.body.style.overflow = 'auto'; };

  const openCreate = () => {
    setForm({ id: null, subject_id: '', title: '', description: '', due_date: '', file_url: null, file_name: null });
    setSelectedFile(null); setIsEditing(false); setViewMode('form');
  };

  const openEdit = (task) => {
    setForm({
      id: task.id, subject_id: task.subject_id, title: task.title, description: task.description || '',
      due_date: formatToDatetimeLocal(task.due_date), file_url: task.file_url, file_name: task.file_url ? task.file_url.split('/').pop() : null
    });
    setSelectedFile(null); setIsEditing(true); setViewMode('form');
  };

  const goBack = () => setViewMode('list');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setForm({ ...form, file_name: file.name });
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setForm({ ...form, file_name: null, file_url: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Discord Webhook ---
  const sendDiscordNotification = async (payloadData, actionType) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const subject = subjects.find(s => s.id === payloadData.subject_id);
      const subjectName = subject ? `${subject.code} ${subject.name}` : 'ไม่ระบุ';
      const userName = userProfile?.first_name || currentUser?.email || 'ไม่ทราบชื่อ';
      const userRole = userProfile?.role || 'Unknown';

      const color = actionType === 'delete' ? 16711680 : actionType === 'edit' ? 16753920 : 3447003;
      const titlePrefix = actionType === 'delete' ? "🗑️ ลบงาน" : actionType === 'edit' ? "✏️ แก้ไขงาน" : "📢 สั่งงานใหม่";

      const discordPayload = {
        embeds: [{
          title: `${titlePrefix}: ${payloadData.title}`,
          color: color,
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "📚 รายวิชา", value: subjectName, inline: true },
            { name: "⏰ กำหนดส่ง", value: formatDisplayDate(payloadData.due_date), inline: false },
            { name: "📝 รายละเอียด", value: payloadData.description || 'ไม่มีระบุ', inline: false },
            { name: "📎 ไฟล์แนบ", value: payloadData.file_url ? `[ดาวน์โหลดไฟล์](${payloadData.file_url})` : 'ไม่มีไฟล์แนบ', inline: false },
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${userRole})`, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(discordPayload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const saveAssignment = async () => {
    if (!form.subject_id || !form.title || !form.due_date) return alert('กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน');

    setIsSaving(true);
    try {
      let uploadedUrl = form.file_url;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `task-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('assignments').upload(fileName, selectedFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('assignments').getPublicUrl(fileName);
        uploadedUrl = publicUrl;
      }

      const properISOString = new Date(form.due_date).toISOString();

      const payload = {
        subject_id: form.subject_id, room_id: activeRoom.id, semester_id: activeSemester.id,
        title: form.title, description: form.description, due_date: properISOString, file_url: uploadedUrl
      };

      if (isEditing) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', form.id);
        if (error) throw error;
        await sendDiscordNotification(payload, 'edit');
        await logActivity('แก้ไขงาน', `อัปเดตงาน: ${form.title}`);
      } else {
        const { error } = await supabase.from('assignments').insert(payload);
        if (error) throw error;
        await sendDiscordNotification(payload, 'create');
        await logActivity('สร้างงานใหม่', `เพิ่มงาน: ${form.title}`);
      }

      await fetchData();
      goBack();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAssignment = async (id, title, fileUrl) => {
    if (!window.confirm(`คุณต้องการลบงาน "${title}" ใช่หรือไม่?\nข้อมูลการส่งงานของนักศึกษาจะถูกลบไปด้วย!`)) return;
    
    try {
      if (fileUrl) {
        const fileName = fileUrl.split('/').pop();
        if (fileName) await supabase.storage.from('assignments').remove([fileName]);
      }

      // ดึงข้อมูลก่อนลบเพื่อส่ง Discord
      const taskToDelete = assignments.find(a => a.id === id);

      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;

      if (taskToDelete) await sendDiscordNotification(taskToDelete, 'delete');
      await logActivity('ลบงาน', `ลบงาน: ${title}`);

      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const preventAction = (e) => e.preventDefault();

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="h-full pb-10 relative animate__animated animate__fadeIn select-none font-sans">
      
      {viewMode === 'list' && (
        <div>
          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3] shadow-sm">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">งานภายในรายวิชา</h1>
                <p className="text-sm text-zinc-500">จัดการงานของเทอมปัจจุบัน ({activeSemester ? `ปี ${activeSemester.year} ภาค ${activeSemester.term}` : '-'})</p>
              </div>
            </div>
            {!isUser && (
              <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold transition-all text-sm shadow-lg shadow-blue-500/20 active:scale-95 shrink-0">
                <Plus className="w-4 h-4"/> สร้างงานใหม่
              </button>
            )}
          </div>

          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
                <thead className="border-b border-gray-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  <tr>
                    <th className="pb-4 px-4">ชื่องาน</th>
                    <th className="pb-4 px-4 w-32">วิชา</th>
                    <th className="pb-4 px-4 w-48">กำหนดส่ง</th>
                    <th className="pb-4 px-4 w-32 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="4" className="py-10 text-center text-zinc-500">กำลังโหลด...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan="4" className="py-10 text-center text-zinc-400 border border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl block mt-4 bg-gray-50 dark:bg-white/5">ยังไม่มีงานในเทอมนี้</td></tr>
                  ) : (
                    assignments.map(task => {
                      const expired = isExpired(task.due_date);
                      return (
                        <tr key={task.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-bold text-zinc-900 dark:text-white select-text">{task.title}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold whitespace-nowrap border border-indigo-100 dark:border-indigo-500/20">
                              {task.subjects?.code}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium">
                                <Clock className="w-3.5 h-3.5 opacity-70" /> {formatDisplayDate(task.due_date)}
                              </span>
                              {expired && (
                                <span className="flex items-center gap-1 text-[11px] text-red-500 font-bold">
                                  <AlertCircle className="w-3 h-3" /> หมดเขต
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openView(task)} className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md transition-colors" title="ดูรายละเอียด">
                                <Eye className="w-4 h-4"/>
                              </button>
                              {!isUser && (
                                <>
                                  <button onClick={() => openEdit(task)} className="p-1.5 text-[#0071e3] bg-blue-50 dark:bg-[#0071e3]/10 hover:bg-blue-100 dark:hover:bg-[#0071e3]/20 rounded-md transition-colors" title="แก้ไข">
                                    <Edit className="w-4 h-4"/>
                                  </button>
                                  <button onClick={() => deleteAssignment(task.id, task.title, task.file_url)} className="p-1.5 text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-colors" title="ลบ">
                                    <Trash2 className="w-4 h-4"/>
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
          </div>
        </div>
      )}

      {/* Modal View Task */}
      {viewingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster" onClick={closeView}>
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate__animated animate__zoomIn animate__faster" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-start bg-zinc-50 dark:bg-[#121214]">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1.5">{viewingTask.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded text-xs font-bold border border-indigo-200 dark:border-indigo-500/20">
                    {viewingTask.subjects?.code}
                  </span>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{viewingTask.subjects?.name}</span>
                </div>
              </div>
              <button onClick={closeView} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white bg-white dark:bg-zinc-800 p-2 rounded-full transition-colors shrink-0 shadow-sm">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto w-full space-y-6">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">กำหนดส่ง (Due Date)</h3>
                <div className={`flex items-center gap-2 text-sm font-bold p-3.5 rounded-xl border ${isExpired(viewingTask.due_date) ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'}`}>
                  <Clock className="w-5 h-5"/> {formatDisplayDate(viewingTask.due_date)}
                  {isExpired(viewingTask.due_date) && <span className="ml-auto text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-md">หมดเขตแล้ว</span>}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">รายละเอียดงาน (Description)</h3>
                <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap text-sm leading-relaxed bg-zinc-50 dark:bg-[#09090b] p-4 rounded-xl border border-gray-200 dark:border-zinc-800 min-h-[100px]">
                  {viewingTask.description || <span className="text-zinc-400 italic">ไม่มีการระบุรายละเอียดเพิ่มเติม</span>}
                </div>
              </div>

              {viewingTask.file_url && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">ไฟล์แนบ (Attachment)</h3>
                  <a href={viewingTask.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-sm font-medium bg-blue-50 dark:bg-[#0071e3]/10 p-4 rounded-xl border border-blue-200 dark:border-[#0071e3]/30 hover:bg-blue-100 dark:hover:bg-[#0071e3]/20 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center text-[#0071e3] shadow-sm shrink-0">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <span className="text-[#0071e3] dark:text-blue-400 truncate">{viewingTask.file_url.split('/').pop()}</span>
                    </div>
                    <span className="shrink-0 text-white bg-[#0071e3] px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#0077ED] transition-colors">ดาวน์โหลด</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form Add / Edit */}
      {viewMode === 'form' && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={goBack} className="w-10 h-10 bg-white dark:bg-[#121214] hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 transition-colors shadow-sm shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {isEditing ? 'แก้ไขงาน (Edit)' : 'สร้างงานใหม่'}
              </h1>
              <p className="text-sm text-zinc-500">
                {isEditing ? 'อัปเดตรายละเอียดและกำหนดการ' : 'เพิ่มข้อมูลและรายละเอียดงานเข้าสู่ระบบ'}
              </p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">รายวิชา <span className="text-red-500">*</span></label>
                <select value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/50 outline-none transition-colors">
                  <option value="" disabled>-- เลือกรหัสวิชา --</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">ภาคการศึกษา</label>
                <div className="w-full bg-gray-100 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed">
                  ปี {activeSemester?.year} / ภาค {activeSemester?.term} (ปัจจุบัน)
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">ชื่องาน (หัวข้อ) <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="เช่น Week2 งานจัดสเป็คคอมพิวเตอร์" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/50 outline-none transition-colors" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">รายละเอียดงาน (Description)</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="5" placeholder="อธิบายรายละเอียด คำสั่ง หรือเงื่อนไขของงาน..." className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/50 outline-none transition-colors resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">วันและเวลากำหนดส่ง <span className="text-red-500">*</span></label>
                <input type="datetime-local" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/50 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]" />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center justify-between">
                  ไฟล์แนบประกอบการสั่งงาน
                  {form.file_name && <span className="text-[#0071e3] font-normal text-xs bg-blue-50 dark:bg-[#0071e3]/20 px-2 py-0.5 rounded">มีไฟล์แล้ว</span>}
                </label>
                
                {form.file_name ? (
                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm shadow-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-[#0071e3] shrink-0"/>
                      <span className="text-zinc-900 dark:text-zinc-300 font-medium truncate">{form.file_name}</span>
                    </div>
                    <button onClick={removeFile} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-full">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <button onClick={() => fileInputRef.current.click()} className="w-full bg-zinc-50 hover:bg-gray-100 dark:bg-[#09090b] dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 flex items-center justify-center gap-2 transition-colors border-dashed shadow-sm">
                      <UploadCloud className="w-4 h-4" /> เลือกไฟล์อัปโหลด
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-zinc-800">
              <button onClick={goBack} className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm transition-colors">
                ยกเลิก
              </button>
              <button onClick={saveAssignment} disabled={isSaving} className={`w-full sm:w-auto px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'shadow-lg shadow-blue-500/20 active:scale-[0.98]'}`}>
                {isSaving ? 'กำลังบันทึก...' : <><Save className="w-4 h-4" /> บันทึกข้อมูล</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}