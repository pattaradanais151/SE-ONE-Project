// src/apps/job/views/admin/SubmissionLinks.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Link2, Plus, Edit2, Trash2, Search, ExternalLink, X, Save 
} from 'lucide-react';
import 'animate.css';

export default function SubmissionLinks() {
  const { userProfile, activeRoom } = useOutletContext();
  const [links, setLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ title: '', url: '' });

  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (activeRoom.id) {
      fetchLinks();
    }
  }, [activeRoom]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('submission_links')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
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
          title: logData.actionTitle,
          color: color,
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "📌 ชื่อแหล่งส่งงาน", value: logData.title, inline: false },
            { name: "🔗 URL", value: logData.url ? `[คลิกที่นี่](${logData.url})` : '-', inline: false },
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

  const openModal = (link = null) => {
    if (link) {
      setEditingId(link.id);
      setForm({ title: link.title, url: link.url });
    } else {
      setEditingId(null);
      setForm({ title: '', url: '' });
    }
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const saveLink = async (e) => {
    e.preventDefault();
    if (!form.title || !form.url) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    
    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        url: form.url,
        room_id: activeRoom.id
      };

      if (editingId) {
        const { error } = await supabase.from('submission_links').update(payload).eq('id', editingId);
        if (error) throw error;
        
        await sendDiscordLog({ actionTitle: "✏️ แก้ไขแหล่งส่งงาน", title: payload.title, url: payload.url, type: "edit" });
        await logActivity('แก้ไขแหล่งส่งงาน', `อัปเดตลิงก์: ${payload.title}`);
      } else {
        const { error } = await supabase.from('submission_links').insert([payload]);
        if (error) throw error;
        
        await sendDiscordLog({ actionTitle: "🔗 เพิ่มแหล่งส่งงานใหม่", title: payload.title, url: payload.url, type: "create" });
        await logActivity('เพิ่มแหล่งส่งงาน', `เพิ่มลิงก์: ${payload.title}`);
      }

      closeModal();
      fetchLinks();
    } catch (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLink = async (id, title) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบแหล่งส่งงาน "${title}" ?`)) return;
    
    try {
      const { error } = await supabase.from('submission_links').delete().eq('id', id);
      if (error) throw error;

      await sendDiscordLog({ actionTitle: "🗑️ ลบแหล่งส่งงาน", title: title, url: null, type: "delete" });
      await logActivity('ลบแหล่งส่งงาน', `ลบลิงก์: ${title}`);

      setLinks(links.filter(l => l.id !== id));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const filteredLinks = useMemo(() => {
    return links.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [links, searchQuery]);

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">แหล่งส่งงาน (Links)</h1>
            <p className="text-sm text-zinc-500">จัดการลิงก์ Google Drive หรือที่ส่งงานสำหรับ <span className="font-bold text-[#0071e3]">{activeRoom.name}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อแหล่งส่งงาน..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          {!isUser && (
            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-bold transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /> เพิ่มลิงก์
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLinks.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-xl border border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem]">
              ยังไม่มีแหล่งส่งงานในระบบ
            </div>
          )}

          {filteredLinks.map(link => (
            <div key={link.id} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors">
                    <Link2 className="w-5 h-5" />
                  </div>
                  {!isUser && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(link)} className="p-1.5 text-[#0071e3] hover:bg-blue-50 dark:hover:bg-[#0071e3]/10 rounded-md transition-colors"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => deleteLink(link.id, link.title)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight mb-2 truncate">{link.title}</h3>
              </div>
              
              <a href={link.url} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold transition-colors">
                เปิดลิงก์ <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800/80 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{editingId ? 'แก้ไขแหล่งส่งงาน' : 'เพิ่มแหล่งส่งงาน'}</h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveLink} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">ชื่อแหล่งส่งงาน *</label>
                <input 
                  type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                  placeholder="เช่น โฟลเดอร์รวมงานวิชา Database"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">URL ปลายทาง *</label>
                <input 
                  type="url" required value={form.url} onChange={e => setForm({...form, url: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50">
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