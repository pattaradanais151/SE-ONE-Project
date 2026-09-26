import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase'; // <-- แก้ไข Path ให้ตรงกับโฟลเดอร์ของคุณ
// import { useTheme } from '../../../shared/composables/useTheme'; // <-- แก้ไข Path Hook Theme
import {
  RefreshCw, ExternalLink, Sun, Moon,
  Clock, FileText, CalendarDays, Bell,
  AlertCircle, Loader2, Link2, Search,
  Terminal, ShieldCheck
} from 'lucide-react';
import 'animate.css';

const ROOMS = [
  { id: 'room-1', label: 'เทียบโอน', code: 'room-1' },
  { id: 'room-2', label: 'ปกติ', code: 'room-2' },
];

export default function JobHome() {
  const navigate = useNavigate();
  
  // จำลอง Hook สลับ Theme (เปิดใช้ของจริงได้เลย)
  const isDark = false; 
  const toggleTheme = () => {};

  // --- State Management ---
  const [activeRoom, setActiveRoom] = useState('room-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [thailandTime, setThailandTime] = useState('');
  
  const [realtimeStatus, setRealtimeStatus] = useState('connecting'); // 'connecting', 'connected', 'error'
  const [pingLatency, setPingLatency] = useState('...');
  const [currentLang, setCurrentLang] = useState('th');

  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);

  const [scheduleUrl, setScheduleUrl] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);

  const [assignments, setAssignments] = useState([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);

  const [resources, setResources] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(true);

  const [imgError, setImgError] = useState(false); // สำหรับตรวจสอบว่าโหลดโลโก้พลาดไหม

  // ใช้ useRef แทนตัวแปร Global เพื่อไม่ให้กระทบเมื่อ Component รีเรนเดอร์
  const realtimeChannelRef = useRef(null);
  const semesterPromiseRef = useRef(null);

  // --- Translation System (i18n) ---
  const translations = {
    th: {
      marquee: "📢 ข่าวสาร SE Portal • อัปเดตประกาศ งานที่ต้องส่ง และตารางเรียนแบบเรียลไทม์",
      searchPlaceholder: "ค้นหางาน, แหล่งส่งงาน หรือ ประกาศ...",
      login: "เข้าสู่ระบบ",
      register: "สมัครสมาชิก",
      liveConnected: "เชื่อมต่อเรียลไทม์",
      syncing: "กำลังซิงค์ข้อมูล...",
      refreshData: "รีเฟรชข้อมูล",
      classSchedule: "ตารางเรียน",
      noSchedule: "ยังไม่มีตารางเรียน",
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
      register: "Register",
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
    [isLoadingAnnouncements, isLoadingSchedule, isLoadingAssignments, isLoadingResources, realtimeStatus]
  );

  // --- Search Filters ---
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(a => 
      a.title?.toLowerCase().includes(q) || 
      a.content?.toLowerCase().includes(q)
    );
  }, [searchQuery, announcements]);

  const filteredAssignments = useMemo(() => {
    if (!searchQuery) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(a => 
      a.title?.toLowerCase().includes(q) || 
      a.subjects?.code?.toLowerCase().includes(q) ||
      a.subjects?.name?.toLowerCase().includes(q)
    );
  }, [searchQuery, assignments]);

  const filteredResources = useMemo(() => {
    if (!searchQuery) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(r => r.title?.toLowerCase().includes(q));
  }, [searchQuery, resources]);

  // --- Database Fetchers ---
  const getActiveSemesterId = async () => {
    if (!semesterPromiseRef.current) {
      semesterPromiseRef.current = supabase
        .from('semesters')
        .select('id')
        .eq('is_active', true)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.id ?? null;
        })
        .catch((err) => {
          semesterPromiseRef.current = null;
          throw err;
        });
    }
    return semesterPromiseRef.current;
  };

  const loadAnnouncements = useCallback(async (roomId) => {
    setIsLoadingAnnouncements(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_visible', true)
        .or(`room_id.eq.${roomId},is_global.eq.true`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, []);

  const loadSchedule = useCallback(async (roomId) => {
    setIsLoadingSchedule(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('image_url')
        .eq('room_id', roomId)
        .eq('is_active', true)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setScheduleUrl(data?.image_url || null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []);

  const loadResources = useCallback(async (roomId) => {
    setIsLoadingResources(true);
    try {
      const { data, error } = await supabase
        .from('submission_links')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResources(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingResources(false);
    }
  }, []);

  const loadAssignments = useCallback(async (roomId) => {
    setIsLoadingAssignments(true);
    try {
      const semesterId = await getActiveSemesterId();
      if (!semesterId) {
        setAssignments([]);
        setIsLoadingAssignments(false);
        return;
      }
      const { data, error } = await supabase
        .from('assignments')
        .select('*, subjects(code, name)')
        .eq('room_id', roomId)
        .eq('semester_id', semesterId)
        .order('due_date', { ascending: false });
      if (error) throw error;
      setAssignments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  const fetchRoomData = useCallback((roomId) => {
    localStorage.setItem('activeRoom', JSON.stringify({ id: roomId }));
    loadAnnouncements(roomId);
    loadSchedule(roomId);
    loadResources(roomId);
    loadAssignments(roomId);
  }, [loadAnnouncements, loadSchedule, loadResources, loadAssignments]);

  const handleRoomChange = (roomId) => {
    if (roomId === activeRoom) return;
    setActiveRoom(roomId);
    fetchRoomData(roomId);
  };

  const setupRealtime = useCallback(() => {
    setRealtimeStatus('connecting');
    const startTime = performance.now();

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    realtimeChannelRef.current = supabase.channel('public:se_portal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadAnnouncements(activeRoom);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        loadAssignments(activeRoom);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submission_links' }, () => {
        loadResources(activeRoom);
      })
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

  // --- Initial Setup Effect ---
  useEffect(() => {
    let savedRoomId = 'room-1';
    const saved = localStorage.getItem('activeRoom');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.id) savedRoomId = parsed.id;
      } catch {}
    }
    setActiveRoom(savedRoomId);
    fetchRoomData(savedRoomId);
    
    // ตั้งค่าเวลา
    const updateTime = () => {
      const now = new Date();
      setThailandTime(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }).format(now));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(timeInterval);
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    };
  }, [fetchRoomData]); // Run once on mount

  // เมื่อเปลี่ยนห้อง ให้เปิด Socket ใหม่อีกรอบ
  useEffect(() => {
    setupRealtime();
  }, [activeRoom, setupRealtime]);

  // --- Helpers ---
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear() + 543}`;
  };

  const isExpired = (dateStr) => new Date(dateStr) < new Date();
  const preventAction = (e) => e.preventDefault();

  return (
    <div 
      onContextMenu={preventAction}
      onCopy={preventAction}
      onDragStart={preventAction}
      className="h-screen w-full bg-[#fafafa] dark:bg-[#0a0a0a] text-[#222222] dark:text-[#f8f8f8] font-['Inter_Tight'] font-[300] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300 overflow-y-auto overflow-x-hidden select-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#222222] [&::-webkit-scrollbar-thumb]:rounded-full"
    >
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .hide-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 1. Top Marquee */}
      <div className="w-full bg-[#f4f4f4] dark:bg-[#111111] text-[12px] py-1.5 flex overflow-hidden whitespace-nowrap border-b border-gray-200 dark:border-white/5 font-medium shrink-0">
        <div className="animate-marquee flex gap-8 px-4">
           {[...Array(6)].map((_, i) => (
              <span key={i} className="opacity-70 flex items-center gap-2">
                 {t('marquee')} <span className="mx-4">|</span>
              </span>
           ))}
        </div>
      </div>

      {/* 2. Main Navbar */}
      <nav className="sticky top-0 z-50 w-full px-4 md:px-6 lg:px-8 h-[72px] flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          {/* Logo */}
          <div className="cursor-pointer shrink-0">
            <img 
              src="/logo.PNG" 
              alt="SE Logo" 
              className={`h-8 w-auto object-contain ${imgError ? 'hidden' : ''}`} 
              onError={() => setImgError(true)} 
            />
            {imgError && <div className="font-black text-2xl">SE.</div>}
          </div>
          
          {/* Brand Text */}
          <div className="hidden md:flex flex-col shrink-0 border-l border-gray-200 dark:border-white/10 pl-4 md:pl-6 mr-2">
            <span className="text-[14px] font-bold text-[#222] dark:text-[#f8f8f8] leading-tight">Software Engineering</span>
            <span className="text-[11px] font-mono opacity-50 leading-tight mt-0.5">RMUTL Gen 4 · Doisaket, Chiang Mai</span>
          </div>
          
          {/* Center Search Input (Desktop) */}
          <div className="hidden lg:flex flex-1 min-w-[250px] xl:min-w-[400px] max-w-2xl">
            <div className="relative w-full bg-[#f4f4f4] dark:bg-[#1a1a1a] rounded-full flex items-center px-4 py-2 border border-transparent dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20 transition-colors focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')} 
                className="bg-transparent w-full text-[14px] font-medium outline-none placeholder-gray-500 select-auto" 
              />
            </div>
          </div>
        </div>

        {/* Right Actions & Language Switcher */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0">
           {/* Language Switcher */}
           <div className="hidden sm:flex items-center bg-[#f4f4f4] dark:bg-[#1a1a1a] p-1 rounded-full border border-gray-200 dark:border-white/5">
              {['th', 'en'].map(l => (
                 <button
                   key={l}
                   onClick={() => setCurrentLang(l)}
                   className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors uppercase ${currentLang === l ? 'bg-white dark:bg-[#333] shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'}`}
                 >
                   {l}
                 </button>
              ))}
           </div>

           <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
             {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </button>
           
           <div className="flex items-center gap-3 sm:gap-4 text-[13px] sm:text-[14px] font-semibold">
              <span onClick={() => navigate('/job/login')} className="cursor-pointer hover:opacity-60 transition-opacity">{t('login')}</span>
           </div>
        </div>
      </nav>

      {/* 3. Filter Bar (Rooms) & Time Status */}
      <div className="w-full px-4 md:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] gap-4 md:gap-0 shrink-0">
        
        {/* Room Selector & Legal Link */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto hide-scroll w-full md:w-auto">
           {ROOMS.map(room => (
             <button
               key={room.id}
               onClick={() => handleRoomChange(room.id)}
               className={`shrink-0 border rounded-full px-5 py-1.5 text-[13px] font-semibold flex items-center gap-2 transition-all duration-300 ${
                 activeRoom === room.id 
                   ? 'border-[#222] bg-[#222] text-white dark:border-[#f8f8f8] dark:bg-[#f8f8f8] dark:text-black' 
                   : 'border-gray-200 dark:border-[#222] hover:bg-gray-50 dark:hover:bg-white/5'
               }`}
             >
               {room.label} <span className="font-normal opacity-60 text-[11px] font-mono">({room.code})</span>
             </button>
           ))}

           {/* Divider */}
           <div className="hidden sm:block w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1"></div>
           
           <button 
             onClick={() => navigate('/pdpa')}
             className="shrink-0 border border-transparent rounded-full px-4 py-1.5 text-[13px] font-semibold flex items-center gap-2 transition-all duration-300 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5"
           >
             <ShieldCheck className="w-4 h-4" />
             {t('legalBtn')}
           </button>
        </div>
        
        {/* Status & Time */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
           <div className="flex items-center gap-2 text-[12px] font-mono bg-[#f4f4f4] dark:bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/5">
              <Clock className="w-3.5 h-3.5 opacity-60" />
              <span className="opacity-70">{t('timePrefix')}:</span> <strong className="text-[#222] dark:text-white">{thailandTime}</strong>
           </div>

           <div className="hidden md:flex items-center gap-2 text-[12px] font-medium opacity-60">
              <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : (realtimeStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500')}`}></span>
              {realtimeStatus === 'connecting' ? t('syncing') : (realtimeStatus === 'error' ? 'Connection Error' : t('liveConnected'))}
           </div>
           
           <button onClick={() => { setSearchQuery(''); fetchRoomData(activeRoom); setupRealtime(); }} className="border border-gray-200 dark:border-[#222] rounded-full px-4 py-1.5 text-[13px] font-semibold hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2 transition-colors">
              {t('refreshData')} <RefreshCw className={`w-3 h-3 opacity-60 ${isSyncing ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* 4. Main Content Area */}
      <main className="w-full px-4 md:px-6 lg:px-8 xl:px-10 pt-8 pb-12 flex-1 mx-auto">
        
        {/* Mobile Search */}
        <div className="lg:hidden w-full mb-6 relative bg-white dark:bg-[#1a1a1a] rounded-full flex items-center px-4 py-2 border border-gray-200 dark:border-white/5 shadow-sm">
           <Search className="w-4 h-4 text-gray-400 mr-2" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder={t('searchPlaceholder')} 
             className="bg-transparent w-full text-[14px] font-medium outline-none select-auto" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-6 lg:gap-8 xl:gap-10 items-start">
          
          {/* LEFT COLUMN: Terminal -> Resources -> Schedule */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 w-full">
             
             {/* 1. Terminal Status */}
             <div className="bg-white dark:bg-[#111111] font-mono text-[13px] p-6 rounded-[20px] shadow-sm border border-gray-200 dark:border-white/5 transition-colors">
                <div className="flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
                  <Terminal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-400 font-semibold">{t('terminalStatus')} (status.sh)</span>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700 dark:text-gray-300 opacity-90">&gt; {t('terminalSync')} = {activeRoom}</p>
                  <p className="text-gray-500 flex items-center gap-2">
                    &gt; ping .. 
                    {realtimeStatus === 'connecting' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {realtimeStatus === 'connected' && <span className="text-xs text-green-500">{pingLatency}</span>}
                  </p>
                  
                  {realtimeStatus === 'connecting' && <p className="text-yellow-500 dark:text-yellow-400">&gt; {t('terminalConnect')}</p>}
                  {realtimeStatus === 'connected' && <p className="text-blue-600 dark:text-green-400">&gt; {t('terminalEstablished')}</p>}
                  {realtimeStatus === 'error' && <p className="text-red-500 dark:text-red-400">&gt; {t('terminalError')}</p>}
                  
                  <p className="text-orange-500 dark:text-yellow-400 pt-2">&gt; {t('terminalFound', { tasks: filteredAssignments.length, announcements: filteredAnnouncements.length })}</p>
                </div>
             </div>

             {/* 2. Resources Section */}
             <div className="bg-white dark:bg-[#111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm">
                <h3 className="text-[14px] font-bold uppercase tracking-wide flex items-center justify-between mb-4 text-[#222] dark:text-[#f8f8f8]">
                   <div className="flex items-center gap-2"><Link2 className="w-4 h-4" /> {t('resources')}</div>
                   <span className="bg-gray-100 dark:bg-[#222] px-2.5 py-0.5 rounded text-xs font-mono">{filteredResources.length}</span>
                </h3>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full">
                   {filteredResources.length === 0 ? (
                      <p className="text-sm opacity-50 text-center py-4">{t('noResources')}</p>
                   ) : (
                      filteredResources.map(res => (
                         <a key={res.id} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#222] transition-colors group">
                            <span className="font-semibold text-[13.3px] truncate text-[#222] dark:text-[#f8f8f8]">{res.title}</span>
                            <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 shrink-0 text-blue-500" />
                         </a>
                      ))
                   )}
                </div>
             </div>

             {/* 3. Schedule Image */}
             <div className="bg-white dark:bg-[#111] rounded-[20px] p-6 border border-gray-200 dark:border-white/5 shadow-sm">
                <h3 className="text-[14px] font-bold uppercase tracking-wide flex items-center gap-2 mb-4 text-[#222] dark:text-[#f8f8f8]">
                   <CalendarDays className="w-4 h-4" /> {t('classSchedule')}
                </h3>
                {scheduleUrl ? (
                   <a href={scheduleUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 relative group">
                      <img src={scheduleUrl} alt="Schedule" className="w-full h-auto object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                         <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                   </a>
                ) : (
                   <div className="aspect-[4/3] rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center opacity-50 bg-gray-50 dark:bg-transparent">
                      <CalendarDays className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">{t('noSchedule')}</span>
                   </div>
                )}
             </div>

          </div>

          {/* RIGHT COLUMN: Announcements -> Assignments */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 lg:gap-8 w-full">
             
             {/* 1. Announcements Section */}
             <div className="w-full bg-white dark:bg-[#111] rounded-[24px] p-6 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                   <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-[#222] dark:text-[#f8f8f8]">
                      <Bell className="w-6 h-6" /> {t('announcements')}
                   </h2>
                   <div className="text-[13px] font-bold bg-gray-100 dark:bg-[#222] px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400">{filteredAnnouncements.length}</span> {t('items')}
                   </div>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full">
                   {filteredAnnouncements.length === 0 ? (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[16px] bg-gray-50 dark:bg-transparent">
                         <Bell className="w-10 h-10 mx-auto mb-4 opacity-30" />
                         <p className="text-sm opacity-60 font-medium">{t('noAnnouncements')}</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
                         {filteredAnnouncements.map(ann => (
                            <div key={ann.id} className={`p-5 rounded-xl border-l-4 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-white/5 shadow-sm transition-all hover:shadow-md ${ann.is_global ? 'border-l-blue-500' : 'border-l-gray-400 dark:border-l-gray-600'}`}>
                               <div className="flex items-center justify-between gap-2 mb-3">
                                  <span className="text-[11px] font-mono opacity-60 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {formatDateTime(ann.created_at)}</span>
                                  {ann.is_global && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase">{t('global')}</span>}
                               </div>
                               <h4 className="font-bold text-[15px] leading-tight mb-2 text-[#222] dark:text-[#f8f8f8]">{ann.title}</h4>
                               <p className="text-[13.3px] opacity-70 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             {/* 2. Assignments Section */}
             <div className="bg-white dark:bg-[#111] rounded-[24px] p-6 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                   <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3 text-[#222] dark:text-[#f8f8f8]">
                      <FileText className="w-6 h-6" /> {t('assignments')} 
                      {searchQuery && <span className="text-sm font-normal opacity-50 ml-2 bg-gray-100 dark:bg-[#222] px-2 py-1 rounded-md">{t('searchResults')}</span>}
                   </h2>
                   <div className="text-[13px] font-bold bg-gray-100 dark:bg-[#222] px-4 py-1.5 rounded-full flex items-center gap-1.5">
                      <span className="text-blue-600 dark:text-blue-400">{filteredAssignments.length}</span> {t('tasks')}
                   </div>
                </div>

                {/* Assignments List */}
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-[#333] [&::-webkit-scrollbar-thumb]:rounded-full">
                   {filteredAssignments.length === 0 ? (
                      <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[16px] bg-gray-50 dark:bg-transparent">
                         <FileText className="w-10 h-10 mx-auto mb-4 opacity-30" />
                         <p className="text-[15px] opacity-60 font-medium">{t('noAssignments')}</p>
                      </div>
                   ) : (
                      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4">
                         {filteredAssignments.map(task => {
                            const expired = isExpired(task.due_date);
                            return (
                               <div key={task.id} className="group flex flex-col md:flex-row md:items-center justify-between p-5 bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-white/5 rounded-[16px] hover:shadow-md transition-all duration-300">
                                  
                                  <div className="flex items-start gap-4 mb-4 md:mb-0 w-full md:w-auto overflow-hidden">
                                     <div className="min-w-[70px] w-auto px-2 h-14 shrink-0 bg-white dark:bg-[#222] border border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                        <span className="text-[9px] font-mono opacity-50 tracking-wider">{t('code')}</span>
                                        <span className="font-bold text-[13px] text-center leading-none mt-1 text-[#222] dark:text-white w-full truncate" title={task.subjects?.code}>
                                           {task.subjects?.code || 'WORK'}
                                        </span>
                                     </div>
                                     <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-[16px] text-[#222] dark:text-[#f8f8f8] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight truncate">
                                           {task.title}
                                        </h4>
                                        <p className="text-[13.3px] opacity-60 mt-1 truncate">{task.subjects?.name}</p>
                                     </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-200 dark:border-white/10 shrink-0">
                                     <div className="flex items-center gap-2 text-[13px] font-mono bg-white dark:bg-[#222] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
                                        <Clock className="w-4 h-4 opacity-60" />
                                        <span className="opacity-60 mr-1">{t('due')}:</span> {formatDateTime(task.due_date)}
                                     </div>
                                     <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border uppercase tracking-wider ${expired ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'}`}>
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

      {/* 5. Footer */}
      <footer className="w-full px-4 md:px-6 lg:px-8 py-8 border-t border-gray-200 dark:border-white/5 text-center mt-auto shrink-0">
        <p className="text-[14px] opacity-80 mb-2 text-[#222] dark:text-white">
          © 2026{' '}
          <a href="https://fk-myportfolio.netlify.app/" target="_blank" rel="noreferrer" className="font-bold hover:underline">
            Pattaradanai Saiwongkham
          </a>
        </p>
        <p className="text-[12px] opacity-50 font-mono">
          Version 2.2.7 | Updated 19-09-2569 00:00 | All rights reserved.
        </p>
      </footer>

    </div>
  );
}