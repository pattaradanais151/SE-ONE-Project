// src/apps/job/views/admin/SheetData.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FolderOpen, Plus, Search, Edit2, Trash2, ArrowLeft, 
  Save, UploadCloud, X, Download, ExternalLink, Link as LinkIcon, FileText, Presentation, Eye, Loader2
} from 'lucide-react';
import 'animate.css';

export default function SheetData() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingSheet, setViewingSheet] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [form, setForm] = useState({ id: null, subject_id: '', title: '', week_number: 1, type: 'เอกสารประกอบการเรียน', file_url: null, file_name: null });
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const preventAction = (e) => e.preventDefault();
  const isUser = useMemo(() => userProfile?.role === 'User', [userProfile]);

  useEffect(() => {
    if (activeRoom.id) fetchData();
  }, [activeRoom]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      if (sem && activeRoom.id) {
        const { data: sheetData } = await supabase
          .from('sheet_data')
          .select('*, subjects(code, name)')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('week_number', { ascending: false });
        setSheets(sheetData || []);

        const { data: subData } = await supabase
          .from('subjects')
          .select('id, code, name')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .order('code', { ascending: true });
        setSubjects(subData || []);
      }
    } catch (error) {
      console.error('Error fetching sheet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSheets = useMemo(() => {
    let result = sheets;
    if (filterSubject) result = result.filter(s => s.subject_id === filterSubject);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.title.toLowerCase().includes(q) || s.subjects?.code.toLowerCase().includes(q));
    }
    return result;
  }, [sheets, filterSubject, searchQuery]);

  const groupedSheets = useMemo(() => {
    const groups = {};
    filteredSheets.forEach(sheet => {
      if (!groups[sheet.week_number]) groups[sheet.week_number] = [];
      groups[sheet.week_number].push(sheet);
    });
    return Object.keys(groups).sort((a, b) => b - a).map(week => ({ week: parseInt(week), items: groups[week] }));
  }, [filteredSheets]);

  const openView = (sheet) => {
    setViewingSheet(sheet);
    document.body.style.overflow = 'hidden';
  };
  const closeView = () => {
    setViewingSheet(null);
    document.body.style.overflow = 'auto';
  };

  const openCreate = () => {
    setForm({ id: null, subject_id: '', title: '', week_number: 1, type: 'เอกสารประกอบการเรียน', file_url: null, file_name: null });
    setSelectedFile(null);
    setIsEditing(false);
    setViewMode('form');
  };

  const openEdit = (sheet) => {
    setForm({
      id: sheet.id, subject_id: sheet.subject_id, title: sheet.title, week_number: sheet.week_number,
      type: sheet.type || 'เอกสารประกอบการเรียน', file_url: sheet.file_url,
      file_name: sheet.file_url && !sheet.file_url.startsWith('http') ? sheet.file_url.split('/').pop() : null
    });
    setSelectedFile(null);
    setIsEditing(true);
    setViewMode('form');
  };

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

  const sendDiscordSheetLog = async (action, title, subjectCode, type, externalLink = null, fileBlob = null, fileName = null) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const adminName = userProfile?.first_name || 'Admin';
      const color = action === 'ลบ' ? 16711680 : action === 'แก้ไข' ? 16753920 : 3447003;

      const embed = {
        title: `📘 ${action}ชีตการเรียน`,
        color: color,
        fields: [
          { name: "ชื่อเอกสาร", value: title, inline: false },
          { name: "รหัสวิชา", value: subjectCode || '-', inline: true },
          { name: "ประเภท", value: type, inline: true },
          { name: "ห้องเรียน", value: activeRoom.name, inline: true },
          { name: "ผู้ทำรายการ", value: `${adminName}`, inline: false }
        ],
        footer: { text: "SE Portal Sheet Data" },
        timestamp: new Date().toISOString()
      };

      if (externalLink) {
        embed.fields.push({ name: "🔗 ลิงก์ที่แนบ", value: externalLink, inline: false });
      } else if (fileBlob) {
        embed.fields.push({ name: "📥 ดาวน์โหลด", value: "โหลดไฟล์ได้จากข้อความแนบด้านล่างเลย 👇", inline: false });
      }

      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
      
      if (fileBlob && fileName) {
        formData.append('files[0]', fileBlob, fileName);
      }

      await fetch(webhookUrl, { method: 'POST', body: formData });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const saveSheet = async (e) => {
    e.preventDefault();
    if (!form.subject_id || !form.title || (!form.file_url && !selectedFile)) return alert('กรุณากรอกข้อมูลให้ครบถ้วน');

    setIsSaving(true);
    try {
      let uploadedUrl = form.file_url;
      let finalFileName = selectedFile?.name || form.file_name;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        // แก้ไข: ใช้ Timestamp + Random String เป็นชื่อไฟล์เพื่อหลีกเลี่ยงภาษาไทยที่ทำให้เกิด 400 Bad Request[cite: 3]
        const safeFileName = `sheet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('resources').upload(safeFileName, selectedFile);
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('resources').getPublicUrl(safeFileName);
        uploadedUrl = publicUrl;
      }

      const payload = {
        subject_id: form.subject_id, room_id: activeRoom.id, semester_id: activeSemester.id,
        title: form.title, week_number: form.week_number, type: form.type, file_url: uploadedUrl
      };

      const subjectDetails = subjects.find(s => s.id === form.subject_id);

      if (isEditing) {
        await supabase.from('sheet_data').update(payload).eq('id', form.id);
        await sendDiscordSheetLog('แก้ไข', form.title, subjectDetails?.code, form.type, form.type === 'ลิงก์อื่นๆ' ? form.file_url : null, selectedFile, finalFileName);
      } else {
        await supabase.from('sheet_data').insert([payload]);
        await sendDiscordSheetLog('เพิ่ม', form.title, subjectDetails?.code, form.type, form.type === 'ลิงก์อื่นๆ' ? form.file_url : null, selectedFile, finalFileName);
      }

      await fetchData();
      setViewMode('list');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSheet = async (sheet) => {
    if (!window.confirm(`ลบเอกสาร "${sheet.title}" ใช่หรือไม่?`)) return;
    try {
      if (sheet.file_url && sheet.file_url.includes('supabase.co')) {
        const fileName = sheet.file_url.split('/').pop();
        if (fileName) await supabase.storage.from('resources').remove([fileName]);
      }
      
      await supabase.from('sheet_data').delete().eq('id', sheet.id);
      
      await sendDiscordSheetLog('ลบ', sheet.title, sheet.subjects?.code, sheet.type);
      setSheets(sheets.filter(s => s.id !== sheet.id));
      
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="h-full pb-10 animate__animated animate__fadeIn select-none font-sans">
      
      {/* ===================== LIST MODE ===================== */}
      {viewMode === 'list' && (
        <>
          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm transition-colors">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-[#0071e3] shadow-sm shrink-0">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sheet Data</h1>
                <p className="text-sm text-zinc-500">เอกสาร สไลด์ ใบงานรายสัปดาห์ ของ {activeRoom.name}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-[#0071e3]/10 border border-blue-100 dark:border-[#0071e3]/20 rounded-full shadow-sm w-full sm:w-auto justify-center">
                <span className="text-xs text-[#0071e3] font-bold">เอกสารทั้งหมด</span>
                <span className="text-sm font-black text-[#0071e3]">{filteredSheets.length} รายการ</span>
              </div>
              {!isUser && (
                <button onClick={openCreate} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full font-bold shadow-lg shadow-blue-500/20 active:scale-95 text-sm w-full sm:w-auto transition-all">
                  <Plus className="w-4 h-4" /> เพิ่มงานใหม่
                </button>
              )}
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-4 sm:p-5 mb-8 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="w-full md:w-1/3">
              <div className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-500 font-bold flex justify-center cursor-not-allowed">
                เทอมปัจจุบัน: {activeSemester ? `${activeSemester.year} / ${activeSemester.term}` : '-'}
              </div>
            </div>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full md:w-1/3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] font-bold">
              <option value="">-- กรองเอกสารทุกวิชา --</option>
              {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
            </select>
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ค้นหาชื่อเอกสาร..." className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3]" />
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#0071e3]" /></div>
          ) : groupedSheets.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] bg-white/50 dark:bg-[#121214]/50">ไม่มีข้อมูลเอกสารในระบบ</div>
          ) : (
            <div className="space-y-10">
              {groupedSheets.map(group => (
                <div key={group.week} className="animate__animated animate__fadeInUp">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="px-5 py-1.5 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-full text-[#0071e3] flex items-center gap-2">
                      <span className="text-xs uppercase font-bold">Week</span>
                      <span className="text-lg font-black">{group.week}</span>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-zinc-800 to-transparent"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {group.items.map(sheet => {
                      const isLink = sheet.type === 'ลิงก์อื่นๆ';
                      return (
                        <div key={sheet.id} className="bg-white/90 dark:bg-[#1e1e24] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${sheet.type === 'สไลด์นำเสนอ' ? 'bg-orange-500' : isLink ? 'bg-emerald-500' : 'bg-[#0071e3]'}`}></div>
                          
                          <div className="flex justify-between items-start mb-4 relative">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold ${sheet.type === 'สไลด์นำเสนอ' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10' : isLink ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-blue-50 text-blue-600 dark:bg-[#0071e3]/10'}`}>
                              {sheet.type === 'สไลด์นำเสนอ' && <Presentation className="w-3.5 h-3.5" />}
                              {isLink && <LinkIcon className="w-3.5 h-3.5" />}
                              {!isLink && sheet.type !== 'สไลด์นำเสนอ' && <FileText className="w-3.5 h-3.5" />}
                              {sheet.type}
                            </span>
                            
                            <div className="absolute right-0 top-0 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-[#1e1e24]/80 backdrop-blur pl-2">
                              <button onClick={() => openView(sheet)} className="p-1.5 text-indigo-500 bg-indigo-50 hover:bg-indigo-500 hover:text-white dark:bg-indigo-500/10 rounded-md transition-colors"><Eye className="w-4 h-4"/></button>
                              {!isUser && (
                                <>
                                  <button onClick={() => openEdit(sheet)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white dark:bg-blue-500/10 rounded-md transition-colors"><Edit2 className="w-4 h-4"/></button>
                                  <button onClick={() => deleteSheet(sheet)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex-1 mb-6">
                            <div className="text-[11px] font-bold text-[#0071e3] mb-1 flex items-center gap-2">
                              {sheet.subjects?.code} <span className="text-zinc-400 font-medium truncate">{sheet.subjects?.name}</span>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug line-clamp-2">{sheet.title}</h3>
                          </div>

                          <a href={sheet.file_url || '#'} target={sheet.file_url ? "_blank" : "_self"} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${isLink ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200' : 'bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3] hover:text-white'}`}>
                            {isLink ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                            {isLink ? 'เปิดลิงก์เนื้อหา' : 'ดาวน์โหลดเอกสาร'}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===================== FORM MODE ===================== */}
      {viewMode === 'form' && (
        <div className="max-w-3xl mx-auto animate__animated animate__fadeIn">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setViewMode('list')} className="w-10 h-10 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-full flex items-center justify-center text-zinc-500 hover:text-[#0071e3] shadow-sm transition-all hover:scale-105 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{isEditing ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่'}</h1>
            </div>
          </div>

          <form onSubmit={saveSheet} className="bg-white/90 dark:bg-[#121214]/90 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2">รายวิชา *</label>
                <select required value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#0071e3] outline-none transition-colors">
                  <option value="" disabled>-- เลือกรหัสวิชา --</option>
                  {subjects.map(sub => <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 mb-2">สัปดาห์ที่สอน *</label>
                <input required type="number" min="1" value={form.week_number} onChange={e => setForm({...form, week_number: e.target.value})} className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#0071e3] outline-none" />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-500 mb-2">ชื่อเอกสาร / หัวข้อ *</label>
              <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="เช่น สไลด์บทที่ 1 หรือ ลิงก์ทำแบบทดสอบ" className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#0071e3] outline-none" />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-500 mb-2">ประเภท *</label>
              <div className="flex flex-wrap gap-3">
                {['เอกสารประกอบการเรียน', 'สไลด์นำเสนอ', 'ลิงก์อื่นๆ'].map(t => (
                  <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${form.type === t ? 'border-[#0071e3] bg-blue-50 text-[#0071e3] dark:bg-[#0071e3]/10' : 'border-gray-200 bg-white text-zinc-500 dark:bg-[#09090b] dark:border-zinc-800'}`}>
                    <input type="radio" value={t} checked={form.type === t} onChange={e => setForm({...form, type: e.target.value})} className="hidden" />
                    <span className="text-xs font-bold">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <label className="block text-xs font-bold text-zinc-500 mb-2">
                {form.type === 'ลิงก์อื่นๆ' ? 'URL ของเว็บไซต์' : 'แนบไฟล์เอกสาร'} *
              </label>
              {form.type === 'ลิงก์อื่นๆ' ? (
                <input required type="url" value={form.file_url || ''} onChange={e => setForm({...form, file_url: e.target.value})} placeholder="https://..." className="w-full bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-[#0071e3] outline-none" />
              ) : form.file_name ? (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-[#0071e3]/10 border border-[#0071e3]/30 rounded-xl p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText className="w-5 h-5 text-[#0071e3] shrink-0"/>
                    <span className="text-[#0071e3] font-bold text-sm truncate">{form.file_name}</span>
                  </div>
                  <button type="button" onClick={removeFile} className="p-1.5 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><X className="w-4 h-4"/></button>
                </div>
              ) : (
                <div className="relative w-full">
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} className="w-full bg-zinc-50 hover:bg-blue-50 dark:bg-[#09090b] border-2 border-dashed border-gray-300 dark:border-zinc-700 hover:border-[#0071e3] rounded-2xl py-8 flex flex-col items-center justify-center gap-3 transition-colors group">
                    <UploadCloud className="w-8 h-8 text-zinc-400 group-hover:text-[#0071e3] transition-colors" />
                    <span className="text-sm font-bold text-zinc-500 group-hover:text-[#0071e3]">คลิกเพื่อเลือกไฟล์อัปโหลด</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-zinc-800">
              <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2.5 bg-gray-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700">ยกเลิก</button>
              <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-[#0071e3] text-white font-bold rounded-xl text-sm transition-all hover:bg-[#0077ED] shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/> กำลังบันทึก...</> : <><Save className="w-4 h-4"/> บันทึกข้อมูล</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal ดูรายละเอียดเอกสาร (View Mode) */}
      {viewingSheet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate__animated animate__fadeIn animate__faster" onClick={closeView}>
          <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col animate__animated animate__zoomIn animate__faster" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#16161a] flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">{viewingSheet.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded text-[10px] font-mono font-bold border border-indigo-200 dark:border-indigo-500/30">{viewingSheet.subjects?.code}</span>
                  <span className="text-xs font-medium text-zinc-500">{viewingSheet.subjects?.name}</span>
                </div>
              </div>
              <button onClick={closeView} className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors"><X className="w-4 h-4"/></button>
            </div>
            
            <div className="p-6 bg-white dark:bg-[#09090b] space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-zinc-50 dark:bg-[#121214] border border-gray-100 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">สัปดาห์</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white">{viewingSheet.week_number}</span>
                </div>
                <div className="flex-[2] p-4 bg-zinc-50 dark:bg-[#121214] border border-gray-100 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">ประเภท</span>
                  <span className="text-sm font-bold text-[#0071e3]">{viewingSheet.type}</span>
                </div>
              </div>

              {viewingSheet.file_url && (
                <a href={viewingSheet.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-blue-50 dark:bg-[#0071e3]/10 border border-blue-100 dark:border-[#0071e3]/20 hover:bg-blue-100 dark:hover:bg-[#0071e3]/20 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-3 overflow-hidden pr-4">
                    <div className="w-10 h-10 bg-white dark:bg-black/20 rounded-xl flex items-center justify-center text-[#0071e3] shrink-0">
                      {viewingSheet.type === 'ลิงก์อื่นๆ' ? <LinkIcon className="w-5 h-5"/> : <FileText className="w-5 h-5"/>}
                    </div>
                    <span className="text-sm font-bold text-[#0071e3] truncate">{viewingSheet.file_url.split('/').pop()}</span>
                  </div>
                  <span className="px-4 py-2 bg-[#0071e3] text-white text-[10px] font-bold uppercase rounded-lg shadow-sm shrink-0">เปิดดู</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}