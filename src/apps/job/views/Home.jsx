// src/apps/job/views/Home.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { 
  RefreshCw, ExternalLink, Sun, Moon, Clock, FileText, 
  CalendarDays, Bell, AlertCircle, Loader2, Link2, Search, 
  Terminal, ShieldCheck, Maximize, X 
} from 'lucide-react';
import 'animate.css';

const ROOMS = [
  { id: 'room-1', label: 'เทียบโอน', code: 'room-1' },
  { id: 'room-2', label: 'ปกติ', code: 'room-2' },
];

export default function JobHome() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);

  const [activeRoom, setActiveRoom] = useState('room-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [thailandTime, setThailandTime] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const [pingLatency, setPingLatency] = useState('...');
  const [currentLang, setCurrentLang] = useState('th');

  // Data States
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [resources, setResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  
  // Schedule States (ดึงจาก Bucket โดยตรง)
  const [scheduleUrl, setScheduleUrl] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const scheduleBlobRef = useRef(null);

  const realtimeChannelRef = useRef(null);
  const semesterPromiseRef = useRef(null);

  // Anti-Copy Logic
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const translations = {
    th: {
      marquee: "📢 ข่าวสาร SE Portal • อัปเดตประกาศ งานที่ต้องส่ง และตารางเรียนแบบเรียลไทม์",
      searchPlaceholder: "ค้นหางาน, แหล่งส่งงาน หรือ ประกาศ...",
      login: "เข้าสู่ระบบ",
      liveConnected: "เชื่อมต่อเรียลไทม์",
      syncing: "กำลังซิงค์ข้อมูล...",
      refreshData: "รีเฟรชข้อมูล",
      classSchedule: "ตารางเรียน",
      noSchedule: "ยังไม่มีตารางเรียน (Storage)",
      announcements: "ประกาศ",
      noAnnouncements: "ไม่มีประกาศในขณะนี้",
      assignments: "งานที่ต้องส่ง",
      searchResults: "ผลการค้นหา",
      tasks: "รายการ",
      items: "รายการ",
      noAssignments: "ไม่มีงานที่ต้องส่ง",
      resources: "แหล่งส่งงาน",
      noResources: "ไม่มีแหล่งส่งงาน",
      due: "กำหนดส่ง",
      overdue: "เลยกำหนด",
      pending: "รอดำเนินการ",
      global: "ทั่วไป",
      code: "รหัส",
      terminalStatus: "สถานะระบบ",
      terminalSync: "ซิงค์ข้อมูลห้อง",
      terminalConnect: "กำลังเชื่อมต่อระบบเรียลไทม์...",
      terminalEstablished: "เชื่อมต่อสำเร็จ (Realtime Active)",
      terminalError: "การเชื่อมต่อขัดข้อง กำลังลองใหม่...",
      terminalFound: "พบ: งาน {tasks} รายการ, ประกาศ {announcements} รายการ",
      timePrefix: "เวลาไทย",
      legalBtn: "นโยบาย & PDPA",
    },
    en: {
      marquee: "📢 SE Portal Update • Stay connected with real-time announcements, assignments, and schedules",
      searchPlaceholder: "Search assignments, resources, or announcements...",
      login: "Log in",
      liveConnected: "Live Connected",
      syncing: "Syncing Realtime...",
      refreshData: "Refresh Data",
      classSchedule: "Class Schedule",
      noSchedule: "No Schedule Uploaded",
      announcements: "Announcements",
      noAnnouncements: "No announcements found.",
      assignments: "Assignments",
      searchResults: "Search results",
      tasks: "Tasks",
      items: "Items",
      noAssignments: "No assignments found.",
      resources: "Submission Resources",
      noResources: "No resources found.",
      due: "DUE",
      overdue: "OVERDUE",
      pending: "PENDING",
      global: "GLOBAL",
      code: "CODE",
      terminalStatus: "System Status",
      terminalSync: "Syncing room",
      terminalConnect: "Connecting to Supabase Realtime...",
      terminalEstablished: "Connection established (Realtime Active).",
      terminalError: "Connection error. Retrying...",
      terminalFound: "Found: {tasks} tasks, {announcements} announcements.",
      timePrefix: "TH Time",
      legalBtn: "Legal & PDPA",
    }
  };

  const t = (key, params = {}) => {
    let str = translations[currentLang]?.[key] || translations['en'][key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  };

  const isSyncing = useMemo(() => 
    isLoadingAnnouncements || isLoadingSchedule || isLoadingAssignments || isLoadingResources || realtimeStatus === 'connecting',
  [isLoadingAnnouncements, isLoadingSchedule, isLoadingAssignments, isLoadingResources, realtimeStatus]);

  // Filters
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(a => a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q));
  }, [searchQuery, announcements]);

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(a => a.title?.toLowerCase().includes(q) || a.subjects?.code?.toLowerCase().includes(q) || a.subjects?.name?.toLowerCase().includes(q));
  }, [searchQuery, assignments]);

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(r => r.title?.toLowerCase().includes(q));
  }, [searchQuery, resources]);

  // Fetchers
  const getActiveSemesterId = async () => {
    if (!semesterPromiseRef.current) {
      semesterPromiseRef.current = supabase.from('semesters').select('id').eq('is_active', true).maybeSingle()
        .then(({ data }) => data?.id ?? null)
        .catch(() => null);
    }
    return semesterPromiseRef.current;
  };

  const loadAnnouncements = useCallback(async (roomId) => {
    setIsLoadingAnnouncements(true);
    const { data } = await supabase.from('announcements').select('*').eq('is_visible', true).or(`room_id.eq.${roomId},is_global.eq.true`).order('created_at', { ascending: false }).limit(30);
    setAnnouncements(data || []);
    setIsLoadingAnnouncements(false);
  }, []);

  const loadResources = useCallback(async (roomId) => {
    setIsLoadingResources(true);
    const { data } = await supabase.from('submission_links').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    setResources(data || []);
    setIsLoadingResources(false);
  }, []);

  const loadAssignments = useCallback(async (roomId) => {
    setIsLoadingAssignments(true);
    const semesterId = await getActiveSemesterId();
    if (semesterId) {
      const { data } = await supabase.from('assignments').select('*, subjects(code, name)').eq('room_id', roomId).eq('semester_id', semesterId).order('due_date', { ascending: false });
      setAssignments(data || []);
    } else {
      setAssignments([]);
    }
    setIsLoadingAssignments(false);
  }, []);

  // 🚀 โหลดตารางเรียนจาก Storage Bucket โดยตรง! ป้องกันปัญหาตาราง Schedule ไม่มีอยู่จริง
  const loadSchedule = useCallback(async (roomId) => {
    setIsLoadingSchedule(true);
    try {
      // 1. ค้นหาไฟล์ใน Bucket 'schedules' ที่ชื่อขึ้นต้นด้วย roomId (เช่น 'room-1')
      const { data: files, error } = await supabase.storage
        .from('schedules')
        .list('', {
          limit: 10,
          search: roomId,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // 2. ดึงไฟล์ล่าสุดของห้องนั้นมา
      const file = files?.find(f => f.name.startsWith(roomId));

      if (file) {
        // 3. ดึง Public URL ของไฟล์
        const { data: { publicUrl } } = supabase.storage
          .from('schedules')
          .getPublicUrl(file.name);

        // 4. แปลงเป็น Blob URL เพื่อซ่อนลิงก์ Supabase (Masking)
        try {
          const response = await fetch(publicUrl);
          const blob = await response.blob();
          const localObjectUrl = URL.createObjectURL(blob);
          
          if (scheduleBlobRef.current) URL.revokeObjectURL(scheduleBlobRef.current);
          scheduleBlobRef.current = localObjectUrl;
          setScheduleUrl(localObjectUrl);
        } catch (blobError) {
          console.error('Failed to mask image URL:', blobError);
          setScheduleUrl(publicUrl); // Fallback ถ้าติดปัญหา CORS
        }
      } else {
        setScheduleUrl(null);
      }
    } catch (error) {
      console.error('Error fetching schedule from bucket:', error);
      setScheduleUrl(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  const fetchRoomData = useCallback((roomId) => {
    localStorage.setItem('activeRoom', JSON.stringify({ id: roomId }));
    loadAnnouncements(roomId);
    loadResources(roomId);
    loadAssignments(roomId);
    loadSchedule(roomId);
  }, [loadAnnouncements, loadResources, loadAssignments, loadSchedule]);

  const handleRoomChange = (roomId) => {
    if (roomId === activeRoom) return;
    setActiveRoom(roomId);
    fetchRoomData(roomId);
  };

  const setupRealtime = useCallback(() => {
    setRealtimeStatus('connecting');
    const startTime = performance.now();
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    
    realtimeChannelRef.current = supabase.channel('public:se_portal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => loadAnnouncements(activeRoom))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => loadAssignments(activeRoom))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submission_links' }, () => loadResources(activeRoom))
      // ถ้ามีการอัปโหลดไฟล์ใน bucket storage ไม่สามารถดัก realtime ผ่าน channel ปกติได้ แต่ใช้วิธีกด refresh ข้อมูลได้
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          setPingLatency(`${Math.round(performance.now() - startTime)}ms`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('error');
          setPingLatency('ERR');
        }
      });
  }, [activeRoom, loadAnnouncements, loadAssignments, loadResources]);

  useEffect(() => {
    let savedRoomId = 'room-1';
    try {
      const saved = localStorage.getItem('activeRoom');
      if (saved) savedRoomId = JSON.parse(saved).id || 'room-1';
    } catch {}
    
    setActiveRoom(savedRoomId);
    fetchRoomData(savedRoomId);

    const updateTime = () => {
      setThailandTime(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timeInterval);
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
      if (scheduleBlobRef.current) URL.revokeObjectURL(scheduleBlobRef.current);
    };
  }, [fetchRoomData]);

  useEffect(() => {
    setupRealtime();
  }, [activeRoom, setupRealtime]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear() + 543}`;
  };
  
  const isExpired = (dateStr) => new Date(dateStr) < new Date();

  return (
    <div 
      onCopy={preventAction}
      onCut={preventAction}
      onDragStart={preventAction}
      className="min-h-screen w-full bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-[#0071e3] selection:text-white transition-colors duration-500 overflow-y-auto overflow-x-hidden select-none scroll-smooth"
    >
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
      `}</style>

      {/* 1. Top Marquee */}
      <div className="w-full bg-[#f5f5f7] dark:bg-[#1d1d1f] text-[12px] py-2 flex overflow-hidden whitespace-nowrap border-b border-gray-200 dark:border-white/10 font-medium shrink-0">
        <div className="animate-marquee flex gap-8 px-4">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="opacity-70 flex items-center gap-2">
              {t('marquee')} <span className="mx-4">|</span>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Main Navbar */}
      <nav className="sticky top-0 z-50 w-full px-4 md:px-6 lg:px-8 h-[72px] flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="cursor-pointer shrink-0 flex items-center justify-center" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-sm transition-transform hover:scale-105">
              <img src="/logo.png" alt="SE Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <div className="hidden md:flex flex-col shrink-0 border-l border-gray-300 dark:border-gray-700 pl-4 md:pl-6 mr-2">
            <span className="text-[14px] font-bold leading-tight tracking-tight">Software Engineering</span>
            <span className="text-[11px] opacity-60 leading-tight mt-0.5">RMUTL Gen 4 · Chiang Mai</span>
          </div>
          
          <div className="hidden lg:flex flex-1 min-w-[300px] xl:min-w-[500px] max-w-3xl">
            <div className="relative w-full bg-gray-100 dark:bg-white/10 rounded-full flex items-center px-4 py-2 border border-transparent focus-within:ring-2 focus-within:ring-[#0071e3] transition-all">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="bg-transparent w-full text-[14px] font-medium outline-none select-auto" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-white/10 p-1 rounded-full">
            {['th', 'en'].map(l => (
              <button key={l} onClick={() => setCurrentLang(l)} className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors uppercase ${currentLang === l ? 'bg-white dark:bg-[#333] shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={() => setIsDark(!isDark)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-3 sm:gap-4 text-[14px] font-semibold">
            <button onClick={() => navigate('/sework/login')} className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-95 transition-transform">
              {t('login')}
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Filter Bar */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md gap-4 md:gap-0 shrink-0">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full md:w-auto">
          {ROOMS.map(room => (
            <button key={room.id} onClick={() => handleRoomChange(room.id)} className={`shrink-0 border rounded-full px-5 py-1.5 text-[13px] font-semibold flex items-center gap-2 transition-all duration-300 ${activeRoom === room.id ? 'border-[#0071e3] bg-[#0071e3] text-white shadow-md shadow-blue-500/20' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-white/10'}`}>
              {room.label} <span className="font-normal opacity-60 text-[11px]">({room.code})</span>
            </button>
          ))}
          <button onClick={() => navigate('/pdpa')} className="shrink-0 border border-transparent rounded-full px-4 py-1.5 text-[13px] font-semibold flex items-center gap-2 text-gray-500 hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <ShieldCheck className="w-4 h-4" /> {t('legalBtn')}
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 text-[12px] font-mono bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-[0.5rem]">
            <Clock className="w-3.5 h-3.5 opacity-60" />
            <span className="opacity-70">{t('timePrefix')}:</span> <strong>{thailandTime}</strong>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[12px] font-medium opacity-80">
            <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : (realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500')}`}></span>
            {realtimeStatus === 'connecting' ? t('syncing') : (realtimeStatus === 'error' ? 'Connection Error' : t('liveConnected'))}
          </div>
          <button onClick={() => { setSearchQuery(''); fetchRoomData(activeRoom); setupRealtime(); }} className="border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1.5 text-[13px] font-semibold hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors">
            {t('refreshData')} <RefreshCw className={`w-3 h-3 opacity-60 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Main Content Area (Full Size) */}
      <main className="w-full px-4 md:px-6 lg:px-8 xl:px-10 pt-8 pb-12 flex-1 mx-auto max-w-full">
        
        {/* Mobile Search */}
        <div className="lg:hidden w-full mb-6 relative bg-white dark:bg-[#1d1d1f] rounded-full flex items-center px-4 py-2 border border-gray-200 dark:border-white/10 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('searchPlaceholder')} className="bg-transparent w-full text-[14px] font-medium outline-none select-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6 w-full">
            {/* Terminal Status */}
            <div className="bg-white dark:bg-[#1d1d1f] font-mono text-[13px] p-6 rounded-[1.5rem] shadow-md border border-gray-200 dark:border-white/10 hover:scale-[1.01] transition-transform">
              <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
                <Terminal className="w-4 h-4 text-gray-500" />
                <span className="font-semibold">{t('terminalStatus')} (status.sh)</span>
              </div>
              <div className="space-y-2 opacity-90">
                <p>&gt; {t('terminalSync')} = {activeRoom}</p>
                <p className="flex items-center gap-2">&gt; ping .. {realtimeStatus === 'connecting' && <Loader2 className="w-3 h-3 animate-spin" />}{realtimeStatus === 'connected' && <span className="text-emerald-500">{pingLatency}</span>}</p>
                {realtimeStatus === 'connected' && <p className="text-[#0071e3]">&gt; {t('terminalEstablished')}</p>}
                <p className="text-orange-500 pt-2">&gt; {t('terminalFound', { tasks: filteredAssignments.length, announcements: filteredAnnouncements.length })}</p>
              </div>
            </div>

            {/* Resources Section */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[1.5rem] p-6 border border-gray-200 dark:border-white/10 shadow-md">
              <h3 className="text-[14px] font-bold tracking-tight flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Link2 className="w-4 h-4" /> {t('resources')}</div>
                <span className="bg-gray-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full text-xs">{filteredResources.length}</span>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {filteredResources.length === 0 ? (
                  <p className="text-sm opacity-50 text-center py-4">{t('noResources')}</p>
                ) : (
                  filteredResources.map(res => (
                    <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#000] border border-gray-200 dark:border-white/5 rounded-xl hover:scale-[1.02] hover:border-[#0071e3]/30 transition-all group">
                      <span className="font-medium text-[13px] truncate">{res.title}</span>
                      <ExternalLink className="w-4 h-4 text-[#0071e3] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Schedule Image (ดึงจาก Bucket ตรงๆ + ซ่อนลิงก์ด้วย Blob) */}
            <div 
              className="bg-white dark:bg-[#1d1d1f] rounded-[1.5rem] p-6 border border-gray-200 dark:border-white/10 shadow-md hover:scale-[1.01] transition-transform group cursor-pointer border-dashed border-2 hover:border-[#0071e3]"
              onClick={() => scheduleUrl && setIsScheduleModalOpen(true)}
            >
              <h3 className="text-[14px] font-bold tracking-tight flex items-center gap-2 mb-4 text-[#0071e3]">
                <CalendarDays className="w-4 h-4" /> {t('classSchedule')}
              </h3>
              {isLoadingSchedule ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#0071e3]" />
                </div>
              ) : scheduleUrl ? (
                <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-[#121214] relative">
                  <img src={scheduleUrl} alt="Class Schedule" className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Maximize className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white flex flex-col items-center justify-center min-h-[150px]">
                  <CalendarDays className="w-10 h-10 mb-3 opacity-50 text-gray-400" />
                  <span className="text-sm font-medium text-gray-400 text-center">{t('noSchedule')}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-9 xl:col-span-9 flex flex-col gap-6 lg:gap-8 w-full">
            
            {/* Announcements */}
            <div className="w-full bg-white dark:bg-[#1d1d1f] rounded-[2rem] p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-md">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                  <Bell className="w-6 h-6 text-[#0071e3]" /> {t('announcements')}
                </h2>
                <div className="text-[13px] font-bold bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] px-4 py-1.5 rounded-full">
                  {filteredAnnouncements.length} {t('items')}
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {filteredAnnouncements.length === 0 ? (
                  <div className="py-12 text-center bg-gray-50 dark:bg-white/5 rounded-2xl">
                    <Bell className="w-10 h-10 mx-auto mb-4 opacity-30" />
                    <p className="text-sm opacity-60">{t('noAnnouncements')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAnnouncements.map(ann => (
                      <div key={ann.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-[#000] border border-gray-200 dark:border-white/5 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-mono opacity-60 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {formatDateTime(ann.created_at)}</span>
                          {ann.is_global && <span className="bg-[#0071e3] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{t('global')}</span>}
                        </div>
                        <h4 className="font-bold text-[15px] leading-tight mb-2">{ann.title}</h4>
                        <p className="text-[13px] opacity-70 whitespace-pre-wrap">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignments (แก้ปัญหาข้อมูลหลุดกรอบ Grid ด้วย min-w-0 และ flex-wrap) */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[2rem] p-6 md:p-8 border border-gray-200 dark:border-white/10 shadow-md">
              <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                  <FileText className="w-6 h-6 text-[#0071e3]" /> {t('assignments')}
                </h2>
                <div className="text-[13px] font-bold bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] px-4 py-1.5 rounded-full">
                  {filteredAssignments.length} {t('tasks')}
                </div>
              </div>

              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {filteredAssignments.length === 0 ? (
                  <div className="py-16 text-center bg-gray-50 dark:bg-white/5 rounded-2xl">
                    <FileText className="w-10 h-10 mx-auto mb-4 opacity-30" />
                    <p className="text-[15px] opacity-60">{t('noAssignments')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredAssignments.map(task => {
                      const expired = isExpired(task.due_date);
                      return (
                        <div key={task.id} className="group p-5 bg-gray-50 dark:bg-[#000] border border-gray-200 dark:border-white/5 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 h-full">
                          
                          {/* ส่วนหัวชื่องานและรหัสวิชา */}
                          <div className="flex items-start gap-4 w-full">
                            <div className="min-w-[70px] h-[60px] bg-white dark:bg-[#1d1d1f] border border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0">
                              <span className="text-[10px] font-mono opacity-50 tracking-wider uppercase">{t('code')}</span>
                              <span className="font-bold text-[13px] mt-1 truncate max-w-[65px]" title={task.subjects?.code}>{task.subjects?.code || 'WORK'}</span>
                            </div>
                            <div className="min-w-0 flex-1 w-full">
                              <h4 className="font-bold text-[15px] sm:text-[16px] group-hover:text-[#0071e3] transition-colors leading-snug line-clamp-2 break-words" title={task.title}>{task.title}</h4>
                              <p className="text-[12px] sm:text-[13px] opacity-60 mt-1 truncate" title={task.subjects?.name}>{task.subjects?.name}</p>
                            </div>
                          </div>
                          
                          {/* ส่วนกำหนดส่ง (ยืดหยุ่นไม่หลุดกรอบ) */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-white/5 text-xs w-full mt-auto">
                            <div className="flex items-center gap-2 font-mono bg-white dark:bg-[#1d1d1f] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm flex-1 min-w-[150px] overflow-hidden">
                              <Clock className="w-3.5 h-3.5 opacity-60 shrink-0" />
                              <span className="opacity-60 shrink-0">{t('due')}:</span> 
                              <span className="font-bold text-[12px] sm:text-[13px] truncate">{formatDateTime(task.due_date)}</span>
                            </div>
                            <span className={`font-bold px-3 py-1.5 rounded-lg border uppercase text-[10px] tracking-wider shrink-0 ${expired ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                              {expired ? t('overdue') : t('pending')}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modal ดูรูปตารางเรียน (ซ่อน URL) */}
      {isScheduleModalOpen && scheduleUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8 animate__animated animate__fadeIn animate__faster" onClick={() => setIsScheduleModalOpen(false)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 hover:bg-white/40 p-2 rounded-full backdrop-blur-md transition-colors shadow-lg">
            <X className="w-6 h-6" />
          </button>
          <img src={scheduleUrl} alt="Full Schedule" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate__animated animate__zoomIn animate__faster" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <footer className="w-full px-6 py-8 border-t border-gray-200 dark:border-white/10 text-center mt-auto shrink-0 bg-[#fbfbfd] dark:bg-black">
        <p className="text-[14px] opacity-80 mb-2">
          © {new Date().getFullYear()} <span className="font-bold text-[#0071e3]">Pattaradanai Saiwongkham</span>
        </p>
        <p className="text-[12px] opacity-50 font-mono">
          SE-JOB Workspace System | Pro. Everywhere.
        </p>
      </footer>
    </div>
  );
}