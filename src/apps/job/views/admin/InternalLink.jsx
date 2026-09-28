// src/apps/job/views/admin/InternalLink.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Link as LinkIcon, ExternalLink, GraduationCap, Facebook, 
  Code2, Lightbulb, MapPin, MonitorPlay, MessageSquare, BookOpen, Layers
} from 'lucide-react';
import 'animate.css';

export default function InternalLink() {
  const { activeRoom } = useOutletContext();
  const preventAction = (e) => e.preventDefault();

  // ข้อมูล Tip of the Week (คุณสามารถเปลี่ยนข้อความได้ตามต้องการ)
  const tipOfTheWeek = {
    title: "💡 Tip of the Week",
    content: "รู้หรือไม่? ใน VS Code คุณสามารถกดปุ่ม Ctrl + / (หรือ Cmd + / บน Mac) เพื่อคอมเมนต์โค้ดหลายๆ บรรทัดพร้อมกันได้อย่างรวดเร็ว!",
    author: "Admin Team"
  };

  // หมวดหมู่ลิงก์ต่างๆ
  const linkCategories = [
    {
      title: "🏫 ระบบของมหาวิทยาลัย (RMUTL)",
      icon: <GraduationCap className="w-5 h-5 text-orange-500" />,
      color: "hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/10",
      links: [
        { name: "ระบบทะเบียนนักศึกษา (SIS)", url: "https://regis.rmutl.ac.th/", desc: "ลงทะเบียนเรียน, ดูเกรด, พิมพ์ใบเสร็จ" },
        { name: "ระบบเรียนออนไลน์ (LMS)", url: "https://lms.rmutl.ac.th/", desc: "เข้าเรียนออนไลน์, โหลดสไลด์อาจารย์" },
        { name: "ปฏิทินการศึกษา", url: "https://arit.rmutl.ac.th/", desc: "ตรวจสอบวันสอบ, วันหยุดประจำปี" }
      ]
    },
    {
      title: "👥 คอมมูนิตี้และโซเชียล",
      icon: <Facebook className="w-5 h-5 text-blue-500" />,
      color: "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10",
      links: [
        { name: "กลุ่ม Facebook สาขา SE", url: "https://facebook.com/", desc: "พูดคุย, ประกาศข่าวสารภายในสาขา" },
        { name: "เพจ Facebook คณะวิศวะฯ", url: "https://facebook.com/", desc: "ติดตามข่าวกิจกรรมคณะวิศวกรรมศาสตร์" },
        { name: "Discord ประจำห้องเรียน", url: "https://discord.com/", desc: "ถาม-ตอบปัญหาโค้ด, พูดคุยโปรเจกต์" }
      ]
    },
    {
      title: "💻 เว็บไซต์ฝึกเขียนโค้ด (Coding Practice)",
      icon: <Code2 className="w-5 h-5 text-emerald-500" />,
      color: "hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
      links: [
        { name: "BorntoDev", url: "https://borntodev.com/", desc: "เรียนรู้การเขียนโปรแกรมภาษาไทย เข้าใจง่าย" },
        { name: "LeetCode", url: "https://leetcode.com/", desc: "ฝึกแก้โจทย์ Algorithm เตรียมตัวสัมภาษณ์งาน" },
        { name: "W3Schools", url: "https://www.w3schools.com/", desc: "คู่มืออ้างอิง Syntax พื้นฐาน (HTML, CSS, JS)" },
        { name: "Frontend Mentor", url: "https://www.frontendmentor.io/", desc: "ฝึกสร้างหน้าเว็บจริงจากโจทย์ Design" }
      ]
    },
    {
      title: "🛠️ เครื่องมือที่แนะนำ (Developer Tools)",
      icon: <Layers className="w-5 h-5 text-purple-500" />,
      color: "hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-500/10",
      links: [
        { name: "Roadmap.sh", url: "https://roadmap.sh/", desc: "แผนที่นำทางสำหรับ Developer ทุกสาย (เส้นทางอาชีพ)" },
        { name: "DevDocs", url: "https://devdocs.io/", desc: "รวม Official Documentation ทุกภาษาในหน้าเดียว" },
        { name: "Figma", url: "https://www.figma.com/", desc: "ออกแบบ UI/UX ก่อนเริ่มเขียนโค้ดจริง" }
      ]
    }
  ];

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="h-full pb-10 animate__animated animate__fadeIn max-w-6xl mx-auto select-none font-sans">
      
      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex items-center gap-4 shadow-sm transition-colors">
        <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm shrink-0">
          <LinkIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">รวมลิงก์ภายใน (Internal Links)</h1>
          <p className="text-sm text-zinc-500">รวมลิงก์สำคัญของมหาวิทยาลัย คอมมูนิตี้ และเครื่องมือสำหรับ {activeRoom.name}</p>
        </div>
      </div>

      {/* 💡 Tip of the Week Widget */}
      <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-700/50 rounded-[2rem] p-6 md:p-8 shadow-sm group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
          <Lightbulb className="w-32 h-32 text-amber-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="w-14 h-14 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-500 mb-1">{tipOfTheWeek.title}</h2>
            <p className="text-amber-900 dark:text-amber-100 font-medium leading-relaxed">{tipOfTheWeek.content}</p>
          </div>
        </div>
      </div>

      {/* Link Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {linkCategories.map((category, index) => (
          <div key={index} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800/80">
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-zinc-800">
                {category.icon}
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{category.title}</h2>
            </div>

            <div className="space-y-3 flex-1">
              {category.links.map((link, linkIndex) => (
                <a 
                  key={linkIndex}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-[#09090b]/50 transition-all duration-300 ${category.color}`}
                >
                  <div className="pr-4">
                    <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white mb-1 transition-colors">
                      {link.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{link.desc}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center shrink-0 opacity-50 group-hover:opacity-100 group-hover:shadow-sm transition-all group-hover:scale-110">
                    <ExternalLink className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
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