// src/apps/portfolio/PortfolioApp.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2 } from 'lucide-react';

export default function PortfolioApp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white p-6 transition-colors duration-500 font-sans">
      
      {/* ปุ่มกลับ */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-full text-sm font-semibold hover:scale-105 transition-transform shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
      </button>

      {/* เนื้อหาชั่วคราว */}
      <div className="text-center flex flex-col items-center animate__animated animate__fadeInUp">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-8 border border-blue-100 dark:border-blue-800/50 shadow-sm">
          <Code2 className="w-10 h-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Dev Portfolio
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-md">
          หน้านี้กำลังอยู่ระหว่างการพัฒนา... <br/>
          เตรียมพบกับผลงานและโปรเจกต์เร็วๆ นี้
        </p>
        
        <div className="mt-8 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full text-xs font-mono text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50">
          Status: In Development 🚀
        </div>
      </div>

    </div>
  );
}