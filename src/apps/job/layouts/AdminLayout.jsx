// src/apps/job/layouts/AdminLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import {
  LayoutDashboard, BookOpen, ClipboardList, Users, CalendarClock, Database,
  Link as LinkIcon, UserCircle, LogOut, Menu, X, Sun, Moon, ShieldCheck,
  ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import SEO from '../../../components/seo/SEO';
import 'animate.css';

// กำหนดข้อมูลห้องเรียนที่จัดการ
const ROOMS = [
  { id: 'room-1', name: 'ห้อง 1 (เทียบโอน)' },
  { id: 'room-2', name: 'ห้อง 2 (ปกติ 4 ปี)' }
];

const ADMIN = '/sework/admin';

/* ============================================================
   โครงสร้างเมนู: section > ( link เดี่ยว | group ที่มีเมนูย่อย )
   ============================================================ */
const NAV_SECTIONS = [
  {
    id: 'main',
    label: null,
    items: [
      { id: 'dashboard', title: 'ภาพรวมระบบ (Dashboard)', path: `${ADMIN}/dashboard`, icon: LayoutDashboard },
    ],
  },
  {
    id: 'classroom',
    label: 'จัดการห้องเรียน',
    items: [
      {
        id: 'academic', title: 'เนื้อหาการเรียน', icon: BookOpen,
        children: [
          { title: 'ประกาศ (Announcements)', path: `${ADMIN}/announcements` },
          { title: 'สั่งงาน (Assignments)', path: `${ADMIN}/assignments` },
          { title: 'ตารางเรียน (Schedules)', path: `${ADMIN}/schedules` },
          { title: 'รายวิชา (Subjects)', path: `${ADMIN}/subjects` },
          { title: 'ชีตการเรียน (Sheet Data)', path: `${ADMIN}/sheet-data` },
          { title: 'คลังเอกสารกลาง (Resource)', path: `${ADMIN}/resource-center` },
        ],
      },
      {
        id: 'submission', title: 'งานและคะแนน', icon: ClipboardList,
        children: [
          { title: 'แหล่งส่งงาน (Links)', path: `${ADMIN}/submission-links` },
          { title: 'ติดตามงาน (Tracking)', path: `${ADMIN}/submission-tracking` },
          { title: 'กระดานคะแนน (Leaderboard)', path: `${ADMIN}/leaderboard` },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'ระบบ',
    items: [
      {
        id: 'people', title: 'ผู้ใช้งาน', icon: Users,
        children: [
          { title: 'รายชื่อนักศึกษา (Users)', path: `${ADMIN}/users` },
          { title: 'รายชื่อแอดมิน (Contacts)', path: `${ADMIN}/contacts` },
        ],
      },
      { id: 'semesters', title: 'ปีการศึกษา (Semesters)', path: `${ADMIN}/semesters`, icon: CalendarClock },
      { id: 'internal-links', title: 'ลิงก์ภายใน (Internal Links)', path: `${ADMIN}/internal-links`, icon: LinkIcon },
      { id: 'export', title: 'ส่งออกข้อมูล (Export)', path: `${ADMIN}/export`, icon: Database },
    ],
  },
];

const ALL_GROUPS = NAV_SECTIONS.flatMap((s) => s.items).filter((i) => i.children);

const isPathActive = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

/* ============================================================
   หาชื่อผู้ใช้ที่ล็อกอิน (ลำดับ: ตาราง profiles → Supabase Auth → ส่วนหน้าอีเมล)
   ============================================================ */
const NAME_KEYS = ['full_name', 'fullname', 'display_name', 'name', 'nickname', 'username'];
const NOT_A_NAME = /avatar|file|image|photo|role|room|school|class|group|major|dept|faculty/i;
const asText = (v) => (typeof v === 'string' && v.trim() ? v.trim() : '');

const getDisplayName = (profile, authUser) => {
  const p = profile || {};
  const meta = authUser?.user_metadata || {};

  // 1) คอลัมน์ชื่อที่พบบ่อยใน profiles
  const direct = NAME_KEYS.map((k) => asText(p[k])).find(Boolean);
  if (direct) return direct;

  // 2) first_name + last_name
  const parts = [p.first_name, p.last_name].map(asText).filter(Boolean).join(' ');
  if (parts) return parts;

  // 3) คอลัมน์อื่นที่ชื่อมีคำว่า name (ยกเว้นพวก avatar / file / role ฯลฯ)
  const guessedKey = Object.keys(p).find((k) => /name/i.test(k) && !NOT_A_NAME.test(k) && asText(p[k]));
  if (guessedKey) return asText(p[guessedKey]);

  // 4) ข้อมูลจาก Supabase Auth → ส่วนหน้าอีเมล
  return asText(meta.full_name) || asText(meta.name) || asText(authUser?.email).split('@')[0] || 'Admin';
};

/* ============================================================
   Style tokens (รองรับ Light / Dark)
   ============================================================ */
const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/40';
const ITEM_BASE = `flex items-center rounded-xl text-sm font-medium transition-colors duration-200 motion-reduce:transition-none ${FOCUS}`;
const ITEM_IDLE = 'text-zinc-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white';
const ITEM_ACTIVE = 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0071e3]/15 dark:text-[#4da6ff]';
const ITEM_ACTIVE_SOFT = 'bg-[#0071e3]/[0.06] text-[#0071e3] dark:bg-[#0071e3]/10 dark:text-[#4da6ff]';

/* ============================================================
   เมนูเดี่ยว (ไม่มีเมนูย่อย)
   ============================================================ */
function NavSingleLink({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.title : undefined}
      className={({ isActive }) =>
        `${ITEM_BASE} h-10 ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${isActive ? ITEM_ACTIVE : ITEM_IDLE}`
      }
    >
      <Icon size={20} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </NavLink>
  );
}

/* ============================================================
   กลุ่มเมนูแบบพับได้ (โหมดขยาย) พร้อมเส้นต้นไม้ของเมนูย่อย
   ============================================================ */
function NavGroup({ group, open, onToggle, pathname }) {
  const Icon = group.icon;
  const hasActive = group.children.some((c) => isPathActive(pathname, c.path));

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`${ITEM_BASE} w-full h-10 gap-3 px-3 ${hasActive ? ITEM_ACTIVE_SOFT : ITEM_IDLE}`}
      >
        <Icon size={20} className="shrink-0" />
        <span className="flex-1 min-w-0 text-left truncate">{group.title}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-300 motion-reduce:transition-none ${
            hasActive ? '' : 'text-zinc-400 dark:text-zinc-500'
          } ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        aria-hidden={!open}
        className={`grid transition-all duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="ml-[22px] mt-1 mb-1 pl-3 border-l border-gray-200 dark:border-zinc-800 space-y-0.5">
            {group.children.map((child) => (
              <li key={child.path}>
                <NavLink
                  to={child.path}
                  tabIndex={open ? 0 : -1}
                  className={({ isActive }) =>
                    `relative flex items-center h-9 px-3 rounded-lg text-[13px] transition-colors duration-200 motion-reduce:transition-none ${FOCUS} ${
                      isActive ? `${ITEM_ACTIVE} font-semibold` : `${ITEM_IDLE} font-medium`
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute -left-[13px] top-2 bottom-2 w-[2px] rounded-full bg-[#0071e3] dark:bg-[#4da6ff]" />
                      )}
                      <span className="truncate">{child.title}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   รายการเมนูทั้งหมด (ใช้ทั้ง Desktop และ Mobile)
   - collapsed = true : แสดงเฉพาะไอคอน + Flyout เมนูย่อยตอน hover
   ============================================================ */
function SidebarNav({ collapsed, pathname, openGroups, onToggleGroup }) {
  const [flyout, setFlyout] = useState(null); // { id, top, left }
  const closeTimer = useRef(null);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setFlyout(null), 140);
  };
  const openFlyout = (group, el) => {
    cancelClose();
    const rect = el.getBoundingClientRect();
    const estimatedHeight = group.children.length * 38 + 64;
    setFlyout({
      id: group.id,
      top: Math.max(12, Math.min(rect.top, window.innerHeight - estimatedHeight - 12)),
      left: rect.right,
    });
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // ปิด flyout เมื่อเปลี่ยนหน้า หรือสลับโหมดย่อ/ขยาย
  useEffect(() => { setFlyout(null); }, [pathname, collapsed]);

  // ปิด flyout ด้วย Esc หรือคลิกนอกพื้นที่
  useEffect(() => {
    if (!flyout) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setFlyout(null); };
    const onDown = (e) => {
      if (!e.target.closest('[data-flyout], [data-flyout-trigger]')) setFlyout(null);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [flyout]);

  const flyoutGroup = flyout ? ALL_GROUPS.find((g) => g.id === flyout.id) : null;

  return (
    <nav aria-label="เมนูหลัก">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.id} className={index === 0 ? '' : 'mt-5'}>
          {section.label && (
            collapsed
              ? <div className="mx-3 mb-3 h-px bg-gray-200 dark:bg-zinc-800" />
              : <p className="px-3 mb-2 text-[11px] font-semibold tracking-wide text-zinc-400 dark:text-zinc-500">{section.label}</p>
          )}

          <div className="space-y-1">
            {section.items.map((item) => {
              if (!item.children) {
                return <NavSingleLink key={item.id} item={item} collapsed={collapsed} />;
              }

              if (!collapsed) {
                return (
                  <NavGroup
                    key={item.id}
                    group={item}
                    open={!!openGroups[item.id]}
                    onToggle={() => onToggleGroup(item.id)}
                    pathname={pathname}
                  />
                );
              }

              const Icon = item.icon;
              const hasActive = item.children.some((c) => isPathActive(pathname, c.path));
              const isOpen = flyout?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-flyout-trigger
                  aria-label={item.title}
                  aria-expanded={isOpen}
                  onMouseEnter={(e) => openFlyout(item, e.currentTarget)}
                  onMouseLeave={scheduleClose}
                  onClick={(e) => openFlyout(item, e.currentTarget)}
                  className={`${ITEM_BASE} w-full h-10 justify-center ${
                    hasActive
                      ? ITEM_ACTIVE
                      : isOpen
                        ? 'bg-gray-100 dark:bg-zinc-800/60 text-zinc-900 dark:text-white'
                        : ITEM_IDLE
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Flyout เมนูย่อย (โหมดย่อ) — render นอก aside เพื่อไม่ถูก overflow ตัด */}
      {collapsed && flyout && flyoutGroup && createPortal(
        <div
          data-flyout
          style={{ top: flyout.top, left: flyout.left }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="fixed z-[60] pl-4 font-sans select-none animate__animated animate__fadeIn animate__faster"
        >
          <div className="min-w-[230px] rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-2 shadow-xl shadow-black/10 dark:shadow-black/50">
            <p className="px-3 pt-1 pb-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">{flyoutGroup.title}</p>
            <ul className="space-y-0.5">
              {flyoutGroup.children.map((child) => (
                <li key={child.path}>
                  <NavLink
                    to={child.path}
                    className={({ isActive }) =>
                      `flex items-center h-9 px-3 rounded-lg text-[13px] transition-colors duration-200 ${FOCUS} ${
                        isActive ? `${ITEM_ACTIVE} font-semibold` : `${ITEM_IDLE} font-medium`
                      }`
                    }
                  >
                    <span className="truncate">{child.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
}

/* ============================================================
   ส่วนล่างของ Sidebar: โปรไฟล์ / สลับธีม / การ์ดผู้ใช้ + ออกจากระบบ
   ============================================================ */
function SidebarFooter({ collapsed, isDark, onToggleTheme, showThemeToggle = true, userProfile, authUser, onLogout }) {
  const name = getDisplayName(userProfile, authUser);
  const subline = userProfile?.role || 'Admin';
  const initial = name.trim().charAt(0).toUpperCase() || 'A';

  const avatar = (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0071e3] to-[#4da6ff] text-white text-sm font-bold flex items-center justify-center shrink-0 overflow-hidden">
      {userProfile?.avatar_url
        ? <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        : initial}
    </div>
  );

  return (
    <div className="shrink-0 p-3 border-t border-gray-200 dark:border-zinc-800/80 space-y-1">
      <NavLink
        to={`${ADMIN}/profile`}
        title={collapsed ? 'ตั้งค่าโปรไฟล์' : undefined}
        className={({ isActive }) =>
          `${ITEM_BASE} h-10 ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${isActive ? ITEM_ACTIVE : ITEM_IDLE}`
        }
      >
        <UserCircle size={20} className="shrink-0" />
        {!collapsed && <span className="truncate">ตั้งค่าโปรไฟล์</span>}
      </NavLink>

      {showThemeToggle && (
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={onToggleTheme}
          title={collapsed ? (isDark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด') : undefined}
          className={`${ITEM_BASE} w-full h-10 ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${ITEM_IDLE}`}
        >
          {isDark ? <Moon size={20} className="shrink-0" /> : <Sun size={20} className="shrink-0" />}
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">โหมดมืด</span>
              <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors duration-300 ${isDark ? 'bg-[#0071e3]' : 'bg-zinc-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${isDark ? 'translate-x-4' : ''}`} />
              </span>
            </>
          )}
        </button>
      )}

      {collapsed ? (
        <div className="flex flex-col items-center gap-1 pt-2">
          <div title={name}>{avatar}</div>
          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className={`w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${FOCUS}`}
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
          {avatar}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate">{name}</p>
            <p className="text-[11px] text-zinc-500 truncate">{subline}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="ออกจากระบบ"
            aria-label="ออกจากระบบ"
            className={`p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ${FOCUS}`}
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AdminLayout
   ============================================================ */
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // ธีม (จำค่าไว้ใน LocalStorage, ค่าเริ่มต้น = Dark)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('adminTheme');
    return saved ? saved === 'dark' : true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State สำหรับย่อ/ขยาย Sidebar พร้อมดึงค่าจาก LocalStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('isSidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // State กลุ่มเมนูที่เปิดอยู่ (จำค่าไว้ใน LocalStorage)
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('openNavGroups')) || {};
    } catch {
      return {};
    }
  });

  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null); // ผู้ใช้จาก Supabase Auth (ใช้เป็นตัวสำรองหาชื่อ)
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);

  // ลบ onSelectStart ป้องกัน React error, ใช้ class="select-none" แทน
  const preventAction = (e) => e.preventDefault();

  // จัดการ ธีม (Dark / Light)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('adminTheme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // โหลดข้อมูล Session และตั้งค่าห้องเริ่มต้น
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/sework/login');
        return;
      }
      setAuthUser(session.user);
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

  // เปิดกลุ่มเมนูที่มีหน้าปัจจุบันอยู่ข้างในอัตโนมัติ
  useEffect(() => {
    const group = ALL_GROUPS.find((g) => g.children.some((c) => isPathActive(location.pathname, c.path)));
    if (group) {
      setOpenGroups((prev) => (prev[group.id] ? prev : { ...prev, [group.id]: true }));
    }
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('openNavGroups', JSON.stringify(openGroups));
  }, [openGroups]);

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

  const toggleGroup = (id) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleTheme = () => setIsDark((v) => !v);

  return (
    <>
      <SEO
        title="Admin Workspace"
        description="ระบบจัดการหลังบ้าน SE-Job สำหรับผู้ดูแลระบบและนักศึกษา SE"
      />
      <div
        onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction}
        className="min-h-screen bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 flex select-none"
      >
        {/* Sidebar (Desktop) */}
        <aside
          className={`hidden lg:flex flex-col h-screen sticky top-0 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border-r border-gray-200 dark:border-zinc-800/80 shadow-[8px_0_30px_rgb(0,0,0,0.02)] z-40 transition-[width] duration-300 motion-reduce:transition-none ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
        >
          {/* Header: โลโก้ + ชื่อ Workspace */}
          <div className={`h-20 shrink-0 flex items-center border-b border-gray-200 dark:border-zinc-800/80 ${isSidebarCollapsed ? 'justify-center' : 'gap-3 px-5'}`}>
            <div className="w-10 h-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center shadow-sm p-1.5 shrink-0 overflow-hidden">
              <img
                src="/logo.png"
                alt="SE Logo"
                className="w-full h-full object-contain"
                onError={(e) => { e.target.outerHTML = '<span class="font-bold text-[#0071e3]">SE</span>' }}
              />
            </div>

            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 animate__animated animate__fadeIn animate__faster">
                <span className="font-bold text-sm truncate">Workspace Admin</span>
                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 truncate">
                  <ShieldCheck size={12} className="text-emerald-500 shrink-0" /> {userProfile?.role || 'Admin'}
                </span>
              </div>
            )}
          </div>

          {/* ปุ่มย่อ/ขยาย อยู่บนขอบ Sidebar */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
            title={isSidebarCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
            className={`absolute top-7 -right-3 w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-[#0071e3] shadow-sm transition-all hover:scale-110 z-50 ${FOCUS}`}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* รายการเมนู */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 custom-scrollbar">
            <SidebarNav
              collapsed={isSidebarCollapsed}
              pathname={location.pathname}
              openGroups={openGroups}
              onToggleGroup={toggleGroup}
            />
          </div>

          <SidebarFooter
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            userProfile={userProfile}
            authUser={authUser}
            onLogout={handleLogout}
          />
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
            <button onClick={toggleTheme} aria-label="สลับโหมดสว่าง/มืด" className="p-2 rounded-full border border-gray-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-800/50">
              {isDark ? <Sun size={16} className="text-zinc-300" /> : <Moon size={16} className="text-zinc-600" />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="เปิด/ปิดเมนู" className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800">
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm animate__animated animate__fadeIn animate__faster">
            <div className="absolute right-0 top-16 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-[#121214] border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col animate__animated animate__slideInRight animate__faster">
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

              <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
                <SidebarNav
                  collapsed={false}
                  pathname={location.pathname}
                  openGroups={openGroups}
                  onToggleGroup={toggleGroup}
                />
              </div>

              <SidebarFooter
                collapsed={false}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                showThemeToggle={false}
                userProfile={userProfile}
                authUser={authUser}
                onLogout={handleLogout}
              />
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
              <button onClick={toggleTheme} aria-label="สลับโหมดสว่าง/มืด" className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 shadow-sm hover:scale-110 transition-all">
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
    </>
  );
}