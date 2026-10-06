// src/apps/job/views/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  RefreshCw, Users, BookOpen, ClipboardList, 
  Activity, ArrowUpRight, ArrowDownRight, Clock, 
  TrendingUp, BarChart3, PieChart, MoreHorizontal, ShieldCheck
} from 'lucide-react';
import 'animate.css';

// ------------------------------------------
// 📊 นำเข้า Chart Libraries ทั้ง 3 ค่าย
// ------------------------------------------
import ApexChart from 'react-apexcharts';
import { Chart as ChartJS, ArcElement, Tooltip as ChartJsTooltip, Legend as ChartJsLegend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

// ลงทะเบียน Chart.js
ChartJS.register(ArcElement, ChartJsTooltip, ChartJsLegend);

export default function Dashboard() {
  const { userProfile, activeRoom } = useOutletContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 🌓 ตรวจจับ Dark Mode เพื่อปรับสีกราฟให้เข้ากับ Theme
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  // ==========================================
  // 💾 State สำหรับเก็บข้อมูลจริงจาก Database
  // ==========================================
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisWeek: 0,
    totalSubjects: 0,
    totalAssignments: 0,
    assignmentsDueThisWeek: 0,
    activeSemester: null
  });

  const [recentLogs, setRecentLogs] = useState([]);
  
  // ข้อมูลสำหรับกราฟเส้น (กิจกรรมย้อนหลัง 7 วัน)
  const [activityTrend, setActivityTrend] = useState({
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    data: [0, 0, 0, 0, 0, 0, 0]
  });

  // ข้อมูลสำหรับกราฟแท่ง (จำนวนงานแยกตามวิชา)
  const [subjectOverview, setSubjectOverview] = useState({
    categories: [],
    data: []
  });

  const preventAction = (e) => e.preventDefault();

  // ตรวจจับการเปลี่ยน Theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ==========================================
  // 🚀 ฟังก์ชันดึงข้อมูลแบบ Real Data
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. ดึงภาคการศึกษาปัจจุบัน
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      let uCount = 0, newUCount = 0, sCount = 0, aCount = 0, aDueCount = 0;

      // 2. ข้อมูล Users
      if (activeRoom?.id) {
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('role', 'User').eq('room_access', activeRoom.id);
        uCount = usersCount || 0;

        const { count: newUsersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
          .eq('role', 'User').eq('room_access', activeRoom.id).gte('created_at', sevenDaysAgo);
        newUCount = newUsersCount || 0;
      }

      // 3. ข้อมูล Subjects & Assignments
      let subjectList = [];
      let assignmentList = [];
      
      if (activeRoom?.id && sem) {
        // นับวิชา
        const { data: subs } = await supabase.from('subjects').select('id, code, name').eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        subjectList = subs || [];
        sCount = subjectList.length;

        // นับงาน
        const { data: assigns } = await supabase.from('assignments').select('id, due_date, subject_id').eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        assignmentList = assigns || [];
        aCount = assignmentList.length;

        // งานที่กำหนดส่งในสัปดาห์นี้
        aDueCount = assignmentList.filter(a => a.due_date >= now.toISOString() && a.due_date <= sevenDaysAhead).length;
      }

      setStats({
        totalUsers: uCount,
        newUsersThisWeek: newUCount,
        totalSubjects: sCount,
        totalAssignments: aCount,
        assignmentsDueThisWeek: aDueCount,
        activeSemester: sem
      });

      // 4. ข้อมูล Activity Logs (ดึงของทุกคน)
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*, profiles(first_name, last_name, role)') // Join ตาราง profiles
        .order('created_at', { ascending: false });
        
      setRecentLogs((logs || []).slice(0, 10)); // โชว์แค่ 10 รายการล่าสุดใน List

      // 5. เตรียมข้อมูลกราฟเส้น (Activity Trend ย้อนหลัง 7 วัน)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });
      
      const trendCategories = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
      const trendData = last7Days.map(date => {
        return (logs || []).filter(log => new Date(log.created_at).toDateString() === date.toDateString()).length;
      });
      
      setActivityTrend({ categories: trendCategories, data: trendData });

      // 6. เตรียมข้อมูลกราฟแท่ง (จำนวนงานต่อวิชา)
      if (subjectList.length > 0) {
        const barCategories = subjectList.map(s => s.code);
        const barData = subjectList.map(s => assignmentList.filter(a => a.subject_id === s.id).length);
        setSubjectOverview({ categories: barCategories, data: barData });
      } else {
        setSubjectOverview({ categories: ['No Data'], data: [0] });
      }

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeRoom]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();

    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (webhookUrl && userProfile) {
      try {
        const payload = {
          embeds: [{
            title: "🔄 Dashboard Synced",
            description: `แอดมิน **${userProfile.first_name}** กดอัปเดตข้อมูลสถิติล่าสุด\nห้อง: **${activeRoom.name}**`,
            color: 3447003,
            timestamp: new Date().toISOString()
          }]
        };
        fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        console.error('Discord error:', e);
      }
    }
  };

  // Helper Functions
  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : 'U';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}`;
  };

  const timeSince = (dateStr) => {
    if (!dateStr) return '';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return new Date(dateStr).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + " mins ago";
    return "Just now";
  };

  // ==========================================
  // 📈 การตั้งค่า Chart (Dynamic)
  // ==========================================

  // 1. ApexCharts: Activity Trend (Real Data)
  const apexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#0071e3'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { 
      categories: activityTrend.categories,
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: isDark ? '#a1a1aa' : '#9ca3af', fontWeight: 500 } }
    },
    yaxis: { labels: { style: { colors: isDark ? '#a1a1aa' : '#9ca3af', fontWeight: 500 } } },
    grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0, stops: [0, 100] } },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };
  const apexSeries = [{ name: 'System Actions', data: activityTrend.data }];

  // 2. Chart.js: Doughnut Chart (Real Data Ratio)
  const chartJsData = {
    labels: ['Users', 'Subjects', 'Assignments'],
    datasets: [{
      data: [stats.totalUsers || 0, stats.totalSubjects || 0, stats.totalAssignments || 0],
      backgroundColor: ['#10b981', '#f43f5e', '#a855f7'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  const chartJsOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: isDark ? '#a1a1aa' : '#6b7280', padding: 20, font: { family: 'Inter', weight: 'bold' } } } },
    cutout: '75%',
  };

  // 3. Highcharts: Column Chart (แก้ปัญหาหลุดกรอบ + Real Data)
  const highchartsOptions = {
    chart: { type: 'column', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: '' },
    xAxis: { 
      categories: subjectOverview.categories, 
      labels: { style: { color: isDark ? '#a1a1aa' : '#6b7280', fontSize: '10px' } },
      lineColor: isDark ? '#27272a' : '#e5e7eb'
    },
    yAxis: { 
      title: { text: '' }, 
      gridLineColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      gridLineDashStyle: 'Dash',
      labels: { style: { color: isDark ? '#a1a1aa' : '#6b7280' } }
    },
    series: [{ name: 'Assignments per Subject', data: subjectOverview.data, color: '#f59e0b', borderRadius: 4 }],
    legend: { itemStyle: { color: isDark ? '#a1a1aa' : '#6b7280', fontWeight: 'bold' }, itemHoverStyle: { color: isDark ? '#fff' : '#000' } },
    plotOptions: { column: { borderWidth: 0 } },
    credits: { enabled: false }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-70"
        >
          <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 dark:border-zinc-800 border-t-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* ------------------------------------------
              Row 1: Stat Cards 
              ------------------------------------------ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Total Users</h3>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{stats.totalUsers}</p>
                      {stats.newUsersThisWeek > 0 && <span className="text-xs font-bold text-emerald-500 flex items-center mb-0.5"><ArrowUpRight size={12}/> +{stats.newUsersThisWeek}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium ml-14 mt-1">{stats.newUsersThisWeek} new this week</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500" />
            </div>

            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Subjects</h3>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{stats.totalSubjects}</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium ml-14 mt-1">Term {stats.activeSemester ? `${stats.activeSemester.term}/${stats.activeSemester.year}` : 'N/A'}</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500" />
            </div>

            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500 shrink-0">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Assignments</h3>
                    <div className="flex items-end gap-2">
                      <p className="text-2xl font-black text-zinc-900 dark:text-white leading-none">{stats.totalAssignments}</p>
                      {stats.assignmentsDueThisWeek > 0 && <span className="text-xs font-bold text-rose-500 flex items-center mb-0.5"><ArrowDownRight size={12}/> {stats.assignmentsDueThisWeek}</span>}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium ml-14 mt-1">{stats.assignmentsDueThisWeek} due this week</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500" />
            </div>

            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500 shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-zinc-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wider">Database</h3>
                    <div className="flex items-end gap-2">
                      <p className="text-xl font-black text-zinc-900 dark:text-white leading-none mt-1">Connected</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-emerald-500 font-bold ml-14 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Supabase Active</p>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500" />
            </div>

          </div>

          {/* ------------------------------------------
              Row 2: Area Chart & Recent Activity
              ------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Left: Area Chart (Span 2) */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">System Activities</h3>
                  <p className="text-[11px] text-zinc-500 font-medium mt-1">ประวัติการกระทำภายในระบบย้อนหลัง 7 วัน</p>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[280px]">
                <ApexChart options={apexOptions} series={apexSeries} type="area" height="100%" />
              </div>
            </div>

            {/* Right: Recent Activity List (Span 1) */}
            <div className="lg:col-span-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-zinc-800/50">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Recent Activity</h3>
                <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><MoreHorizontal size={18} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {recentLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-5">
                    {recentLogs.map((log, index) => {
                      const colors = [
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                        'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
                        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
                        'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <div key={log.id} className="flex items-start gap-4 group cursor-default">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
                            {getInitials(log.profiles?.first_name, log.profiles?.last_name)}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[13px] text-zinc-900 dark:text-zinc-200 leading-tight">
                              <span className="font-bold">{log.profiles?.first_name || 'Unknown'}</span> {log.action}
                            </p>
                            <p className="text-[12px] text-zinc-500 truncate mt-0.5">{log.details}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1">{timeSince(log.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ------------------------------------------
              Row 3: Highcharts & Doughnut
              ------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 3: Highcharts (Column) แก้ปัญหาหลุดกรอบด้วย wrapper div */}
            <div className="lg:col-span-2 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col">
               <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">Assignments per Subject</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">จำนวนงานที่ถูกสั่งแยกตามรายวิชาทั้งหมด</p>
                  </div>
               </div>
               {/* ⚠️ แก้ปัญหาหลุดกรอบ: เพิ่ม relative และ min-h, ตัด width/height ภายนอกออก */}
               <div className="flex-1 relative w-full min-h-[250px] overflow-hidden">
                  <HighchartsReact 
                    highcharts={Highcharts} 
                    options={highchartsOptions} 
                    containerProps={{ style: { height: "100%", width: "100%", position: "absolute" } }} 
                  />
               </div>
            </div>

            {/* Chart 4: Chart.js (Doughnut) */}
            <div className="lg:col-span-1 bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800/80 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="mb-4 text-center">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Data Distribution</h3>
                <p className="text-[11px] text-zinc-500 mt-1">Storage and system entities</p>
              </div>
              <div className="flex-1 relative min-h-[220px]">
                <Doughnut data={chartJsData} options={chartJsOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">
                    {(stats.totalUsers || 0) + (stats.totalSubjects || 0) + (stats.totalAssignments || 0)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Total Items</span>
                </div>
              </div>
            </div>

          </div>

        </>
      )}
    </div>
  );
}