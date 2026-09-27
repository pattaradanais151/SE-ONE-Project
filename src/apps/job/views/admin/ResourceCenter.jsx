// src/apps/job/views/admin/ResourceCenter.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FolderOpen, Plus, Edit2, Trash2, Search, ExternalLink, X, Save, FileBox
} from 'lucide-react';
import 'animate.css';

export default function ResourceCenter() {
  const { userProfile, activeRoom } = useOutletContext();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ title: '', url: '', category: 'เอกสารประกอบการเรียน' });

  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);
  const preventAction = (e) => e.preventDefault();

  const categories = ['เอกสารประกอบการเรียน', 'โปรแกรม/ซอฟต์แวร์', 'วิดีโอย้อนหลัง', 'อื่นๆ'];

  useEffect(() => {
    if (activeRoom.id) fetchResources();
  }, [activeRoom]);

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources') // สมมติว่ามีตารางชื่อ resources
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error; // ข้าม error ถ้ายังไม่ได้สร้างตาราง
      setResources(data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (actionTitle, resTitle) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const payload = {
        embeds: [{
          title: actionTitle,
          color: 3447003,
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "📁 ชื่อทรัพยากร", value: resTitle, inline: true },
            { name: "👤 ผู้ทำรายการ", value: `${userProfile?.first_name || 'Admin'}`, inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const openModal = (res = null) => {
    if (res) {
      setEditingId(res.id);
      setForm({ title: res.title, url: res.url, category: res.category || 'เอกสารประกอบการเรียน' });
    } else {
      setEditingId(null);
      setForm({ title: '', url: '', category: 'เอกสารประกอบการเรียน' });
    }
    setIsModalOpen(true);
  };

  const saveResource = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { title: form.title, url: form.url, category: form.category, room_id: activeRoom.id };
      
      if (editingId) {
        await supabase.from('resources').update(payload).eq('id', editingId);
        await sendDiscordLog("✏️ แก้ไขข้อมูล Resource", form.title);
      } else {
        await supabase.from('resources').insert([payload]);
        await sendDiscordLog("📂 เพิ่ม Resource ใหม่", form.title);
      }
      setIsModalOpen(false);
      fetchResources();
    } catch (error) {
      alert(`บันทึกข้อมูลไม่สำเร็จ: ตรวจสอบว่ามี Table 'resources' ใน Supabase หรือยัง`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteResource = async (id, title) => {
    if (!window.confirm(`ลบทรัพยากร "${title}" ใช่หรือไม่?`)) return;
    try {
      await supabase.from('resources').delete().eq('id', id);
      await sendDiscordLog("🗑️ ลบ Resource", title);
      setResources(resources.filter(r => r.id !== id));
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const filteredResources = resources.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ศูนย์ทรัพยากร (Resource)</h1>
            <p className="text-sm text-zinc-500">เอกสารและเครื่องมือสนับสนุนการเรียน {activeRoom.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อเอกสาร..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          {!isUser && (
            <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-lg shadow-indigo-500/20 active:scale-95 text-sm shrink-0 transition-all">
              <Plus className="w-4 h-4" /> เพิ่ม
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>
        ) : filteredResources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 bg-white/50 dark:bg-black/20 rounded-[2rem] border border-dashed border-gray-300 dark:border-zinc-700">ไม่มีข้อมูลทรัพยากร</div>
        ) : (
          filteredResources.map(res => (
            <div key={res.id} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-100 dark:border-indigo-500/20">{res.category}</span>
                {!isUser && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(res)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => deleteResource(res.id, res.title)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 className="w-4 h-4"/></button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-6 line-clamp-2">{res.title}</h3>
              <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-50 dark:bg-[#09090b] hover:bg-gray-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-colors border border-gray-200 dark:border-zinc-700/50">
                เปิดเอกสาร <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn animate__faster">
          <div className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-2xl border border-white dark:border-zinc-800/80 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800/80 flex justify-between items-center bg-zinc-50 dark:bg-[#121214]">
              <h2 className="text-xl font-bold">{editingId ? 'แก้ไขข้อมูล' : 'เพิ่มทรัพยากรใหม่'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveResource} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">ชื่อทรัพยากร / เอกสาร *</label>
                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">URL ปลายทาง *</label>
                <input type="url" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-400 mb-1.5">หมวดหมู่</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50">
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