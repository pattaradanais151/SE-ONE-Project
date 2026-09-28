// src/apps/job/views/admin/Schedules.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  CalendarDays, UploadCloud, X, Save, Image as ImageIcon, Loader2
} from 'lucide-react';
import 'animate.css';

export default function Schedules() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  
  // States สำหรับดึงรูปจาก Bucket
  const [scheduleUrl, setScheduleUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const scheduleBlobRef = useRef(null);
  
  // States สำหรับการอัปโหลด
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const preventAction = (e) => e.preventDefault();
  const isUser = userProfile?.role === 'User';

  useEffect(() => {
    if (activeRoom?.id) {
      fetchSemesterAndSchedule();
    }

    return () => {
      // Cleanup Blob URL เพื่อคืนหน่วยความจำเมื่อออกจากหน้า
      if (scheduleBlobRef.current) URL.revokeObjectURL(scheduleBlobRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [activeRoom]);

  const fetchSemesterAndSchedule = async () => {
    setIsLoading(true);
    try {
      // ดึงข้อมูลเทอมปัจจุบันเพื่อเอาไปโชว์ใน Header
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(sem);

      // -----------------------------------------------------------------
      // 🚀 ดึงตารางเรียนจาก Storage Bucket โดยตรง (ไม่ใช้ Database)
      // -----------------------------------------------------------------
      const { data: files, error } = await supabase.storage
        .from('schedules')
        .list('', {
          limit: 10,
          search: activeRoom.id, // ค้นหาไฟล์ที่ชื่อขึ้นต้นด้วย room-1 หรือ room-2
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // หาไฟล์ล่าสุดของห้องนี้
      const latestFile = files?.find(f => f.name.startsWith(activeRoom.id));

      if (latestFile) {
        // ดึง Public URL ของไฟล์
        const { data: { publicUrl } } = supabase.storage
          .from('schedules')
          .getPublicUrl(latestFile.name);

        // แปลงเป็น Blob URL เพื่อซ่อนลิงก์ Supabase (Masking)
        try {
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          const localObjectUrl = URL.createObjectURL(blob);
          
          if (scheduleBlobRef.current) URL.revokeObjectURL(scheduleBlobRef.current);
          scheduleBlobRef.current = localObjectUrl;
          setScheduleUrl(localObjectUrl);
        } catch (blobError) {
          console.error('CORS/Blob Error, fallback to raw url:', blobError);
          setScheduleUrl(publicUrl); // ถ้าติดปัญหาข้าม Domain ให้ใช้ลิงก์ตรงแทน
        }
      } else {
        setScheduleUrl(null); // ไม่มีไฟล์ใน Bucket
      }

    } catch (error) {
      console.error('Error fetching schedule from bucket:', error);
      setScheduleUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (imageUrl) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const userName = userProfile?.first_name || 'Admin';
      const termDisplay = activeSemester ? `${activeSemester.term}/${activeSemester.year}` : '-';

      const payload = {
        embeds: [{
          title: "🗓️ อัปเดตตารางเรียนใหม่",
          color: 10181046, // สีม่วง
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "🎓 เทอม", value: termDisplay, inline: true },
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          image: { url: imageUrl },
          footer: { text: "SE Portal Admin System" },
          timestamp: new Date().toISOString()
        }]
      };

      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (error) {
      console.error('Discord Webhook Error:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const objUrl = URL.createObjectURL(file);
      setPreviewUrl(objUrl);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadSchedule = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      // 1. ลบไฟล์ตารางเรียนเก่าของห้องนี้ออกก่อน (เพื่อไม่ให้ Bucket รก)
      const { data: oldFiles } = await supabase.storage.from('schedules').list('', { search: activeRoom.id });
      if (oldFiles && oldFiles.length > 0) {
        const oldFileNames = oldFiles.map(f => f.name);
        await supabase.storage.from('schedules').remove(oldFileNames);
      }

      // 2. สร้างชื่อไฟล์ใหม่
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${activeRoom.id}-${Date.now()}.${fileExt}`;
      
      // 3. อัปโหลดไฟล์ไปที่ Bucket
      const { error: uploadError } = await supabase.storage.from('schedules').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      // 4. ดึง Public URL มายิงเข้า Discord
      const { data: { publicUrl } } = supabase.storage.from('schedules').getPublicUrl(fileName);

      // 5. แจ้งเตือน Discord และบันทึก Log
      await sendDiscordLog(publicUrl);
      if (userProfile) {
        await supabase.from('activity_logs').insert({ 
          action: 'อัปเดตตารางเรียน', 
          details: `อัปโหลดตารางเรียนใหม่สำหรับ ${activeRoom.name}`, 
          user_id: userProfile.id 
        });
      }

      clearSelection();
      fetchSemesterAndSchedule(); // รีเฟรชโหลดรูปใหม่มาโชว์
      alert('อัปโหลดตารางเรียนสำเร็จ!');

    } catch (error) {
      console.error('Upload Error:', error);
      alert(`เกิดข้อผิดพลาดในการอัปโหลด: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-500 shadow-sm shrink-0">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ตารางเรียน (Schedule)</h1>
          <p className="text-sm text-zinc-500">
            เทอมปัจจุบัน: <span className="font-bold">{activeSemester ? `${activeSemester.term}/${activeSemester.year}` : '-'}</span> | 
            ห้อง: <span className="font-bold text-[#0071e3]">{activeRoom?.name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Current Schedule */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none min-h-[400px]">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4">
            <ImageIcon className="w-5 h-5 text-[#0071e3]"/> ตารางเรียนที่แสดงผลปัจจุบัน
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-zinc-800 border-t-[#0071e3]"></div>
            </div>
          ) : scheduleUrl ? (
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm">
              <img src={scheduleUrl} alt="Current Schedule" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-zinc-400 bg-gray-50 dark:bg-black/20">
              <CalendarDays className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">ยังไม่มีการอัปโหลดตารางเรียนของห้องนี้</p>
            </div>
          )}
        </div>

        {/* Right Column: Upload Tool (Admin Only) */}
        {!isUser && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none sticky top-24">
            <h2 className="text-lg font-bold mb-6 text-zinc-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4">
              อัปโหลดตารางเรียนใหม่
            </h2>

            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full aspect-video border-2 border-dashed border-[#0071e3]/50 bg-blue-50/50 dark:bg-[#0071e3]/5 hover:bg-blue-50 dark:hover:bg-[#0071e3]/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group shadow-sm"
              >
                <UploadCloud className="w-10 h-10 text-[#0071e3] mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-[#0071e3]">คลิกเพื่อเลือกไฟล์รูปภาพ</span>
                <span className="text-xs text-zinc-500 mt-1">รองรับ JPG, PNG, WEBP</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm group">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-[250px]" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <button onClick={clearSelection} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg active:scale-95">
                      <X className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={uploadSchedule} 
                  disabled={isUploading}
                  className="w-full py-3.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUploading ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังอัปโหลด...</> : <><Save className="w-5 h-5"/> ยืนยันการอัปโหลด</>}
                </button>
              </div>
            )}
            
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/jpeg, image/png, image/webp" className="hidden" />
          </div>
        )}
      </div>

    </div>
  );
}