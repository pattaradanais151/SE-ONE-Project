// src/apps/job/views/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import { 
  RefreshCw, Users, BookOpen, ClipboardList, 
  Activity, ArrowUpRight, Clock, ShieldCheck,
  TrendingUp, BarChart3, PieChart
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
  const [recentLogs, setRecentLogs] = useState([]);
  
  // ตรวจจับ Dark Mode เพื่อปรับสีกราฟให้เข้ากับ Theme
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalAssignments: 0,
    activeSemester: null
  });

  const preventAction = (e) => e.preventDefault();

  // ------------------------------------------
  // 🌓 ตรวจจับการเปลี่ยน Theme แบบ Real-time
  // ------------------------------------------
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // ------------------------------------------
  // 🚀 Fetch Data
  // ------------------------------------------
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: sem } = await supabase.from('semesters').select('*').eq('is_active', true).single();
      let usersCount = 0, subsCount = 0, assignsCount = 0;

      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'User');
      usersCount = uCount || 0;

      if (activeRoom?.id && sem) {
        const { count: sCount } = await supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        subsCount = sCount || 0;

        const { count: aCount } = await supabase.from('assignments').select('*', { count: 'exact', head: true }).eq('room_id', activeRoom.id).eq('semester_id', sem.id);
        assignsCount = aCount || 0;
      }

      setStats({
        totalUsers: usersCount,
        totalSubjects: subsCount,
        totalAssignments: assignsCount,
        activeSemester: sem
      });

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*, profiles(first_name, role)')
        .order('created_at', { ascending: false })
        .limit(6);
        
      setRecentLogs(logs || []);

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

  // ระบบส่ง Discord เวลา Refresh Stats
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();

    const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
    if (webhookUrl && userProfile) {
      try {
        const payload = {
          embeds: [{
            title: "🔄 Dashboard Synced",
            description: `แอดมิน **${userProfile.first_name}** อัปเดตข้อมูลสถิติล่าสุดในหน้า Dashboard\nห้องที่จัดการ: **${activeRoom.name}**`,
            color: 3447003,
            timestamp: new Date().toISOString()
          }]
        };
        await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) {
        console.error('Discord Webhook error:', e);
      }
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  // ==========================================
  // 📈 การตั้งค่า Chart ต่างๆ
  // ==========================================

  // 1. ApexCharts: Area Chart (กราฟแนวโน้มความเคลื่อนไหวจำลอง)
  const apexOptions = {
    chart: { type: 'area', toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, Noto Sans Thai, sans-serif' },
    theme: { mode: isDark ? 'dark' : 'light' },
    colors: ['#0071e3'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { 
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false }, axisTicks: { show: false },
      labels: { style: { colors: isDark ? '#a1a1aa' : '#71717a' } }
    },
    yaxis: { labels: { style: { colors: isDark ? '#a1a1aa' : '#71717a' } } },
    grid: { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', strokeDashArray: 4 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] } },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };
  const apexSeries = [{ name: 'System Activity', data: [12, 19, 15, 25, 22, 30, 28] }];

  // 2. Chart.js: Doughnut Chart (สัดส่วนข้อมูลในระบบ)
  const chartJsData = {
    labels: ['Users', 'Subjects', 'Assignments'],
    datasets: [{
      data: [stats.totalUsers || 1, stats.totalSubjects || 1, stats.totalAssignments || 1],
      backgroundColor: ['#0071e3', '#8b5cf6', '#f97316'],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };
  const chartJsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: isDark ? '#a1a1aa' : '#52525b', padding: 20, font: { family: 'Inter' } } }
    },
    cutout: '75%',
  };

  // 3. Highcharts: Column Chart (กราฟแท่งสรุปงานแต่ละสัปดาห์จำลอง)
  const highchartsOptions = {
    chart: { type: 'column', backgroundColor: 'transparent', style: { fontFamily: 'Inter, sans-serif' } },
    title: { text: '' },
    xAxis: { 
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 
      labels: { style: { color: isDark ? '#a1a1aa' : '#52525b' } },
      lineColor: isDark ? '#27272a' : '#e5e7eb'
    },
    yAxis: { 
      title: { text: '' }, 
      gridLineColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      gridLineDashStyle: 'Dash',
      labels: { style: { color: isDark ? '#a1a1aa' : '#52525b' } }
    },
    series: [{ name: 'Tasks Completed', data: [45, 60, 55, 80], color: '#10b981', borderRadius: 4 }],
    legend: { itemStyle: { color: isDark ? '#a1a1aa' : '#52525b', fontWeight: 'normal' }, itemHoverStyle: { color: isDark ? '#fff' : '#000' } },
    plotOptions: { column: { borderWidth: 0 } },
    credits: { enabled: false }
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* ------------------------------------------
          Header Section
          ------------------------------------------ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">System Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            ภาพรวมสถิติและสถานะการทำงานของ <span className="font-bold text-[#0071e3]">{activeRoom.name}</span>
          </p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-2.5 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800/80 rounded-full font-bold text-sm text-zinc-700 dark:text-zinc-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:bg-zinc-800 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none active:scale-95 disabled:opacity-70"
        >
          <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin text-[#0071e3]' : 'text-[#0071e3]'}`} />
          {isRefreshing ? 'Syncing...' : 'Refresh Data'}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-zinc-800 border-t-[#0071e3] dark:border-t-[#0071e3]"></div>
        </div>
      ) : (
        <>
          {/* ------------------------------------------
              Row 1: Stat Cards (Glassmorphism)
              ------------------------------------------ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071e3]/10 rounded-full blur-3xl group-hover:bg-[#0071e3]/20 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 bg-[#0071e3]/10 rounded-[1rem] flex items-center justify-center text-[#0071e3]">
                  <Users size={24} />
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                  <ArrowUpRight size={14} /> Active
                </span>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1 relative z-10">นักศึกษาในระบบ</h3>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10">{stats.totalUsers}</p>
            </div>

            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-[1rem] flex items-center justify-center text-indigo-500">
                  <BookOpen size={24} />
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-700">
                  {stats.activeSemester ? `T${stats.activeSemester.term}/${stats.activeSemester.year}` : 'N/A'}
                </span>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1 relative z-10">รายวิชาเรียน</h3>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10">{stats.totalSubjects}</p>
            </div>

            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 bg-orange-500/10 rounded-[1rem] flex items-center justify-center text-orange-500">
                  <ClipboardList size={24} />
                </div>
              </div>
              <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-bold mb-1 relative z-10">งานที่สั่งทั้งหมด</h3>
              <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10">{stats.totalAssignments}</p>
            </div>

            <div className="bg-gradient-to-br from-[#0071e3] to-indigo-600 rounded-[2rem] p-6 shadow-lg hover:-translate-y-1 transition-transform relative overflow-hidden group text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-[1rem] flex items-center justify-center text-white backdrop-blur-sm">
                  <Activity size={24} />
                </div>
                <span className="text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-sm border border-white/10">Live</span>
              </div>
              <h3 className="text-blue-100 text-sm font-bold mb-1 relative z-10">ระบบฐานข้อมูล</h3>
              <p className="text-xl font-black tracking-tight relative z-10 mt-2">Supabase Connected</p>
            </div>
            
          </div>

          {/* ------------------------------------------
              Row 2: 📊 The Ultimate Charts Showcase
              ------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Chart 1: ApexCharts (Area) */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-[#0071e3]" size={20}/> Activity Trend
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">แนวโน้มความเคลื่อนไหวในระบบรอบ 7 วันที่ผ่านมา</p>
                </div>
              </div>
              <div className="h-[280px] w-full">
                <ApexChart options={apexOptions} series={apexSeries} type="area" height="100%" />
              </div>
            </div>

            {/* Chart 2: Chart.js (Doughnut) */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center justify-center gap-2">
                  <PieChart className="text-purple-500" size={20}/> Data Ratio
                </h3>
              </div>
              <div className="flex-1 relative min-h-[220px]">
                <Doughnut data={chartJsData} options={chartJsOptions} />
                {/* Custom text inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{stats.totalUsers + stats.totalSubjects + stats.totalAssignments}</span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Total Data</span>
                </div>
              </div>
            </div>

          </div>

          {/* ------------------------------------------
              Row 3: Highcharts & Recent Logs
              ------------------------------------------ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 3: Highcharts (Column) */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
               <div className="mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="text-emerald-500" size={20}/> Tasks Overview
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">สถิติการส่งงานเฉลี่ยในแต่ละสัปดาห์</p>
               </div>
               <div className="h-[250px] w-full">
                  <HighchartsReact highcharts={Highcharts} options={highchartsOptions} />
               </div>
            </div>

            {/* Recent Activities List */}
            <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800/80">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Clock className="text-orange-500" size={20} /> Recent Activities Log
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {recentLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-zinc-500 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
                    ไม่มีความเคลื่อนไหว
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 rounded-[1.5rem] bg-zinc-50 dark:bg-[#09090b] border border-gray-100 dark:border-zinc-800/50 hover:border-[#0071e3]/30 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${log.action.includes('ลบ') ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' : log.action.includes('แก้ไข') ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'}`}>
                          <ShieldCheck size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-[13px] font-bold text-zinc-900 dark:text-white truncate">{log.action}</p>
                            <span className="text-[10px] text-zinc-400 font-mono shrink-0 pt-0.5">{formatTime(log.created_at)}</span>
                          </div>
                          <p className="text-[12px] text-zinc-500 truncate mt-0.5">{log.details}</p>
                          <p className="text-[10px] text-[#0071e3] font-bold mt-1.5">By: {log.profiles?.first_name || 'System'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}