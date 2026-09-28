// src/apps/job/layouts/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { 
  LayoutDashboard, Megaphone, ClipboardList, CalendarDays, BookOpen, 
  Link2, FileCheck, Trophy, Users, Contact, CalendarClock, UserCircle, 
  LogOut, Menu, X, Sun, Moon, ShieldCheck, Database, ChevronLeft, ChevronRight,
  FolderOpen, FileSpreadsheet, Link as LinkIcon
} from 'lucide-react';
import 'animate.css';

// กำหนดข้อมูลห้องเรียนที่จัดการ
const ROOMS = [
  { id: 'room-1', name: 'ห้อง 1 (เทียบโอน)' },
  { id: 'room-2', name: 'ห้อง 2 (ปกติ 4 ปี)' }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State สำหรับย่อ/ขยาย Sidebar พร้อมดึงค่าจาก LocalStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('isSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [userProfile, setUserProfile] = useState(null);
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);

  // ลบ onSelectStart ป้องกัน React error, ใช้ class="select-none" แทน
  const preventAction = (e) => e.preventDefault();

  // จัดการ ธีม (Dark / Light)
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // โหลดข้อมูล Session และตั้งค่าห้องเริ่มต้น
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/sework/login');
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setUserProfile(data);
    };

    fetchSession();
    
    // โหลดห้องจาก LocalStorage ถ้ามี
    const storedRoom = localStorage.getItem('activeRoom');
    if (storedRoom) {
      try {
        const parsed = JSON.parse(storedRoom);
        const matchedRoom = ROOMS.find(r => r.id === parsed.id) || ROOMS[0];
        setActiveRoom(matchedRoom);
      } catch {
        setActiveRoom(ROOMS[0]);
      }
    } else {
      localStorage.setItem('activeRoom', JSON.stringify(ROOMS[0]));
    }
  }, [navigate]);

  // ปิดเมนูมือถือเวลาเปลี่ยนหน้า
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/sework/login');
  };

  // ฟังก์ชันสลับห้อง
  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    const room = ROOMS.find(r => r.id === roomId);
    if (room) {
      setActiveRoom(room);
      localStorage.setItem('activeRoom', JSON.stringify(room));
    }
  };

  // ฟังก์ชันสลับย่อ/ขยาย Sidebar
  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('isSidebarCollapsed', JSON.stringify(newState));
  };

  // 📌 เพิ่มเมนูที่ตกหล่นให้ครบทุกไฟล์
  const navItems = [
    { title: 'ภาพรวมระบบ (Dashboard)', path: '/sework/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { title: 'ประกาศ (Announcements)', path: '/sework/admin/announcements', icon: <Megaphone size={20} /> },
    { title: 'สั่งงาน (Assignments)', path: '/sework/admin/assignments', icon: <ClipboardList size={20} /> },
    { title: 'ตารางเรียน (Schedules)', path: '/sework/admin/schedules', icon: <CalendarDays size={20} /> },
    { title: 'รายวิชา (Subjects)', path: '/sework/admin/subjects', icon: <BookOpen size={20} /> },
    { title: 'ชีตการเรียน (Sheet Data)', path: '/sework/admin/sheet-data', icon: <FileSpreadsheet size={20} /> },
    { title: 'คลังเอกสารกลาง (Resource)', path: '/sework/admin/resource-center', icon: <FolderOpen size={20} /> },
    { title: 'แหล่งส่งงาน (Links)', path: '/sework/admin/submission-links', icon: <Link2 size={20} /> },
    { title: 'ติดตามงาน (Tracking)', path: '/sework/admin/submission-tracking', icon: <FileCheck size={20} /> },
    { title: 'กระดานคะแนน (Leaderboard)', path: '/sework/admin/leaderboard', icon: <Trophy size={20} /> },
    { title: 'ลิงก์ภายใน (Internal Links)', path: '/sework/admin/internal-links', icon: <LinkIcon size={20} /> },
    { title: 'รายชื่อนักศึกษา (Users)', path: '/sework/admin/users', icon: <Users size={20} /> },
    { title: 'รายชื่อแอดมิน (Contacts)', path: '/sework/admin/contacts', icon: <Contact size={20} /> },
    { title: 'ปีการศึกษา (Semesters)', path: '/sework/admin/semesters', icon: <CalendarClock size={20} /> },
    { title: 'ส่งออกข้อมูล (Export)', path: '/sework/admin/export', icon: <Database size={20} /> },
  ];

  return (
    <div 
      onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction}
      className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 flex select-none"
    >
      {/* Sidebar (Desktop) */}
      <aside 
        className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white/70 dark:bg-[#121214]/70 backdrop-blur-xl border-r border-gray-200 dark:border-zinc-800/80 shadow-[8px_0_30px_rgb(0,0,0,0.02)] z-40 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        <div className={`p-6 flex items-center border-b border-gray-200 dark:border-zinc-800/80 relative transition-all ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="w-12 h-12 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="SE Logo" 
              className="w-full h-full object-contain"
              onError={(e) => { e.target.outerHTML = '<span class="font-bold text-[#0071e3]">SE</span>' }} 
            />
          </div>

          {!isSidebarCollapsed && (
            <div className="flex flex-col overflow-hidden animate__animated animate__fadeIn animate__faster">
              <span className="font-bold text-sm truncate">Workspace Admin</span>
              <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 truncate"><ShieldCheck size={12} className="text-emerald-500 shrink-0"/> {userProfile?.role || 'Admin'}</span>
            </div>
          )}
          
          <button 
            onClick={toggleSidebar}
            className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-[#0071e3] shadow-sm transition-all hover:scale-110 z-50 ${isSidebarCollapsed ? '-right-3' : 'right-4'}`}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.title : ''}
              className={({ isActive }) => 
                `flex items-center rounded-xl text-sm font-medium transition-all duration-300 ${
                  isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'
                } ${
                  isActive 
                    ? 'bg-[#0071e3] text-white shadow-md shadow-blue-500/20' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white'
                }`
              }
            >
              <div className="shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          ))}
        </div>

        {/* เมนู Profile ไว้ล่างสุด */}
        <div className={`p-4 border-t border-gray-200 dark:border-zinc-800/80 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <NavLink
            to="/sework/admin/profile"
            title={isSidebarCollapsed ? 'ตั้งค่าโปรไฟล์' : ''}
            className={({ isActive }) => 
              `flex items-center rounded-xl text-sm font-medium transition-all duration-300 mb-2 ${
                isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'
              } ${
                isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50'
              }`
            }
          >
            <div className="shrink-0"><UserCircle size={20} /></div>
            {!isSidebarCollapsed && <span className="truncate">ตั้งค่าโปรไฟล์</span>}
          </NavLink>
          <button 
            onClick={handleLogout}
            title={isSidebarCollapsed ? 'ออกจากระบบ' : ''}
            className={`flex items-center w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 ${
              isSidebarCollapsed ? 'justify-center py-3' : 'gap-3 px-4 py-3'
            }`}
          >
            <div className="shrink-0"><LogOut size={20} /></div>
            {!isSidebarCollapsed && <span className="truncate">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="lg:hidden fixed top-0 w-full h-16 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800/80 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden p-1">
             <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
            {isDark ? <Sun size={16} className="text-zinc-300" /> : <Moon size={16} className="text-zinc-600" />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm animate__animated animate__fadeIn animate__faster">
          <div className="absolute right-0 top-16 bottom-0 w-64 bg-white dark:bg-[#121214] border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col animate__animated animate__slideInRight animate__faster">
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
               <label className="block text-xs font-bold text-zinc-500 mb-1.5">สลับห้องข้อมูล</label>
               <select 
                  value={activeRoom.id}
                  onChange={handleRoomChange}
                  className="w-full px-3 py-2 bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] rounded-lg text-sm font-bold border border-[#0071e3]/20 outline-none"
               >
                  {ROOMS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
               </select>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-[#0071e3] text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  {item.icon}
                  {item.title}
                </NavLink>
              ))}
              
              {/* Profile Link in Mobile */}
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-zinc-800/50">
                <NavLink
                  to="/sework/admin/profile"
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <UserCircle size={20} />
                  ตั้งค่าโปรไฟล์
                </NavLink>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <LogOut size={20} />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden pt-16 lg:pt-0 relative">
        <header className="hidden lg:flex h-20 px-8 items-center justify-between border-b border-gray-200 dark:border-zinc-800/80 bg-white/50 dark:bg-black/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-500">กำลังจัดการข้อมูล:</span>
            <select 
              value={activeRoom.id}
              onChange={handleRoomChange}
              className="px-4 py-1.5 bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] dark:text-[#4da6ff] rounded-full text-sm font-bold border border-[#0071e3]/20 outline-none cursor-pointer hover:bg-blue-100 dark:hover:bg-[#0071e3]/20 transition-colors appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%230071e3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1em',
                paddingRight: '2.2rem'
              }}
            >
              {ROOMS.map(room => (
                <option key={room.id} value={room.id} className="text-zinc-900">{room.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/sework')} className="text-sm font-medium text-zinc-500 hover:text-[#0071e3] transition-colors">
              กลับสู่หน้า SE-JOB
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shadow-sm hover:scale-110 transition-all">
              {isDark ? <Sun size={18} className="text-zinc-300" /> : <Moon size={18} className="text-zinc-600" />}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          <Outlet context={{ userProfile, activeRoom }} />
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.6); }
      `}</style>
    </div>
  );
}