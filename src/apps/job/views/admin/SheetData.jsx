// src/apps/job/views/admin/SheetData.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FileSpreadsheet, ExternalLink, Search, Plus, X, Save, Trash2, Edit2
} from 'lucide-react';
import 'animate.css';

export default function SheetData() {
  const { userProfile, activeRoom } = useOutletContext();
  const [sheets, setSheets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', url: '', description: '' });

  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (activeRoom.id) fetchSheets();
  }, [activeRoom]);

  const fetchSheets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('sheet_data').select('*').eq('room_id', activeRoom.id).order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setSheets(data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSheet = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...form, room_id: activeRoom.id };
      if (editingId) {
        await supabase.from('sheet_data').update(payload).eq('id', editingId);
      } else {
        await supabase.from('sheet_data').insert([payload]);
      }
      
      const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
          embeds: [{ title: "📊 อัปเดตข้อมูล Sheet", description: `หัวข้อ: ${payload.title}\nผู้ดำเนินการ: ${userProfile?.first_name || 'Admin'}`, color: 3066993 }]
        })});
      }
      setIsModalOpen(false);
      fetchSheets();
    } catch (err) {
      alert("โปรดตรวจสอบว่ามีตาราง 'sheet_data' ใน Database แล้ว");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSheet = async (id, title) => {
    if(!window.confirm(`ลบชีตข้อมูล "${title}"?`)) return;
    await supabase.from('sheet_data').delete().eq('id', id);
    setSheets(sheets.filter(s => s.id !== id));
  };

  const filteredSheets = sheets.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ฐานข้อมูลดิบ (Sheet Data)</h1>
            <p className="text-sm text-zinc-500">รวมลิงก์ Google Sheets สำหรับจัดการคะแนน {activeRoom.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อ Sheet..." 
              className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-emerald-500"
            />
          </div>
          {userProfile?.role !== 'User' && (
            <button onClick={() => { setForm({title:'', url:'', description:''}); setEditingId(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 active:scale-95 text-sm shrink-0 transition-all">
              <Plus className="w-4 h-4" /> เพิ่มชีต
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div></div>
        ) : filteredSheets.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-gray-300 dark:border-zinc-700 rounded-[2rem]">ยังไม่มีข้อมูล Google Sheets</div>
        ) : (
          filteredSheets.map(sheet => (
            <div key={sheet.id} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm hover:-translate-y-1 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1">{sheet.title}</h3>
                  {userProfile?.role !== 'User' && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setForm(sheet); setEditingId(sheet.id); setIsModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={() => deleteSheet(sheet.id, sheet.title)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500 mb-6 line-clamp-2">{sheet.description || 'ไม่มีคำอธิบาย'}</p>
              </div>
              <a href={sheet.url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold transition-colors">
                เปิด Google Sheets <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-md animate__animated animate__fadeIn">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate__animated animate__zoomIn animate__faster p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{editingId ? 'แก้ไขข้อมูล' : 'เพิ่มชีตใหม่'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveSheet} className="space-y-4">
              <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="ชื่อชีต (เช่น คะแนนมิดเทอม)" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              <input type="url" required value={form.url} onChange={e => setForm({...form, url: e.target.value})} placeholder="URL Google Sheets" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="คำอธิบายเพิ่มเติม..." rows="3" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500 resize-none"></textarea>
              <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50">
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}