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
  
  const [schedule, setSchedule] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const preventAction = (e) => e.preventDefault();
  const isUser = userProfile?.role === 'User';

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
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .eq('room_id', activeRoom.id)
          .eq('semester_id', sem.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendDiscordLog = async (imageUrl) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const userName = userProfile?.first_name || 'Admin';
      const payload = {
        embeds: [{
          title: "🗓️ อัปเดตตารางเรียนใหม่",
          color: 3447003,
          fields: [
            { name: "🏫 ห้อง", value: activeRoom.name || '-', inline: true },
            { name: "🎓 เทอม", value: activeSemester ? `${activeSemester.term}/${activeSemester.year}` : '-', inline: true },
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          image: { url: imageUrl },
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
      // 1. Upload file
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `schedule-${activeRoom.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('schedules').upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('schedules').getPublicUrl(fileName);

      // 2. Set old schedules to inactive
      if (schedule) {
        await supabase.from('schedules').update({ is_active: false }).eq('id', schedule.id);
      }

      // 3. Insert new schedule
      const { error: insertError } = await supabase.from('schedules').insert({
        room_id: activeRoom.id,
        semester_id: activeSemester.id,
        image_url: publicUrl,
        is_active: true
      });

      if (insertError) throw insertError;

      // 4. Log & Discord
      await sendDiscordLog(publicUrl);
      if (userProfile) {
        await supabase.from('activity_logs').insert({ 
          action: 'อัปเดตตารางเรียน', 
          details: `อัปเดตตารางเรียนของห้อง ${activeRoom.name}`, 
          user_id: userProfile.id 
        });
      }

      clearSelection();
      fetchData();
      alert('อัปเดตตารางเรียนสำเร็จ');
    } catch (error) {
      console.error('Upload Error:', error);
      alert('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex items-center gap-4 shadow-sm transition-colors">
        <div className="w-12 h-12 bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-500 shadow-sm shrink-0">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ตารางเรียน (Schedule)</h1>
          <p className="text-sm text-zinc-500">
            เทอมปัจจุบัน: <span className="font-bold">{activeSemester ? `${activeSemester.term}/${activeSemester.year}` : '-'}</span> | 
            ห้อง: <span className="font-bold text-[#0071e3]">{activeRoom.name}</span>
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
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#0071e3]"></div>
            </div>
          ) : schedule ? (
            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
              <img src={schedule.image_url} alt="Current Schedule" className="w-full h-auto object-contain" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl text-zinc-400 bg-gray-50 dark:bg-black/20">
              <CalendarDays className="w-12 h-12 mb-3 opacity-50" />
              <p>ยังไม่มีการอัปโหลดตารางเรียนในเทอมนี้</p>
            </div>
          )}
        </div>

        {/* Right Column: Upload Tool (Admin Only) */}
        {!isUser && (
          <div className="lg:col-span-5 xl:col-span-4 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none sticky top-24">
            <h2 className="text-lg font-bold mb-4 text-zinc-900 dark:text-white border-b border-gray-100 dark:border-zinc-800 pb-4">
              อัปโหลดตารางเรียนใหม่
            </h2>

            {!previewUrl ? (
              <div 
                onClick={() => fileInputRef.current.click()}
                className="w-full aspect-video border-2 border-dashed border-[#0071e3]/50 bg-blue-50/50 dark:bg-[#0071e3]/5 hover:bg-blue-50 dark:hover:bg-[#0071e3]/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                <UploadCloud className="w-10 h-10 text-[#0071e3] mb-3 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-[#0071e3]">คลิกเพื่อเลือกไฟล์รูปภาพ</span>
                <span className="text-xs text-zinc-500 mt-1">รองรับ JPG, PNG, WEBP</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 group">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-[250px]" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={clearSelection} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg">
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
            
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          </div>
        )}
      </div>

    </div>
  );
}