// src/apps/job/views/admin/ResourceCenter.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  FolderOpen, UploadCloud, Download, Trash2, 
  FileText, FileArchive, FileImage, FileCode, File,
  Loader2, AlertCircle
} from 'lucide-react';
import 'animate.css';

export default function ResourceCenter() {
  const { userProfile } = useOutletContext();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const BUCKET_NAME = 'resources';
  const fileInputRef = useRef(null);

  const preventAction = (e) => e.preventDefault();
  const isAdmin = useMemo(() => userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin', [userProfile]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
        sortBy: { column: 'created_at', order: 'desc' }
      });
      if (error) throw error;
      setFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder') || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileName = (fileName) => {
    return fileName.replace(/_(\d{13})(?=\.\w+$)/, '');
  };

  // 🚀 ระบบยิงแจ้งเตือน Discord แบบแนบไฟล์ตรง
  const sendDiscordLog = async (action, fileName, fileBlob = null) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const adminName = userProfile?.first_name || 'Admin';
      const cleanFileName = formatFileName(fileName);
      const isUpload = action === 'upload';

      const embed = {
        title: isUpload ? "📂 อัปโหลดเอกสารใหม่ (คลังส่วนกลาง)" : "🗑️ ลบเอกสาร (คลังส่วนกลาง)",
        color: isUpload ? 3447003 : 16711680,
        fields: [
          { name: "ชื่อไฟล์", value: cleanFileName, inline: true },
          { name: "ผู้ทำรายการ", value: `${adminName}`, inline: true }
        ],
        footer: { text: "SE Portal Resource Center" },
        timestamp: new Date().toISOString()
      };

      if (fileBlob) {
        embed.fields.push({ name: "📥 ดาวน์โหลด", value: "โหลดไฟล์ได้จากข้อความแนบด้านล่างเลย 👇", inline: false });
      }

      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({ embeds: [embed] }));
      
      // แนบไฟล์ไปกับ Discord โดยตรง เพื่อซ่อนลิงก์ Supabase
      if (fileBlob) {
        formData.append('files[0]', fileBlob, cleanFileName);
      }

      await fetch(webhookUrl, { method: 'POST', body: formData });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const originalName = file.name;
      const lastDotIndex = originalName.lastIndexOf('.');
      const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
      const ext = lastDotIndex !== -1 ? originalName.substring(lastDotIndex) : '';

      const safeBaseName = baseName.replace(/\s+/g, '-').replace(/[#?%&*{}\\/:<>+|"']/g, '');
      const fileName = `${safeBaseName}_${Date.now()}${ext}`;

      // อัปโหลดเข้า Supabase
      const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
      if (error) throw error;
      
      // ส่งแจ้งเตือน+แนบไฟล์เข้า Discord
      await sendDiscordLog('upload', fileName, file);
      
      await fetchFiles();
    } catch (error) {
      alert(`อัปโหลดล้มเหลว: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadFile = async (fileName) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fileName);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = formatFileName(fileName);
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert(`ดาวน์โหลดล้มเหลว: ${error.message}`);
    }
  };

  const deleteFile = async (fileName) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้ออกจากคลังกลาง?')) return;
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      if (error) throw error;
      
      setFiles(files.filter(f => f.name !== fileName));
      await sendDiscordLog('delete', fileName); // ส่งแจ้งเตือนการลบ
      
    } catch (error) {
      alert(`ลบไฟล์ล้มเหลว: ${error.message}`);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.slice((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1).toUpperCase();
  };

  const getFileIcon = (ext) => {
    const e = ext.toLowerCase();
    if (['zip', 'rar', '7z', 'tar'].includes(e)) return FileArchive;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(e)) return FileImage;
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py'].includes(e)) return FileCode;
    if (['pdf', 'doc', 'docx', 'txt'].includes(e)) return FileText;
    return File;
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="h-full pb-10 animate__animated animate__fadeIn max-w-6xl mx-auto select-none font-sans">
      
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">คลังเอกสารกลาง</h1>
            <p className="text-sm text-zinc-500">รวมไฟล์เอกสาร ใบงาน โปรแกรมทั้งหมดที่ใช้งานในหลักสูตร</p>
          </div>
        </div>
        
        {isAdmin && (
          <label className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white cursor-pointer shadow-lg bg-[#0071e3] hover:bg-[#0077ED] transition-all hover:scale-105 active:scale-95 ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}>
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลดเอกสารใหม่'}
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} disabled={isUploading} />
          </label>
        )}
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="hidden sm:grid grid-cols-12 gap-4 p-5 bg-zinc-50/50 dark:bg-[#09090b]/50 border-b border-gray-100 dark:border-zinc-800/50 text-xs font-bold text-zinc-500 uppercase tracking-wider">
          <div className="col-span-6">ชื่อเอกสาร</div>
          <div className="col-span-2 text-center">ชนิด</div>
          <div className="col-span-2 text-right">ขนาด</div>
          <div className="col-span-2 text-center">จัดการ</div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800/50">
          {isLoading ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]" />
            </div>
          ) : files.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
              <AlertCircle className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">ยังไม่มีไฟล์ในคลังเอกสาร</p>
            </div>
          ) : (
            files.map((file) => {
              const ext = getFileExtension(file.name);
              const Icon = getFileIcon(ext);
              const displayFileName = formatFileName(file.name);
              
              return (
                <div key={file.id} className="flex items-center justify-between sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4 overflow-hidden sm:col-span-6 w-full min-w-0">
                    <div className="w-12 h-12 rounded-[14px] bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center text-[#0071e3] border border-gray-200 dark:border-zinc-800 shrink-0">
                      <Icon className="w-6 h-6 opacity-80" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-bold text-[15px] text-zinc-900 dark:text-white truncate" title={displayFileName}>
                        {displayFileName}
                      </span>
                      <div className="flex sm:hidden items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded uppercase">{ext || 'FILE'}</span>
                        <span className="text-[11px] font-mono text-zinc-500">{formatSize(file.metadata?.size || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:flex col-span-2 items-center justify-center">
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md uppercase border border-gray-200 dark:border-zinc-700/50">
                      {ext || 'FILE'}
                    </span>
                  </div>

                  <div className="hidden sm:flex col-span-2 items-center justify-end text-[13px] text-zinc-500 font-mono">
                    {formatSize(file.metadata?.size || 0)}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 shrink-0 sm:col-span-2">
                    <button onClick={() => downloadFile(file.name)} className="p-2 text-[#0071e3] bg-blue-50 dark:bg-[#0071e3]/10 hover:bg-[#0071e3] hover:text-white dark:hover:bg-[#0071e3] rounded-lg transition-colors" title="ดาวน์โหลด">
                      <Download className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button onClick={() => deleteFile(file.name)} className="p-2 text-zinc-400 hover:text-white bg-zinc-50 hover:bg-red-500 dark:bg-zinc-800 dark:hover:bg-red-500 rounded-lg transition-colors" title="ลบไฟล์">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}