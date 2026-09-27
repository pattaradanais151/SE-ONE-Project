// src/apps/job/views/admin/InternalLink.jsx
import React from 'react';
import { 
  Link as LinkIcon, Database, Server, Code, TerminalSquare, Search, ExternalLink 
} from 'lucide-react';
import 'animate.css';

export default function InternalLink() {

  const preventAction = (e) => e.preventDefault();

  const internalLinks = [
    {
      category: 'Database & Backend',
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      links: [
        { name: 'Supabase Dashboard', url: 'https://supabase.com/dashboard', desc: 'จัดการฐานข้อมูล, Auth, Storage และ Edge Functions' },
        { name: 'Supabase SQL Editor', url: 'https://supabase.com/dashboard/project/_/sql', desc: 'รันคำสั่ง SQL และดูโครงสร้างตาราง' }
      ]
    },
    {
      category: 'Hosting & Deployment',
      icon: <Server className="w-5 h-5 text-zinc-900 dark:text-white" />,
      links: [
        { name: 'Vercel Dashboard', url: 'https://vercel.com/dashboard', desc: 'ดูสถานะการ Deploy และ Web Analytics', invertDark: true },
        { name: 'GitHub Repository', url: 'https://github.com', desc: 'จัดการ Source Code และ Version Control', invertDark: true }
      ]
    },
    {
      category: 'System Tools & APIs',
      icon: <TerminalSquare className="w-5 h-5 text-purple-500" />,
      links: [
        { name: 'Discord Webhook Docs', url: 'https://discord.com/developers/docs/resources/webhook', desc: 'เอกสารการตั้งค่าการแจ้งเตือน' },
        { name: 'Lucide Icons', url: 'https://lucide.dev/icons', desc: 'ไลบรารีไอคอนที่ใช้ในระบบทั้งหมด' }
      ]
    }
  ];

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="animate__animated animate__fadeIn select-none font-sans pb-10">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">รวมลิงก์ระบบภายใน (Internal Links)</h1>
            <p className="text-sm text-zinc-500">เส้นทางลัดสำหรับ Admin และ Developer เพื่อเข้าถึงเครื่องมือจัดการระบบ</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {internalLinks.map((section, index) => (
          <div key={index} className="animate__animated animate__fadeInUp" style={{ animationDelay: `${index * 0.1}s` }}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white mb-4 px-2">
              {section.icon} {section.category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {section.links.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="group flex flex-col justify-between p-6 bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[1.5rem] shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:-translate-y-1 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-[15px] group-hover:text-[#0071e3] transition-colors">{link.name}</h3>
                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center text-zinc-400 group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    {link.desc}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-[10px] font-mono opacity-50 truncate">{link.url}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}