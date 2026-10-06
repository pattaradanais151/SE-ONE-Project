// src/apps/job/views/PDPAPolicyLA.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2, Globe } from 'lucide-react';
import SEO from '../../../components/seo/SEO';
import BreadcrumbsJsonLd from '../../../components/seo/BreadcrumbsJsonLd';
import 'animate.css';

export default function PDPAPolicyLA() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'pdpa' | 'license'
  const [currentLang, setCurrentLang] = useState('th');

  // ระบบ Anti-Copy
  const preventAction = (e) => e.preventDefault();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // --- Translation System ---
  const translations = {
    th: {
      backToHome: "กลับสู่หน้าหลัก",
      privacyTab: "Privacy Policy",
      pdpaTab: "PDPA (พ.ร.บ. คุ้มครองข้อมูล)",
      licenseTab: "License Agreements",
      lastUpdate: "อัปเดตล่าสุด: 18 กันยายน 2569 • Software Engineering RMUTL Gen 4",
      footerNote: "หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการใช้สิทธิ์ตามกฎหมาย PDPA กรุณาติดต่อผู้พัฒนา: Pattaradanai Saiwongkham (Admin / Developer)",
      allRights: "All rights reserved.",
      privacyTitle: "นโยบายความเป็นส่วนตัว (Privacy Policy)",
      privacySec1Title: "1. การเก็บรวบรวมข้อมูลส่วนบุคคล",
      privacySec1Desc: "ระบบ SE-Portal ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้งานทุกคน เรามีการเก็บรวบรวมข้อมูลเมื่อท่านสมัครสมาชิก เข้าสู่ระบบ เช่น ชื่อ-นามสกุล, อีเมลสถาบัน, เบอร์โทรศัพท์, และ IP Address",
      privacySec2Title: "2. วัตถุประสงค์ในการใช้ข้อมูล",
      privacySec2L1: "เพื่อยืนยันตัวตนและจัดการสิทธิ์การเข้าถึงระบบตามรายวิชาและห้องเรียน",
      privacySec2L2: "เพื่อติดตามสถานะการส่งงาน แจ้งเตือนกำหนดส่ง และแสดงผลในกระดานคะแนน",
      privacySec2L3: "เพื่อความปลอดภัยทางไซเบอร์ ตรวจสอบ Log การใช้งาน และป้องกันการบุกรุกระบบ",
      privacySec3Title: "3. การเปิดเผยข้อมูลแก่บุคคลภายนอก",
      privacySec3Desc: "ข้อมูลของท่านจะถูกเก็บรักษาเป็นความลับสูงสุด เราไม่มีนโยบายขายหรือเปิดเผยข้อมูลส่วนบุคคลของท่านให้กับบุคคลภายนอก เว้นแต่เป็นไปตามข้อกำหนดทางกฎหมาย",
      pdpaTitle: "นโยบายการคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
      pdpaSec1Title: "สิทธิของเจ้าของข้อมูลส่วนบุคคล",
      pdpaSec1Desc: "ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิ์ดังนี้:",
      pdpaSec1L1B: "สิทธิ์ในการขอเข้าถึงและรับสำเนาข้อมูล:",
      pdpaSec1L1D: " ท่านสามารถตรวจสอบข้อมูลโปรไฟล์และการส่งงานของตนเองได้ตลอดเวลา",
      pdpaSec1L2B: "สิทธิ์ในการขอแก้ไขข้อมูล:",
      pdpaSec1L2D: " ท่านสามารถติดต่อแอดมินหรืออัปเดตข้อมูลผ่านหน้าตั้งค่าได้ทันที",
      pdpaSec1L3B: "สิทธิ์ในการลบหรือทำลายข้อมูล:",
      pdpaSec1L3D: " ท่านมีสิทธิ์ขอให้ระงับการใช้งานหรือลบบัญชีออกจากระบบเมื่อสิ้นสุดสถานะการศึกษา",
      pdpaSec1L4B: "สิทธิ์ในการถอนความยินยอม:",
      pdpaSec1L4D: " ท่านสามารถยกเลิกการให้ความยินยอมในการเก็บข้อมูลได้ผ่านการติดต่อผู้ดูแลระบบ",
      pdpaSec2Title: "มาตรการรักษาความปลอดภัยของข้อมูล",
      pdpaSec2Desc: "เราใช้ระบบฐานข้อมูลที่มีความปลอดภัยสูงผ่าน Supabase พร้อมระบบเข้ารหัสรหัสผ่านและการจำกัดสิทธิ์ (RLS) เพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต",
      licenseTitle: "ข้อตกลงการอนุญาตใช้สิทธิ์ (License Agreements)",
      licenseSec1Title: "ข้อกำหนดการใช้งานระบบ (Terms of Use)",
      licenseSec1Desc: "ระบบ SE-Portal พัฒนาขึ้นโดย Pattaradanai Saiwongkham เพื่อใช้เป็นเครื่องมือจัดการการเรียนการสอนภายในสาขาวิชาเท่านั้น",
      licenseSec2Title: "ข้อจำกัดความรับผิดชอบ",
      licenseSec2L1: "ระบบนี้ให้บริการในลักษณะ \"ตามสภาพ\" ผู้พัฒนาจะไม่รับผิดชอบต่อความเสียหายจากการขัดข้องของเซิร์ฟเวอร์ หรือการสูญหายของข้อมูลจากการกระทำของผู้ใช้",
      licenseSec2L2: "ห้ามมิให้ผู้ใดคัดลอก ดัดแปลง แฮก หรือนำซอร์สโค้ดไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาต"
    },
    en: {
      backToHome: "Return to Home",
      privacyTab: "Privacy Policy",
      pdpaTab: "PDPA Policy",
      licenseTab: "License Agreements",
      lastUpdate: "Last Updated: September 18, 2026 • SE RMUTL Gen 4",
      footerNote: "For questions regarding privacy or PDPA rights, please contact the developer.",
      allRights: "All rights reserved.",
      privacyTitle: "Privacy Policy",
      privacySec1Title: "1. Personal Data Collection",
      privacySec1Desc: "The SE-Portal system values your privacy. We collect data when you register/login (e.g., Name, Email, Phone, IP Address).",
      privacySec2Title: "2. Purpose of Data Usage",
      privacySec2L1: "To verify identity and manage system access privileges.",
      privacySec2L2: "To track submission statuses and display results on the Leaderboard.",
      privacySec2L3: "For cybersecurity and audit access logs.",
      privacySec3Title: "3. Data Disclosure",
      privacySec3Desc: "Your data is kept strictly confidential. We do not sell or disclose data to third parties.",
      pdpaTitle: "Personal Data Protection Policy (PDPA)",
      pdpaSec1Title: "Rights of the Data Subject",
      pdpaSec1Desc: "Under the PDPA, you have the following rights:",
      pdpaSec1L1B: "Right to Access:",
      pdpaSec1L1D: " Check your profile and submission data at any time.",
      pdpaSec1L2B: "Right to Rectification:",
      pdpaSec1L2D: " Update inaccurate data via settings.",
      pdpaSec1L3B: "Right to Erasure:",
      pdpaSec1L3D: " Request account deletion upon graduation.",
      pdpaSec1L4B: "Right to Withdraw Consent:",
      pdpaSec1L4D: " Revoke consent for data collection.",
      pdpaSec2Title: "Data Security",
      pdpaSec2Desc: "We use highly secure databases via Supabase (PostgreSQL) with Row Level Security (RLS).",
      licenseTitle: "License Agreements",
      licenseSec1Title: "Terms of Use",
      licenseSec1Desc: "The SE-Portal was developed by Pattaradanai Saiwongkham for educational management within the department.",
      licenseSec2Title: "Disclaimer",
      licenseSec2L1: "Provided 'As-Is'. The developers are not liable for data loss or outages.",
      licenseSec2L2: "Unauthorized copying or commercial use is strictly prohibited."
    }
  };

  const t = (key) => translations[currentLang]?.[key] || translations['en'][key] || key;

  return (
    <>
      <SEO 
        title="Privacy Policy & PDPA | SE-ONE" 
        description="นโยบายความเป็นส่วนตัว พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) และข้อตกลงการอนุญาตใช้สิทธิ์"
        url="/pdpa"
      />
      <BreadcrumbsJsonLd 
        items={[
          { name: "Home", path: "/" },
          { name: "Legal & PDPA", path: "/pdpa" }
        ]}
      />
      <div 
        onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
        className="min-h-screen w-full flex flex-col bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 select-none overflow-y-auto overflow-x-hidden"
      >
        <style>{`
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(134, 134, 139, 0.4); border-radius: 10px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(134, 134, 139, 0.8); }
        `}</style>

        {/* Navbar */}
        <nav className="sticky top-0 z-50 w-full px-6 h-20 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/70 backdrop-blur-xl shrink-0">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">{t('backToHome')}</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Main Tabs (Desktop) */}
            <div className="hidden lg:flex items-center bg-gray-100 dark:bg-white/10 p-1 rounded-full border border-transparent">
              {['privacy', 'pdpa', 'license'].map(tab => (
                <button 
                  key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === tab ? 'bg-white dark:bg-[#333] shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  {t(`${tab}Tab`)}
                </button>
              ))}
            </div>

            {/* Language */}
            <div className="flex items-center bg-gray-100 dark:bg-white/10 p-1 rounded-full">
              {['th', 'en'].map(l => (
                <button key={l} onClick={() => setCurrentLang(l)} className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all uppercase ${currentLang === l ? 'bg-white dark:bg-[#333] shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  {l}
                </button>
              ))}
            </div>

            <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shadow-sm active:scale-95 border border-gray-200 dark:border-white/10">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        {/* Mobile Tabs */}
        <div className="lg:hidden w-full px-4 py-4 flex justify-center shrink-0">
          <div className="flex items-center bg-gray-100 dark:bg-white/10 p-1 rounded-xl w-full">
            {['privacy', 'pdpa', 'license'].map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2 text-[11px] font-bold rounded-lg transition-all text-center ${activeTab === tab ? 'bg-white dark:bg-[#333] shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-white'}`}
              >
                {tab === 'privacy' ? 'Privacy' : tab === 'pdpa' ? 'PDPA' : 'License'}
              </button>
            ))}
          </div>
        </div>

        <main className="w-full max-w-4xl mx-auto px-6 py-8 md:py-12 flex-1 animate__animated animate__fadeIn shrink-0">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-[#0071e3]/10 text-[#0071e3] border border-blue-100 dark:border-[#0071e3]/20 mb-4 shadow-sm">
              {activeTab === 'privacy' && <Lock className="w-8 h-8" />}
              {activeTab === 'pdpa' && <ShieldCheck className="w-8 h-8" />}
              {activeTab === 'license' && <FileText className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2">
              {t(`${activeTab}Title`)}
            </h1>
            <p className="text-[11px] md:text-sm text-gray-500 dark:text-gray-400">
              {t('lastUpdate')}
            </p>
          </div>

          <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] space-y-8 leading-relaxed text-[14px] md:text-[15px]">
            
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate__animated animate__fadeIn">
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#0071e3] shrink-0" /> {t('privacySec1Title')}</h2>
                  <p>{t('privacySec1Desc')}</p>
                </section>
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#0071e3] shrink-0" /> {t('privacySec2Title')}</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('privacySec2L1')}</li><li>{t('privacySec2L2')}</li><li>{t('privacySec2L3')}</li>
                  </ul>
                </section>
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#0071e3] shrink-0" /> {t('privacySec3Title')}</h2>
                  <p>{t('privacySec3Desc')}</p>
                </section>
              </div>
            )}

            {activeTab === 'pdpa' && (
              <div className="space-y-6 animate__animated animate__fadeIn">
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-start sm:items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pdpaSec1Title')}</h2>
                  <p>{t('pdpaSec1Desc')}</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>{t('pdpaSec1L1B')}</strong> {t('pdpaSec1L1D')}</li>
                    <li><strong>{t('pdpaSec1L2B')}</strong> {t('pdpaSec1L2D')}</li>
                    <li><strong>{t('pdpaSec1L3B')}</strong> {t('pdpaSec1L3D')}</li>
                    <li><strong>{t('pdpaSec1L4B')}</strong> {t('pdpaSec1L4D')}</li>
                  </ul>
                </section>
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" /> {t('pdpaSec2Title')}</h2>
                  <p>{t('pdpaSec2Desc')}</p>
                </section>
              </div>
            )}

            {activeTab === 'license' && (
              <div className="space-y-6 animate__animated animate__fadeIn">
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500 shrink-0" /> {t('licenseSec1Title')}</h2>
                  <p>{t('licenseSec1Desc')}</p>
                </section>
                <section className="space-y-3">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500 shrink-0" /> {t('licenseSec2Title')}</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>{t('licenseSec2L1')}</li><li>{t('licenseSec2L2')}</li>
                  </ul>
                </section>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 text-[11px] md:text-xs text-gray-500 font-mono leading-relaxed">
              {t('footerNote')}
            </div>
          </div>
        </main>

        <footer className="w-full text-center py-6 border-t border-gray-200 dark:border-white/10 shrink-0 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Pattaradanai Saiwongkham. {t('allRights')}</p>
        </footer>
      </div>
    </>
  );
}