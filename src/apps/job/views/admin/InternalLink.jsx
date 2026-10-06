// src/apps/job/views/admin/InternalLink.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../../shared/lib/supabase';
import * as LucideIcons from 'lucide-react'; 
import { 
  Lightbulb, Loader2, AlertCircle, X, ExternalLink, Link as LinkIcon,
  Plus, Edit2, Trash2, Save
} from 'lucide-react';
import 'animate.css';

export default function InternalLink() {
  const { activeRoom, userProfile } = useOutletContext();
  const [groupedLinks, setGroupedLinks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  // === Modal States สำหรับจัดการลิงก์ ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState(null); // null = โหมดสร้างใหม่, มีค่า = โหมดแก้ไข
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    icon: 'Link',
    category: 'external'
  });

  const preventAction = (e) => e.preventDefault();

  // เช็คสิทธิ์ (เฉพาะ Admin และ Super Admin เท่านั้นที่จัดการลิงก์ได้)
  const isAdmin = userProfile?.role === 'Admin' || userProfile?.role === 'Super Admin';

  const tipOfTheWeek = {
    title: "💡 Tip of the Week",
    content: "รู้หรือไม่? ใน VS Code คุณสามารถกดปุ่ม Ctrl + / (หรือ Cmd + / บน Mac) เพื่อคอมเมนต์โค้ดหลายๆ บรรทัดพร้อมกันได้อย่างรวดเร็ว!",
    author: "Admin Team"
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 4000);
  };

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('internal_links')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const grouped = data.reduce((acc, curr) => {
        const cat = curr.category || 'other';
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(curr);
        return acc;
      }, {});

      setGroupedLinks(grouped);
    } catch (error) {
      console.error('Error fetching internal links:', error);
      showToast(`โหลดข้อมูลล้มเหลว: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ฟังก์ชันจัดการข้อมูล (CRUD)
  // ==========================================
  const openAddModal = () => {
    setEditId(null);
    setFormData({ title: '', url: '', description: '', icon: 'Link', category: 'external' });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const openEditModal = (e, link) => {
    e.preventDefault(); // ป้องกันไม่ให้ทะลุไปเปิดลิงก์
    e.stopPropagation();
    setEditId(link.id);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      icon: link.icon || 'Link',
      category: link.category || 'external'
    });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editId) {
        // อัปเดตข้อมูล
        const { error } = await supabase.from('internal_links').update(formData).eq('id', editId);
        if (error) throw error;
        showToast('อัปเดตลิงก์สำเร็จ', 'success');
      } else {
        // สร้างใหม่
        const { error } = await supabase.from('internal_links').insert([formData]);
        if (error) throw error;
        showToast('เพิ่มลิงก์สำเร็จ', 'success');
      }
      closeModal();
      fetchLinks();
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('คุณยืนยันที่จะลบลิงก์นี้อย่างถาวรใช่หรือไม่?')) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('internal_links').delete().eq('id', editId);
      if (error) throw error;
      showToast('ลบลิงก์สำเร็จ', 'success');
      closeModal();
      fetchLinks();
    } catch (error) {
      showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ดึง Icon จากชื่อ String
  const DynamicIcon = ({ iconName, className }) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.LinkIcon;
    return <IconComponent className={className} />;
  };

  // สไตล์สำหรับ Category
  const getCategoryConfig = (categoryName) => {
    const config = {
      'internal': {
        title: "ระบบการจัดการภายใน (Internal)",
        icon: <LucideIcons.LayoutDashboard className="w-5 h-5 text-orange-500" />,
        color: "hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/10",
        border: "border-orange-100 dark:border-orange-900/30"
      },
      'external': {
        title: "แหล่งอ้างอิงและระบบภายนอก (External)",
        icon: <LucideIcons.Globe className="w-5 h-5 text-blue-500" />,
        color: "hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/10",
        border: "border-blue-100 dark:border-blue-900/30"
      },
      'default': {
        title: categoryName.toUpperCase(),
        icon: <LucideIcons.Layers className="w-5 h-5 text-emerald-500" />,
        color: "hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
        border: "border-emerald-100 dark:border-emerald-900/30"
      }
    };
    return config[categoryName.toLowerCase()] || config['default'];
  };

  return (
    <div onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} className="h-full pb-10 animate__animated animate__fadeIn max-w-6xl mx-auto select-none font-sans relative">
      
      {/* Toast Notification */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-full max-w-md px-4 pointer-events-none flex flex-col items-center">
        {toast.show && (
          <div className={`animate__animated animate__fadeInDown animate__faster w-full flex items-start gap-3 p-4 rounded-2xl shadow-xl pointer-events-auto border backdrop-blur-md
            ${toast.type === 'error' ? 'bg-red-50/95 dark:bg-red-950/90 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200' : 
              'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200'}`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <LucideIcons.CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>
            <button onClick={() => setToast({ show: false, message: '', type: 'error' })} className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Header Panel */}
      <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-50 dark:bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shadow-sm shrink-0">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">รวมลิงก์ภายใน (Internal Links)</h1>
            <p className="text-sm text-zinc-500">รวมลิงก์สำคัญของระบบ และเครื่องมือสำหรับ {activeRoom?.name || 'แอดมิน'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isAdmin && (
            <button 
              onClick={openAddModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> เพิ่มลิงก์ใหม่
            </button>
          )}
          <button 
            onClick={fetchLinks}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-zinc-600 dark:text-zinc-300 shrink-0"
            title="รีเฟรชข้อมูล"
          >
            <LucideIcons.RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#0071e3]" />
        </div>
      ) : Object.keys(groupedLinks).length === 0 ? (
        <div className="py-20 text-center text-zinc-500 border border-dashed border-gray-300 dark:border-zinc-800 rounded-[2rem] bg-white/50 dark:bg-[#121214]/50">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-bold">ยังไม่มีข้อมูลลิงก์ในระบบ</p>
        </div>
      ) : (
        /* Link Categories Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(groupedLinks).map((category, index) => {
            const config = getCategoryConfig(category);
            
            return (
              <div key={index} className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl border border-white dark:border-zinc-800/80 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800/80">
                  <div className={`p-2 rounded-xl bg-white dark:bg-black/40 border shadow-sm ${config.border}`}>
                    {config.icon}
                  </div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{config.title}</h2>
                </div>

                {/* แก้ไขระยะห่างตรงนี้ ใช้ flex-col และ gap-4 */}
                <div className="flex flex-col gap-4 flex-1">
                  {groupedLinks[category].map((link) => (
                    <a 
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group flex items-center justify-between p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-[#16161a] transition-all duration-300 hover:shadow-md ${config.color}`}
                    >
                      <div className="flex items-start gap-4 overflow-hidden pr-2">
                        <div className="mt-0.5 shrink-0 text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-white transition-colors bg-white dark:bg-[#25252b] p-2 rounded-lg border border-gray-200 dark:border-zinc-700/50 shadow-sm">
                          <DynamicIcon iconName={link.icon} className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col justify-center min-h-[36px]">
                          <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white mb-1 transition-colors leading-tight">
                            {link.title}
                          </h3>
                          <p className="text-[12px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-snug">{link.description || 'ไม่มีคำอธิบาย'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* ปุ่ม Edit สำหรับ Admin */}
                        {isAdmin && (
                          <button 
                            onClick={(e) => openEditModal(e, link)}
                            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-[#0071e3] hover:bg-blue-50 dark:hover:bg-[#0071e3]/20 transition-all hover:scale-105 shadow-sm"
                            title="แก้ไขลิงก์"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:shadow-sm transition-all group-hover:scale-110">
                          <ExternalLink className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* Modal เพิ่ม/แก้ไขลิงก์ */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate__animated animate__fadeIn animate__faster">
          <div className="bg-[#fbfbfd] dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate__animated animate__zoomIn animate__faster" onClick={e => e.stopPropagation()}>
            
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-[#16161a] shrink-0">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                {editId ? <Edit2 className="w-5 h-5 text-[#0071e3]" /> : <Plus className="w-5 h-5 text-[#0071e3]" />}
                {editId ? 'แก้ไขข้อมูลลิงก์' : 'เพิ่มลิงก์ใหม่'}
              </h2>
              <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSave} className="space-y-5">
                
                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">ชื่อลิงก์ (Title) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors shadow-sm"
                    placeholder="เช่น ระบบลงทะเบียน (SIS)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">URL <span className="text-red-500">*</span></label>
                  <input 
                    type="url" required value={formData.url} 
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors shadow-sm"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">รายละเอียด (Description)</label>
                  <input 
                    type="text" value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors shadow-sm"
                    placeholder="คำอธิบายสั้นๆ..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">หมวดหมู่ (Category)</label>
                    <select 
                      value={formData.category} 
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors shadow-sm cursor-pointer"
                    >
                      <option value="internal">ระบบภายใน (Internal)</option>
                      <option value="external">ระบบภายนอก (External)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                      <span>ไอคอน (Lucide)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                         <DynamicIcon iconName={formData.icon} className="w-4 h-4" />
                      </div>
                      <input 
                        type="text" value={formData.icon} 
                        onChange={e => setFormData({...formData, icon: e.target.value})}
                        className="w-full bg-white dark:bg-[#1e1e24] border border-gray-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#0071e3] transition-colors shadow-sm font-mono"
                        placeholder="e.g. Database, Users"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-3 pt-6 mt-4 border-t border-gray-200 dark:border-zinc-800">
                  {editId && (
                    <button 
                      type="button" 
                      onClick={handleDelete}
                      disabled={isSaving}
                      className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 transition-colors flex items-center justify-center"
                      title="ลบลิงก์นี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    type="button" 
                    onClick={closeModal} 
                    className="flex-1 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold transition-colors shadow-sm hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="flex-1 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white font-bold transition-colors shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                    บันทึกข้อมูล
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}