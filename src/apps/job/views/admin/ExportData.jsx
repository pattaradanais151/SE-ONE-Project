// src/apps/job/views/admin/ExportData.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  Database, DownloadCloud, FileSpreadsheet, Users, FileCheck, Loader2,
  FileText, FileArchive, TableProperties, AlertCircle, CheckCircle2, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import 'animate.css';

export default function ExportData() {
  const { userProfile, activeRoom } = useOutletContext();
  const [activeSemester, setActiveSemester] = useState(null);
  
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isExportingGrades, setIsExportingGrades] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const preventAction = (e) => e.preventDefault();

  // เช็คสิทธิ์ (ให้เฉพาะ Admin และ Super Admin เท่านั้น)
  const isAuthorized = userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin';
  
  // Function for displaying toast
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 4000);
  };

  useEffect(() => {
    const fetchSemester = async () => {
      const { data } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      setActiveSemester(data);
    };
    fetchSemester();
  }, []);

  const sendDiscordLog = async (exportType, format) => {
    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const userName = userProfile?.first_name || 'Admin';
      const payload = {
        embeds: [{
          title: "📥 มีการส่งออกข้อมูลระบบ (Export Data)",
          color: 15158332,
          fields: [
            { name: "🏫 ห้องที่ส่งออก", value: activeRoom?.name || '-', inline: true },
            { name: "📁 ประเภทข้อมูล", value: `${exportType} (Format: ${format})`, inline: true },
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

  // ==========================================
  // ฟังก์ชันช่วยในการสร้างไฟล์รูปแบบต่างๆ
  // ==========================================

  // 1. Export CSV
  const exportAsCSV = (data, filename) => {
    if (!data || data.length === 0) throw new Error('ไม่มีข้อมูลสำหรับสร้างไฟล์ CSV');
    
    const headers = Object.keys(data[0]).join(',');
    const csvRows = data.map(row => {
      return Object.values(row).map(val => {
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });
    
    const csvContent = [headers, ...csvRows].join('\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };

  // 2. Export Excel (XLSX)
  const exportAsExcel = (data, filename) => {
    if (!data || data.length === 0) throw new Error('ไม่มีข้อมูลสำหรับสร้างไฟล์ Excel');
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // 3. Export PDF
  const exportAsPDF = (data, filename, title) => {
    if (!data || data.length === 0) throw new Error('ไม่มีข้อมูลสำหรับสร้างไฟล์ PDF');

    const doc = new jsPDF('landscape');
    const tableColumn = Object.keys(data[0]);
    const tableRows = data.map(row => Object.values(row));

    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8, font: 'helvetica' }, // ฟอนต์พื้นฐาน (ยังไม่รองรับภาษาไทยในตาราง PDF แบบ 100% ถ้าไม่มีการอิมพอร์ตฟอนต์เพิ่ม)
      theme: 'grid'
    });

    doc.save(`${filename}.pdf`);
  };

  // ==========================================
  // ฟังก์ชันดึงข้อมูลจาก Database
  // ==========================================

  const getStudentsData = async () => {
    // ⚠️ แก้ไขจุดนี้: เอา 'email' ออกจาก select เพราะ Supabase ไม่ได้เก็บอีเมลไว้ในตาราง profiles อัตโนมัติ (จะทำให้เกิด Error: 42703)
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, nickname, phone, points')
      .eq('role', 'User')
      .eq('room_access', activeRoom.id)
      .order('first_name', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('ไม่พบข้อมูลนักศึกษาในห้องนี้');
    
    return data.map((u, index) => ({
      'No.': index + 1,
      'First Name': u.first_name,
      'Last Name': u.last_name,
      'Nickname': u.nickname || '-',
      'Phone': u.phone || '-',
      'Points': u.points || 0
    }));
  };

  const getMatrixData = async () => {
    if (!activeSemester) throw new Error('ไม่พบข้อมูลภาคการศึกษาปัจจุบัน กรุณาตรวจสอบเมนูปีการศึกษา');

    const { data: assignments, error: aError } = await supabase
      .from('assignments')
      .select('id, title, subjects(code)')
      .eq('room_id', activeRoom.id)
      .eq('semester_id', activeSemester.id);
      
    if (aError) throw aError;
    if (!assignments || assignments.length === 0) throw new Error('ไม่พบรายการงานที่สั่งในห้องนี้');

    const { data: users, error: uError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('role', 'User')
      .eq('room_access', activeRoom.id)
      .order('first_name', { ascending: true });

    if (uError) throw uError;
    if (!users || users.length === 0) throw new Error('ไม่พบรายชื่อนักศึกษาในห้องนี้');

    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions, error: sError } = await supabase
      .from('submissions')
      .select('user_id, assignment_id, status')
      .in('assignment_id', assignmentIds);

    if (sError) throw sError;

    return users.map((user, index) => {
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
  };

  // ==========================================
  // Handler ควบคุมปุ่มกด (UI)
  // ==========================================

  const handleExportUsers = async (format) => {
    if (!isAuthorized) return showToast('ไม่มีสิทธิ์เข้าถึง', 'error');
    setIsExportingUsers(true);
    try {
      const data = await getStudentsData();
      const filename = `SE_StudentsList_${activeRoom.id}_${Date.now()}`;

      if (format === 'csv') exportAsCSV(data, filename);
      if (format === 'excel') exportAsExcel(data, filename);
      if (format === 'pdf') exportAsPDF(data, filename, `Student List - ${activeRoom.name}`);

      await sendDiscordLog('รายชื่อและข้อมูลติดต่อนักศึกษา', format.toUpperCase());
      await logActivity('ส่งออกข้อมูล', `ดาวน์โหลดรายชื่อนักศึกษา (${format.toUpperCase()})`);
      
      showToast(`ส่งออกข้อมูลสำเร็จ (${format.toUpperCase()})`, 'success');
    } catch (error) {
      console.error(error);
      showToast(`${error.message}`, 'error');
    } finally {
      setIsExportingUsers(false);
    }
  };

  const handleExportMatrix = async (format) => {
    if (!isAuthorized) return showToast('ไม่มีสิทธิ์เข้าถึง', 'error');
    setIsExportingGrades(true);
    try {
      const data = await getMatrixData();
      const filename = `SE_TaskTracking_${activeRoom.id}_${Date.now()}`;

      if (format === 'csv') exportAsCSV(data, filename);
      if (format === 'excel') exportAsExcel(data, filename);
      if (format === 'pdf') exportAsPDF(data, filename, `Submission Tracking - ${activeRoom.name}`);

      await sendDiscordLog('สถานะการส่งงานนักศึกษา (Matrix)', format.toUpperCase());
      await logActivity('ส่งออกข้อมูล', `ดาวน์โหลดสถานะการส่งงาน (${format.toUpperCase()})`);
      
      showToast(`ส่งออกข้อมูลสำเร็จ (${format.toUpperCase()})`, 'success');
    } catch (error) {
      console.error(error);
      showToast(`${error.message}`, 'error');
    } finally {
      setIsExportingGrades(false);
    }
  };

  // Export EVERYTHING to ZIP
  const handleExportAllToZip = async () => {
    if (!isAuthorized) return showToast('ไม่มีสิทธิ์เข้าถึง', 'error');
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      let hasData = false;
      
      // ดึงข้อมูลแบบ Catch Error ภายในตัว เพื่อไม่ให้ตายถ้าตารางนึงว่าง
      let studentsData = [];
      try { studentsData = await getStudentsData(); } catch(e) {}
      
      let matrixData = [];
      try { matrixData = await getMatrixData(); } catch(e) {}

      if (studentsData.length > 0) {
        hasData = true;
        const wsUsers = XLSX.utils.json_to_sheet(studentsData);
        const wbUsers = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbUsers, wsUsers, "Students");
        const excelUsersBuffer = XLSX.write(wbUsers, { bookType: 'xlsx', type: 'array' });
        zip.file(`SE_StudentsList_${activeRoom.id}.xlsx`, excelUsersBuffer);
      }

      if (matrixData.length > 0) {
        hasData = true;
        const wsMatrix = XLSX.utils.json_to_sheet(matrixData);
        const wbMatrix = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wbMatrix, wsMatrix, "Tracking");
        const excelMatrixBuffer = XLSX.write(wbMatrix, { bookType: 'xlsx', type: 'array' });
        zip.file(`SE_TaskTracking_${activeRoom.id}.xlsx`, excelMatrixBuffer);
      }

      if (!hasData) {
        throw new Error('ไม่พบข้อมูลใดๆ สำหรับส่งออกในห้องที่เลือกเลย');
      }

      // สร้างไฟล์ ZIP แล้วดาวน์โหลด
      const zipContent = await zip.generateAsync({ type: 'blob' });
      saveAs(zipContent, `SE_Workspace_Backup_${activeRoom.id}_${Date.now()}.zip`);

      await sendDiscordLog('สำรองข้อมูลทั้งหมดในห้อง', 'ZIP (Excel)');
      await logActivity('ส่งออกข้อมูล', `ดาวน์โหลดข้อมูลสำรองทั้งหมด (ZIP)`);
      
      showToast(`สร้างไฟล์ ZIP สำเร็จ!`, 'success');

    } catch (error) {
      console.error(error);
      showToast(`${error.message}`, 'error');
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10 relative">
      
      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-md px-4 pointer-events-none flex flex-col items-center">
        {toast.show && (
          <div className={`animate__animated animate__fadeInDown animate__faster w-full flex items-start gap-3 p-4 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-md
            ${toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' : 
              'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'}`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'error' })} className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-500 shadow-sm shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">ส่งออกข้อมูล (Export Data)</h1>
            <p className="text-sm text-zinc-500">
              ดาวน์โหลดข้อมูลของ <span className="font-bold text-teal-600 dark:text-teal-400">{activeRoom?.name}</span>
            </p>
          </div>
        </div>

        {/* ปุ่ม Zip Backup (เฉพาะ Admin) */}
        {isAuthorized && (
          <button 
            onClick={handleExportAllToZip}
            disabled={isExportingZip}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {isExportingZip ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileArchive className="w-4 h-4"/>}
            <span>Backup All (ZIP)</span>
          </button>
        )}
      </div>

      {!isAuthorized ? (
        <div className="py-20 text-center bg-white/50 dark:bg-[#121214]/50 border border-dashed border-gray-300 dark:border-zinc-800 rounded-[2rem]">
          <Database className="w-16 h-16 mx-auto mb-4 text-zinc-400 opacity-50" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-zinc-500">เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดาวน์โหลดและส่งออกข้อมูลได้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Export 1: Users List */}
          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div>
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">รายชื่อและข้อมูลนักศึกษา</h2>
              <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                ส่งออกข้อมูล ชื่อ-นามสกุล, เบอร์โทรศัพท์ และคะแนนสะสม (Points) ของนักศึกษาในห้อง {activeRoom.name}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button onClick={() => handleExportUsers('excel')} disabled={isExportingUsers} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingUsers ? <Loader2 className="w-4 h-4 animate-spin"/> : <TableProperties className="w-4 h-4"/>} Excel
              </button>
              <button onClick={() => handleExportUsers('pdf')} disabled={isExportingUsers} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingUsers ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>} PDF
              </button>
              <button onClick={() => handleExportUsers('csv')} disabled={isExportingUsers} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingUsers ? <Loader2 className="w-4 h-4 animate-spin"/> : <DownloadCloud className="w-4 h-4"/>} CSV
              </button>
            </div>
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
            
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button onClick={() => handleExportMatrix('excel')} disabled={isExportingGrades} className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingGrades ? <Loader2 className="w-4 h-4 animate-spin"/> : <TableProperties className="w-4 h-4"/>} Excel
              </button>
              <button onClick={() => handleExportMatrix('pdf')} disabled={isExportingGrades} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingGrades ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4"/>} PDF
              </button>
              <button onClick={() => handleExportMatrix('csv')} disabled={isExportingGrades} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 text-sm">
                {isExportingGrades ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>} CSV
              </button>
            </div>
          </div>

        </div>
      )}

      {/* คำแนะนำด้านล่าง */}
      {isAuthorized && (
        <div className="mt-8 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <Database className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
            <p className="font-bold mb-1">หมายเหตุเกี่ยวกับการส่งออกข้อมูล</p>
            <p>1. <span className="font-bold">Excel (.xlsx):</span> แนะนำให้ใช้ตัวเลือกนี้ เพราะรองรับภาษาไทยได้สมบูรณ์และเปิดใน Microsoft Excel ได้ทันทีโดยไม่เพี้ยน</p>
            <p>2. <span className="font-bold">PDF:</span> เหมาะสำหรับการพิมพ์หรือส่งต่อเพื่อดูข้อมูล</p>
            <p>3. <span className="font-bold">Backup All (ZIP):</span> ระบบจะรวบรวมข้อมูลทุกตารางในห้องที่เลือก ดึงออกมาเป็นไฟล์ Excel แล้วจับมัดรวมกันในไฟล์ ZIP เดียวให้โดยอัตโนมัติ</p>
          </div>
        </div>
      )}

    </div>
  );
}