// src/apps/job/views/admin/Semesters.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  CalendarClock, Plus, Trash2, CheckCircle2, X, Save, AlertCircle
} from 'lucide-react';
import 'animate.css';

export default function Semesters() {
  const { userProfile } = useOutletContext();
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [form, setForm] = useState({ year: '', term: '' });

  const preventAction = (e) => e.preventDefault();
  const isSuperAdmin = useMemo(() => userProfile?.role === 'Super Admin', [userProfile]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('*')
        .order('year', { ascending: false })
        .order('term', { ascending: false });

      if (error) throw error;
      setSemesters(data || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const color = logData.type === 'delete' ? 16711680 : logData.type === 'active' ? 3066993 : 3447003;
      const userName = userProfile?.first_name || 'Admin';

      const payload = {
        embeds: [{
          title: logData.actionTitle,
          color: color,
          fields: [
            { name: "🎓 ปีการศึกษา", value: logData.year, inline: true },
            { name: "ภาคเรียน", value: logData.term, inline: true },
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
    if (userProfile) {
      await supabase.from('activity_logs').insert({ action, details, user_id: userProfile.id });
    }
  };

  const openModal = () => {
    const currentYear = new Date().getFullYear() + 543;
    setForm({ year: currentYear.toString(), term: '1' });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const saveSemester = async (e) => {
    e.preventDefault();
    if (!form.year || !form.term) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    
    setIsSaving(true);
    try {
      // Check if exists
      const exists = semesters.find(s => s.year === form.year && s.term === form.term);
      if (exists) return alert('มีปีการศึกษาและภาคเรียนนี้ในระบบแล้ว');

      const { error } = await supabase.from('semesters').insert([{
        year: form.year,
        term: form.term,
        is_active: semesters.length === 0 // ถ้ายังไม่มีเทอมเลยให้เป็นเทอมปัจจุบันอัตโนมัติ
      }]);
      
      if (error) throw error;
      
      await sendDiscordLog({ actionTitle: "📅 เพิ่มปีการศึกษาใหม่", year: form.year, term: form.term, type: "create" });
      await logActivity('เพิ่มปีการศึกษา', `เพิ่มเทอม ${form.term}/${form.year}`);

      closeModal();
      fetchSemesters();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const setAsActive = async (id, year, term) => {
    if (!isSuperAdmin) return alert('เฉพาะ Super Admin เท่านั้นที่สามารถเปลี่ยนเทอมปัจจุบันได้');
    if (!window.confirm(`ยืนยันการตั้งค่าให้ เทอม ${term}/${year} เป็นเทอมปัจจุบันใช่หรือไม่?\n(เทอมอื่นๆ จะถูกเปลี่ยนเป็นอดีตทันที)`)) return;

    setIsUpdatingStatus(true);
    try {
      // 1. Set all to inactive
      await supabase.from('semesters').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
      
      // 2. Set selected to active
      const { error } = await supabase.from('semesters').update({ is_active: true }).eq('id', id);
      if (error) throw error;

      await sendDiscordLog({ actionTitle: "✅ เปลี่ยนเทอมปัจจุบัน", year: year, term: term, type: "active" });
      await logActivity('ตั้งค่าเทอมปัจจุบัน', `ตั้งค่าให้เทอม ${term}/${year} เป็นเทอมปัจจุบัน`);

      fetchSemesters();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const deleteSemester = async (id, year, term, isActive) => {
    if (!isSuperAdmin) return alert('เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลได้');
    if (isActive) return alert('ไม่สามารถลบเทอมปัจจุบันได้ กรุณาเปลี่ยนเทอมปัจจุบันก่อนลบ');
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบ เทอม ${term}/${year} ?\nคำเตือน: ข้อมูลรายวิชาและงานทั้งหมดในเทอมนี้อาจหายไป!`)) return;

    try {
      const { error } = await supabase.from('semesters').delete().eq('id', id);
      if (error) throw error;

      await sendDiscordLog({ actionTitle: "🗑️ ลบปีการศึกษา", year: year, term: term, type: "delete" });
      await logActivity('ลบปีการศึกษา', `ลบเทอม ${term}/${year}`);

      setSemesters(semesters.filter(s => s.id !== id));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล หรือมีข้อมูลที่เชื่อมโยงอยู่');
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 shadow-sm">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ปีการศึกษา (Semesters)</h1>
            <p className="text-sm text-zinc-500">จัดการข้อมูลปีการศึกษา และตั้งค่าเทอมปัจจุบัน</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button onClick={openModal} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-full font-bold transition-all text-sm shadow-lg shadow-pink-500/20 active:scale-95 shrink-0">
            <Plus className="w-4 h-4" /> เพิ่มปีการศึกษา
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-pink-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {semesters.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-xl border border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem]">
              ยังไม่มีข้อมูลปีการศึกษาในระบบ
            </div>
          )}

          {semesters.map(sem => (
            <div key={sem.id} className={`bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border ${sem.is_active ? 'border-pink-300 dark:border-pink-500/50 shadow-md' : 'border-white dark:border-zinc-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none'} rounded-[2rem] p-6 flex flex-col justify-between transition-all group`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${sem.is_active ? 'bg-pink-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-500'}`}>
                    {sem.is_active ? <><CheckCircle2 className="w-3.5 h-3.5"/> เทอมปัจจุบัน</> : 'เทอมที่ผ่านมา'}
                  </div>
                  {isSuperAdmin && !sem.is_active && (
                    <button onClick={() => deleteSemester(sem.id, sem.year, sem.term, sem.is_active)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4"/>
                    </button>
                  )}
                </div>
                
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight mb-1">
                  ปีการศึกษา {sem.year}
                </h3>
                <p className="text-zinc-500 font-medium">ภาคเรียนที่ {sem.term}</p>
              </div>
              
              {!sem.is_active && isSuperAdmin && (
                <button 
                  onClick={() => setAsActive(sem.id, sem.year, sem.term)}
                  disabled={isUpdatingStatus}
                  className="mt-6 w-full py-2.5 bg-gray-100 hover:bg-pink-50 dark:bg-zinc-800 dark:hover:bg-pink-500/10 text-zinc-600 dark:text-zinc-400 hover:text-pink-600 dark:hover:text-pink-400 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  ตั้งเป็นเทอมปัจจุบัน
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Semester */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800/80 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">เพิ่มปีการศึกษาใหม่</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveSemester} className="p-6 space-y-5">
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">การเพิ่มเทอมใหม่จะยังไม่ส่งผลต่อระบบ จนกว่าจะกดตั้งให้เป็น <strong>"เทอมปัจจุบัน"</strong></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">ปีการศึกษา (พ.ศ.) *</label>
                <input 
                  type="text" required value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 outline-none transition-all"
                  placeholder="เช่น 2569"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">ภาคเรียน *</label>
                <select 
                  value={form.term} onChange={e => setForm({...form, term: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 outline-none transition-all"
                >
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                  <option value="3">ภาคเรียนฤดูร้อน (Summer)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-medium transition-colors shadow-lg shadow-pink-500/20 active:scale-[0.98] disabled:opacity-50">
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