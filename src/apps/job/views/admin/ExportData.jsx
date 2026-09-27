// src/apps/job/views/admin/ExportData.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Database, DownloadCloud, FileSpreadsheet, Users, FileCheck, Loader2
} from 'lucide-react';
import 'animate.css';

export default function ExportData() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isExportingGrades, setIsExportingGrades] = useState(false);

  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    const fetchSemester = async () => {
      const { data } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(data);
    };
    fetchSemester();
  }, []);

  const sendDiscordLog = async (exportType) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const userName = userProfile?.first_name || 'Admin';
      const payload = {
        embeds: [{
          title: "📥 มีการส่งออกข้อมูลระบบ (Export Data)",
          color: 15158332, // สีส้มเตือน
          fields: [
            { name: "🏫 ห้องที่ส่งออก", value: activeRoom.name || '-', inline: true },
            { name: "📁 ประเภทข้อมูล", value: exportType, inline: true },
            { name: "👤 ผู้ทำรายการ", value: `${userName} (${userProfile?.role || 'Unknown'})`, inline: false }
          ],
          footer: { text: "⚠️ Log นี้บันทึกเพื่อวัตถุประสงค์ด้านความปลอดภัยของข้อมูล (PDPA)" },
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

  // สร้างไฟล์ CSV จาก Array of Objects และทำการดาวน์โหลด
  const downloadCSV = (data, filename) => {
    if (data.length === 0) return alert('ไม่พบข้อมูลที่จะส่งออก');

    // สร้าง Header
    const headers = Object.keys(data[0]).join(',');
    
    // สร้าง Rows ป้องกัน , ใน string
    const csvRows = data.map(row => {
      return Object.values(row).map(val => {
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });

    const csvContent = [headers, ...csvRows].join('\n');
    
    // เติม BOM เพื่อให้ Excel เปิดภาษาไทยได้ถูกต้อง
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersData = async () => {
    setIsExportingUsers(true);
    try {
      // ดึงรายชื่อนักศึกษาทั้งหมด (ดึงเฉพาะห้อง ถ้ามี field room_id ใน profile)
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, nickname, email, phone, points')
        .eq('role', 'User')
        .order('first_name', { ascending: true });

      if (error) throw error;
      
      const formattedData = data.map((u, index) => ({
        'No.': index + 1,
        'First Name': u.first_name,
        'Last Name': u.last_name,
        'Nickname': u.nickname || '-',
        'Email': u.email,
        'Phone': u.phone || '-',
        'Points': u.points || 0
      }));

      downloadCSV(formattedData, `SE_StudentsList_${activeRoom.id}`);
      
      await sendDiscordLog('รายชื่อและข้อมูลติดต่อนักศึกษา');
      await logActivity('ส่งออกข้อมูล', 'ดาวน์โหลดรายชื่อนักศึกษา (CSV)');

    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsExportingUsers(false);
    }
  };

  const exportAssignmentsData = async () => {
    setIsExportingGrades(true);
    try {
      if (!activeSemester) return alert('ไม่พบข้อมูลภาคการศึกษาปัจจุบัน');

      // 1. ดึงงานทั้งหมดของห้องและเทอมนี้
      const { data: assignments, error: aError } = await supabase
        .from('assignments')
        .select('id, title, subjects(code)')
        .eq('room_id', activeRoom.id)
        .eq('semester_id', activeSemester.id);
        
      if (aError) throw aError;
      if (!assignments || assignments.length === 0) return alert('ไม่พบงานที่สั่งในระบบ');

      // 2. ดึงนักศึกษาทั้งหมด
      const { data: users, error: uError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'User')
        .order('first_name', { ascending: true });

      if (uError) throw uError;

      // 3. ดึงสถานะการส่งงานทั้งหมด
      const assignmentIds = assignments.map(a => a.id);
      const { data: submissions, error: sError } = await supabase
        .from('submissions')
        .select('user_id, assignment_id, status')
        .in('assignment_id', assignmentIds);

      if (sError) throw sError;

      // 4. ประกอบร่างตาราง Matrix (นักศึกษา x ชื่องาน)
      const exportData = users.map((user, index) => {
        let row = {
          'No.': index + 1,
          'Student Name': `${user.first_name} ${user.last_name}`
        };

        assignments.forEach(task => {
          const sub = submissions.find(s => s.user_id === user.id && s.assignment_id === task.id);
          const columnName = `[${task.subjects?.code || 'N/A'}] ${task.title}`;
          row[columnName] = sub ? sub.status : 'รอส่ง';
        });

        return row;
      });

      downloadCSV(exportData, `SE_TaskTracking_${activeRoom.id}`);

      await sendDiscordLog('สถานะการส่งงานนักศึกษา (Matrix)');
      await logActivity('ส่งออกข้อมูล', 'ดาวน์โหลดข้อมูลสถานะการส่งงาน (CSV)');

    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setIsExportingGrades(false);
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-500 shadow-sm shrink-0">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ส่งออกข้อมูล (Export Data)</h1>
          <p className="text-sm text-zinc-500">
            ดาวน์โหลดข้อมูลสรุปในรูปแบบ <span className="font-bold text-teal-600 dark:text-teal-400">.CSV</span> นำไปใช้งานต่อใน Excel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export 1: Users List */}
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div>
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">รายชื่อและข้อมูลนักศึกษา</h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-6">
              ส่งออกข้อมูล ชื่อ-นามสกุล, เบอร์โทรศัพท์, อีเมล และคะแนนสะสม (Points) ของนักศึกษาในระบบทั้งหมด
            </p>
          </div>
          
          <button 
            onClick={exportUsersData}
            disabled={isExportingUsers}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExportingUsers ? <><Loader2 className="w-5 h-5 animate-spin"/> Processing...</> : <><DownloadCloud className="w-5 h-5"/> Download CSV</>}
          </button>
        </div>

        {/* Export 2: Submissions Tracking Matrix */}
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between group hover:-translate-y-1 transition-transform">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-sm">
                <FileCheck className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs font-bold rounded-full border border-gray-200 dark:border-zinc-700">
                {activeSemester ? `เทอม ${activeSemester.term}/${activeSemester.year}` : '-'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">สถานะการส่งงาน (Matrix)</h2>
            <p className="text-sm text-zinc-500 leading-relaxed mb-6">
              ส่งออกตารางสรุปการส่งงานของ <span className="font-bold text-[#0071e3]">{activeRoom.name}</span> แถวแนวนอนคือนักศึกษา แนวตั้งคืองานที่สั่ง (รอส่ง / ส่งแล้ว / ตรวจแล้ว)
            </p>
          </div>
          
          <button 
            onClick={exportAssignmentsData}
            disabled={isExportingGrades}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExportingGrades ? <><Loader2 className="w-5 h-5 animate-spin"/> Processing...</> : <><FileSpreadsheet className="w-5 h-5"/> Download Matrix CSV</>}
          </button>
        </div>

      </div>

      <div className="mt-8 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
        <Database className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
          <p className="font-bold mb-1">เกี่ยวกับไฟล์ CSV ที่ดาวน์โหลด</p>
          <p>หากเปิดไฟล์ใน Microsoft Excel แล้วภาษาไทยกลายเป็นภาษาต่างดาว (Encoding ผิดเพี้ยน) ให้ใช้วิธีเปิดโปรแกรม Excel เปล่าๆ แล้วไปที่แท็บ <span className="font-bold">Data (ข้อมูล) &gt; From Text/CSV (จากข้อความ/CSV)</span> จากนั้นให้เลือก File Origin เป็น <span className="font-bold">65001: Unicode (UTF-8)</span> แทนการดับเบิลคลิกไฟล์โดยตรง</p>
        </div>
      </div>

    </div>
  );
}