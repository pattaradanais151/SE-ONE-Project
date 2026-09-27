// src/apps/job/views/admin/Subjects.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  BookOpen, Plus, Edit2, Trash2, Search, X, Save
} from 'lucide-react';
import 'animate.css';

export default function Subjects() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    code: '',
    name: ''
  });

  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (activeRoom.id) {
      fetchData();
    }
  }, [activeRoom]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      if (sem && activeRoom.id) {
        const { data } = await supabase
          .from('subjects')
          .select('*')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('code', { ascending: true });
          
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = logData.type === 'delete' ? 16711680 : logData.type === 'edit' ? 16753920 : 3447003;
      const userName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: logData.title,
          color: color,
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "🎓 เทอม", value: activeSemester ? `${activeSemester.term}/${activeSemester.year}` : '-', inline: true },
            { name: "📚 รหัสวิชา", value: logData.code, inline: false },
            { name: "📖 ชื่อวิชา", value: logData.name, inline: false },
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${userProfile?.role || 'Unknown'})`, inline: false }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('activity_logs').insert({ action, details, user_id: user.id });
    }
  };

  const openModal = (sub = null) => {
    if (sub) {
      setEditingId(sub.id);
      setForm({ code: sub.code, name: sub.name });
    } else {
      setEditingId(null);
      setForm({ code: '', name: '' });
    }
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        code: form.code,
        name: form.name,
        room_id: activeRoom.id,
        semester_id: activeSemester.id
      };

      if (editingId) {
        const { error } = await supabase.from('subjects').update(payload).eq('id', editingId);
        if (error) throw error;
        
        await sendDiscordLog({ title: "✏️ แก้ไขรายวิชา", code: payload.code, name: payload.name, type: "edit" });
        await logActivity('แก้ไขรายวิชา', `อัปเดตวิชา: ${payload.code} ${payload.name}`);
      } else {
        const { error } = await supabase.from('subjects').insert([payload]);
        if (error) throw error;
        
        await sendDiscordLog({ title: "📘 เพิ่มรายวิชาใหม่", code: payload.code, name: payload.name, type: "create" });
        await logActivity('เพิ่มรายวิชา', `เพิ่มวิชา: ${payload.code} ${payload.name}`);
      }

      closeModal();
      fetchData();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSubject = async (id, code, name) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบวิชา "${code} ${name}" ?\nคำเตือน: งานที่เชื่อมโยงกับวิชานี้อาจได้รับผลกระทบ!`)) return;
    
    try {
      const { error } = await supabase.from('subjects').delete().eq('id', id);
      if (error) throw error;

      await sendDiscordLog({ title: "🗑️ ลบรายวิชา", code: code, name: name, type: "delete" });
      await logActivity('ลบรายวิชา', `ลบวิชา: ${code} ${name}`);

      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => 
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subjects, searchQuery]);

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">จัดการรายวิชา</h1>
            <p className="text-sm text-zinc-500">
              รายวิชาของห้อง <span className="font-bold text-[#0071e3]">{activeRoom.name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัส หรือ ชื่อวิชา..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[#0071e3] transition-colors"
            />
          </div>
          {!isUser && (
            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full font-bold transition-all text-sm shadow-lg shadow-blue-500/20 active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /> เพิ่มวิชา
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#0071e3]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSubjects.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-xl border border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem]">
              ยังไม่มีรายวิชาในระบบ (หรือค้นหาไม่พบ)
            </div>
          )}

          {filteredSubjects.map(sub => (
            <div key={sub.id} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider font-mono">
                  {sub.code}
                </div>
                {!isUser && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(sub)} className="p-1.5 text-[#0071e3] hover:bg-blue-50 dark:hover:bg-[#0071e3]/10 rounded-md transition-colors"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => deleteSubject(sub.id, sub.code, sub.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight mb-2">{sub.name}</h3>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800/80 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingId ? 'แก้ไขรายวิชา' : 'เพิ่มรายวิชาใหม่'}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveSubject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">รหัสวิชา (Code) *</label>
                <input 
                  type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all uppercase"
                  placeholder="เช่น SWE101"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">ชื่อรายวิชา (Name) *</label>
                <input 
                  type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all"
                  placeholder="เช่น Software Engineering Principles"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50">
                  {isSaving ? 'กำลังบันทึก...' : <><Save className="w-4 h-4 inline mr-2"/>บันทึก</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}