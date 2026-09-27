// src/apps/job/views/admin/Announcements.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Megaphone, Plus, Edit2, Trash2, Globe, Monitor, X 
} from 'lucide-react';
import 'animate.css';

export default function Announcements() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeRoom, setActiveRoom] = useState({ id: '', name: '' });
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', content: '', is_global: false, is_visible: true
  });

  const preventAction = (e) => e.preventDefault();

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
    if (room) {
      setActiveRoom(JSON.parse(room));
    }
  }, []);

  useEffect(() => {
    if (activeRoom.id) {
      fetchAnnouncements();
    }
  }, [activeRoom]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`room_id.eq.${activeRoom.id},is_global.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionUser = () => {
    return userProfile?.first_name 
      ? `${userProfile.first_name} (${userProfile.role})` 
      : currentUser?.email?.split('@')[0] || 'Admin';
  };

  const sendDiscordLog = async (logData) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;
    try {
      const color = logData.type === 'error' ? 16711680 : logData.type === 'warning' ? 16753920 : 3447003;
      const payload = {
        embeds: [{
          title: logData.title,
          description: logData.description,
          color: color,
          fields: [{ name: "👤 ผู้ทำรายการ", value: logData.user, inline: true }],
          timestamp: new Date().toISOString()
        }]
      };
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Log Error:', error);
    }
  };

  const openModal = (ann = null) => {
    if (ann) {
      setEditingId(ann.id);
      setFormData({ title: ann.title, content: ann.content, is_global: ann.is_global, is_visible: ann.is_visible });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', is_global: false, is_visible: true });
    }
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const saveAnnouncement = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        is_global: formData.is_global,
        is_visible: formData.is_visible,
        room_id: formData.is_global ? null : activeRoom.id,
        created_by: currentUser?.id
      };

      if (editingId) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingId);
        if (error) throw error;
        await sendDiscordLog({
          title: "📝 แก้ไขประกาศ",
          description: `อัปเดตหัวข้อ: ${payload.title}`,
          type: "warning",
          user: getActionUser()
        });
      } else {
        const { error } = await supabase.from('announcements').insert([payload]);
        if (error) throw error;
        await sendDiscordLog({
          title: "📢 สร้างประกาศใหม่",
          description: `เพิ่มหัวข้อ: ${payload.title}`,
          type: "info",
          user: getActionUser()
        });
      }

      closeModal();
      fetchAnnouncements();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAnnouncement = async (id, title) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${title}" ?`)) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      
      await sendDiscordLog({
        title: "🗑️ ลบประกาศ",
        description: `ลบหัวข้อ: ${title}`,
        type: "error",
        user: getActionUser()
      });

      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const toggleVisibility = async (id, currentStatus) => {
    try {
      setAnnouncements(announcements.map(a => a.id === id ? { ...a, is_visible: !currentStatus } : a));
      const { error } = await supabase.from('announcements').update({ is_visible: !currentStatus }).eq('id', id);
      if (error) throw error;
    } catch (error) {
      fetchAnnouncements(); // Revert on fail
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
      className="animate__animated animate__fadeIn select-none font-sans"
    >
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-[#0071e3]/10 rounded-2xl flex items-center justify-center text-[#0071e3]">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">จัดการประกาศข่าวสาร (Announcements)</h1>
            <p className="text-sm text-zinc-500">ข้อความประกาศเหล่านี้จะไปแสดงผลที่หน้าแรกของ Workspace</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> เพิ่มประกาศใหม่
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0071e3]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
          {announcements.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-xl border border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem]">
              ยังไม่มีประกาศในระบบ
            </div>
          )}
          
          {announcements.map(ann => (
            <div key={ann.id} className={`bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border ${ann.is_visible ? 'border-white dark:border-zinc-800/80' : 'border-red-200 dark:border-red-900/30 opacity-70'} rounded-[2rem] p-6 flex flex-col justify-between transition-colors duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${ann.is_visible ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-gray-100 dark:bg-zinc-800 text-zinc-500 border border-gray-300 dark:border-zinc-700'}`}>
                    {ann.is_visible ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span> กำลังแสดงผล</> : <><X className="w-3 h-3"/> ซ่อนอยู่</>}
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1.5">
                    {ann.is_global ? <><Globe className="w-3 h-3"/> แสดงทุกห้อง</> : <><Monitor className="w-3 h-3"/> เฉพาะห้องนี้</>}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2 line-clamp-2">{ann.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 whitespace-pre-wrap">{ann.content}</p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                <span className="text-xs font-medium text-zinc-500">{formatDate(ann.created_at)}</span>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleVisibility(ann.id, ann.is_visible)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${ann.is_visible ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                    title={ann.is_visible ? 'ซ่อนประกาศ' : 'แสดงประกาศ'}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${ann.is_visible ? 'left-[22px]' : 'left-0.5'}`}></span>
                  </button>
                  
                  <button onClick={() => openModal(ann)} className="p-1.5 text-[#0071e3] hover:bg-blue-50 dark:hover:bg-[#0071e3]/10 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteAnnouncement(ann.id, ann.title)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal เพิ่ม/แก้ไข ประกาศ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800/80 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingId ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveAnnouncement} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">หัวข้อประกาศ (Title)</label>
                <input 
                  type="text" required value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all"
                  placeholder="เช่น แจ้งหยุดวันหยุดยาว..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">รายละเอียด (Content)</label>
                <textarea 
                  rows="4" required value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all resize-none"
                  placeholder="ใส่รายละเอียดที่ต้องการแจ้ง..."
                ></textarea>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.is_global} onChange={e => setFormData({...formData, is_global: e.target.checked})} className="w-5 h-5 rounded border-gray-300 dark:border-zinc-700 bg-zinc-50 text-[#0071e3] focus:ring-[#0071e3]"/>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">ประกาศนี้แสดงทุกห้อง (Global)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.is_visible} onChange={e => setFormData({...formData, is_visible: e.target.checked})} className="w-5 h-5 rounded border-gray-300 dark:border-zinc-700 bg-zinc-50 text-emerald-500 focus:ring-emerald-500"/>
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white">เปิดแสดงผลทันที (Visible)</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-medium transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50">
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}