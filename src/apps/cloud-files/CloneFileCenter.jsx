import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';

export default function CloneFileCenter() {
  const navigate = useNavigate();
  
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auth/Unlock Folder State
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedFolderToUnlock, setSelectedFolderToUnlock] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Create Folder State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIsProtected, setNewFolderIsProtected] = useState(true);
  const [newFolderPassword, setNewFolderPassword] = useState('');
  const [createError, setCreateError] = useState('');

  // Delete Folder State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteFolderPassword, setDeleteFolderPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Policy Modals State
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoType, setInfoType] = useState('');

  // Upload State & Refs
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
/*
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
*/
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    const { data, error } = await supabase
      .from('private_folders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setFolders(data);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/cloudfiles/login');
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!newFolderName.trim()) {
      setCreateError('กรุณาตั้งชื่อโฟลเดอร์');
      return;
    }
    if (newFolderIsProtected && !newFolderPassword) {
      setCreateError('กรุณาตั้งรหัสผ่านสำหรับโฟลเดอร์นี้');
      return;
    }

    const { data, error } = await supabase
      .from('private_folders')
      .insert([
        {
          owner_id: currentUser.id,
          folder_name: newFolderName.trim(),
          is_protected: newFolderIsProtected,
          folder_password: newFolderIsProtected ? newFolderPassword : null,
        }
      ])
      .select();

    if (error) {
      setCreateError('เกิดข้อผิดพลาดในการสร้างโฟลเดอร์');
    } else if (data) {
      setFolders([data[0], ...folders]);
      setShowCreateModal(false);
      setNewFolderName('');
      setNewFolderPassword('');
      setNewFolderIsProtected(true);
    }
  };

  const handleDeleteClick = (e, folder) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setDeleteEmail('');
    setDeleteAccountPassword('');
    setDeleteFolderPassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const submitDeleteFolder = async (e) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);

    let finalEmail = deleteEmail.trim();
    if (finalEmail && !finalEmail.includes('@')) {
      finalEmail += '@se-rmutl.com';
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: finalEmail,
      password: deleteAccountPassword,
    });

    if (authError || authData?.user?.id !== currentUser.id) {
      setDeleteError('ชื่อผู้ใช้หรือรหัสผ่านบัญชีไม่ถูกต้อง');
      setIsDeleting(false);
      return;
    }

    if (folderToDelete.is_protected) {
      const { data: folderData } = await supabase
        .from('private_folders')
        .select('id')
        .eq('id', folderToDelete.id)
        .eq('folder_password', deleteFolderPassword)
        .single();

      if (!folderData) {
        setDeleteError('รหัสผ่านของโฟลเดอร์นี้ไม่ถูกต้อง');
        setIsDeleting(false);
        return;
      }
    }

    const { error: deleteErr } = await supabase
      .from('private_folders')
      .delete()
      .eq('id', folderToDelete.id);

    if (deleteErr) {
      setDeleteError('เกิดข้อผิดพลาดในการลบโฟลเดอร์');
    } else {
      setFolders(folders.filter(f => f.id !== folderToDelete.id));
      setShowDeleteModal(false);
      setFolderToDelete(null);
    }
    setIsDeleting(false);
  };

  const handleFolderClick = (folder) => {
    if (folder.owner_id === currentUser?.id || !folder.is_protected) {
      openFolder(folder);
    } else {
      setSelectedFolderToUnlock(folder);
      setShowAuthModal(true);
    }
  };

  const handleUnlockFolder = async (e) => {
    e.preventDefault();
    setAuthError('');

    const { data, error } = await supabase
      .from('private_folders')
      .select('id')
      .eq('id', selectedFolderToUnlock.id)
      .eq('folder_password', passwordInput)
      .single();

    if (data) {
      setShowAuthModal(false);
      setPasswordInput('');
      openFolder(selectedFolderToUnlock);
    } else {
      setAuthError('รหัสผ่านไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง');
    }
  };

  const openFolder = async (folder) => {
    setCurrentFolder(folder);
    const { data, error } = await supabase
      .from('folder_files')
      .select('*')
      .eq('folder_id', folder.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setFiles(data);
    }
  };

  const handleBack = () => {
    setCurrentFolder(null);
    setFiles([]);
  };

  const getAvatarUrl = () => {
    return currentUser?.user_metadata?.avatar_url || 
           `https://ui-avatars.com/api/?name=${currentUser?.email || 'User'}&background=0071e3&color=fff`;
  };

  const handleFileUpload = async (eventOrFiles) => {
    let selectedFiles = [];
    if (eventOrFiles.target && eventOrFiles.target.files) {
      selectedFiles = Array.from(eventOrFiles.target.files);
    } else if (Array.isArray(eventOrFiles)) {
      selectedFiles = eventOrFiles;
    }

    if (!selectedFiles.length || !currentFolder) return;
    
    setIsUploading(true);

    for (const file of selectedFiles) {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${currentFolder.id}/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('cloud_files')
        .upload(filePath, file);

      if (uploadError) {
        alert(`อัปโหลดไฟล์ ${file.name} ไม่สำเร็จ`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('cloud_files')
        .getPublicUrl(filePath);

      const { data: dbData, error: dbError } = await supabase
        .from('folder_files')
        .insert([
          {
            folder_id: currentFolder.id,
            file_name: file.name,
            file_url: publicUrlData.publicUrl,
            file_size: file.size,
            uploaded_by: currentUser.id
          }
        ])
        .select();

      if (!dbError && dbData) {
        setFiles(prev => [dbData[0], ...prev]);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (currentFolder) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (currentFolder && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleDeleteFile = async (e, file) => {
  e.preventDefault();
  
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ "${file.file_name}"?`)) return;

  // 1. ดึง Path ของไฟล์จาก URL (เพื่อเอาไปบอกให้ Storage ลบให้ถูกตัว)
  // URL ปกติจะเป็น .../storage/v1/object/public/cloud_files/folder_id/filename.ext
  const urlParts = file.file_url.split('cloud_files/');
  const filePath = urlParts.length > 1 ? urlParts[1] : null;

  if (filePath) {
    // ลบไฟล์ออกจาก Storage
    const { error: storageError } = await supabase.storage
      .from('cloud_files')
      .remove([filePath]);
      
    if (storageError) {
      alert('เกิดข้อผิดพลาดในการลบไฟล์จากพื้นที่จัดเก็บ');
      return;
    }
  }

  // 2. ลบข้อมูลไฟล์ออกจาก Database
  const { error: dbError } = await supabase
    .from('folder_files')
    .delete()
    .eq('id', file.id);

  if (dbError) {
    alert('เกิดข้อผิดพลาดในการลบประวัติไฟล์');
  } else {
    // อัปเดตหน้าจอให้ไฟล์หายไปทันที
    setFiles(files.filter(f => f.id !== file.id));
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-zinc-900">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#0071e3]"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-gray-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 select-none transition-colors duration-300"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Top Navbar */}
      <header className="bg-white dark:bg-zinc-800 shadow-sm border-b border-gray-200 dark:border-zinc-700 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleBack()}>
            <img 
              src="/SE-Cloud-Logo.png" 
              alt="Logo" 
              className="h-8 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          
          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 4.22a1 1 0 011.415 0l.708.708a1 1 0 01-1.414 1.414l-.708-.708a1 1 0 010-1.414zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-4.22 4.22a1 1 0 010 1.415l-.708.708a1 1 0 01-1.414-1.414l.708-.708a1 1 0 011.414 0zM11 17a1 1 0 10-2 0v1a1 1 0 102 0v-1zm-4.22-4.22a1 1 0 01-1.415 0l-.708-.708a1 1 0 011.414-1.414l.708.708a1 1 0 010 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1zM5.78 6.636a1 1 0 010-1.415l.708-.708a1 1 0 111.414 1.414l-.708.708a1 1 0 01-1.414 0z"/><path d="M10 5a5 5 0 100 10 5 5 0 000-10z"/></svg>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isDarkMode}
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#0071e3]"></div>
              </label>
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-zinc-700">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'User'}</p>
                <p className="text-xs text-[#00a86b]">Online</p>
              </div>
              <img 
                src={getAvatarUrl()} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-2 border-[#0071e3] object-cover shadow-sm"
              />
              <button 
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="ออกจากระบบ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              คลังโฟลเดอร์ทั้งหมด
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              เข้าถึงโฟลเดอร์ส่วนตัวและโฟลเดอร์ที่แชร์ในระบบ
            </p>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            {!currentFolder && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-lg shadow-md hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                สร้างโฟลเดอร์ใหม่
              </button>
            )}
          </div>
        </div>

        {/* Folders Display */}
        {!currentFolder ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {folders.map((folder) => {
              const isOwner = folder.owner_id === currentUser?.id;
              
              // ใช้รูปโฟลเดอร์แบบที่ 3 (สีเหลืองสำหรับตัวเอง / ลูกโลกสำหรับล็อค)[cite: 10, 11]
              const folderImgSrc = isOwner
                ? 'https://cdn-icons-png.flaticon.com/512/716/716784.png' // Folder สีเหลือง
                : 'https://cdn-icons-png.flaticon.com/512/1054/1054984.png'; // Folder ลูกโลก หรือ แบบแชร์
                
              return (
                <div 
                  key={folder.id} 
                  onClick={() => handleFolderClick(folder)}
                  className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-gray-100 dark:border-zinc-700 group flex flex-col items-center text-center relative overflow-hidden"
                >
                  {isOwner && (
                    <button 
                      onClick={(e) => handleDeleteClick(e, folder)}
                      className="absolute top-3 right-3 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      title="ลบโฟลเดอร์"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}

                  <div className="w-20 h-20 mb-4 group-hover:-translate-y-1 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                    <img src={folderImgSrc} alt="Folder Icon" className="w-full h-full object-contain drop-shadow-sm" />
                  </div>
                  
                  <h3 className="font-semibold text-lg truncate w-full px-2">{folder.folder_name}</h3>
                  
                  <div className={`mt-3 text-xs font-medium px-4 py-1.5 rounded-full flex items-center gap-1 ${
                    isOwner ? 'bg-blue-50 text-[#0071e3] dark:bg-blue-900/40 dark:text-blue-300' 
                            : 'bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300'
                  }`}>
                    {isOwner ? (
                      <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.984 3.984 0 01-2.659-.997 1 1 0 00-1.342 0A3.984 3.984 0 018.341 15a3.984 3.984 0 01-2.659-.997 1 1 0 00-1.342 0A3.984 3.984 0 011.683 15 1 1 0 011.4 13.95l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L8.354 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274zm-5-2.046l2.503 1.001A3.981 3.981 0 0012.341 11a3.981 3.981 0 00-2.341-1.771V8.228zM10 17a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd"/></svg> โฟลเดอร์ของฉัน</>
                    ) : (
                      <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg> ติดล็อครหัสผ่าน</>
                    )}
                  </div>
                </div>
              );
            })}
            
            {folders.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white dark:bg-zinc-800 rounded-2xl border border-dashed border-gray-300 dark:border-zinc-700">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
                <p className="text-gray-500 dark:text-gray-400">ยังไม่มีโฟลเดอร์ในระบบ คลิกสร้างโฟลเดอร์ใหม่ได้เลย</p>
              </div>
            )}
          </div>
        ) : (
          <div 
            className={`flex-grow bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border overflow-hidden transition-all duration-200 flex flex-col relative
              ${isDragActive ? 'border-[#0071e3] border-2 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.01]' : 'border-gray-100 dark:border-zinc-700'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Header ของไฟล์ด้านใน */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-700">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                {currentFolder.folder_name}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  disabled={isUploading}
                  className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? 'กำลังอัปโหลด...' : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg> อัปโหลด</>}
                </button>
              </div>
            </div>

            {isDragActive && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm pointer-events-none">
                <div className="text-center">
                  <div className="text-[#0071e3] mb-4 flex justify-center">
                    <svg className="w-16 h-16 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0071e3]">ปล่อยไฟล์เพื่ออัปโหลดทันที</h3>
                </div>
              </div>
            )}

            {files.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-zinc-700 flex-grow overflow-y-auto">
                {files.map(file => (
                  <li key={file.id} className="p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4 overflow-hidden w-full">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-blue-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>
                      </div>
                      <div className="truncate">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          อัปโหลดเมื่อ: {new Date(file.created_at).toLocaleString('th-TH')}
                          {file.file_size && ` • ${(file.file_size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                        <a 
                            href={file.file_url} 
                            target="_blank" 
                             rel="noopener noreferrer"
                            className="flex-1 sm:flex-none text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                ดาวน์โหลด
                            </a>

                            {/* แสดงปุ่มลบเฉพาะเจ้าของไฟล์ หรือ เจ้าของโฟลเดอร์ */}
                                    {(file.uploaded_by === currentUser?.id || currentFolder?.owner_id === currentUser?.id) && (
                                <button 
                         onClick={(e) => handleDeleteFile(e, file)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-lg transition-colors"
                     title="ลบไฟล์"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
               </button>
             )}
                </div>
                          
                  </li>
                ))}
              </ul>
            ) : (
              <div 
                className="flex flex-col items-center justify-center flex-grow py-24 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => fileInputRef.current.click()}
              >
                <div className="bg-gray-100 dark:bg-zinc-700 p-4 rounded-full mb-4 text-gray-400 dark:text-gray-500">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">ลากไฟล์มาวางที่นี่</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์ของคุณ</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 py-6 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} SE-Work Cloud File Center. All rights reserved.</p>
          <div className="flex gap-4">
            <span 
              onClick={() => { setInfoType('privacy'); setShowInfoModal(true); }}
              className="hover:text-[#0071e3] cursor-pointer transition-colors"
            >
              Privacy Policy
            </span>
            <span 
              onClick={() => { setInfoType('terms'); setShowInfoModal(true); }}
              className="hover:text-[#0071e3] cursor-pointer transition-colors"
            >
              Terms of Service
            </span>
            <span 
              onClick={() => { setInfoType('support'); setShowInfoModal(true); }}
              className="hover:text-[#0071e3] cursor-pointer transition-colors"
            >
              Support
            </span>
          </div>
        </div>
      </footer>

      {/* ----------------- MODALS ----------------- */}

      {/* Modal: Unlock Folder */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-[#0071e3]">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ยืนยันตัวตน 2 ชั้น</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                กรุณากรอกรหัสผ่านเพื่อเข้าถึงโฟลเดอร์ <br/><span className="font-semibold text-[#0071e3]">"{selectedFolderToUnlock?.folder_name}"</span>
              </p>
            </div>
            
            <form onSubmit={handleUnlockFolder}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white rounded-xl px-4 py-3 mb-2 focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all text-center tracking-widest font-mono"
                placeholder="••••••••"
                autoFocus
                required
              />
              <div className="h-6 mb-4">
                {authError && <p className="text-red-500 text-xs font-medium text-center">{authError}</p>}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setPasswordInput('');
                    setAuthError('');
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-colors shadow-md shadow-blue-500/20"
                >
                  ปลดล็อค
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Folder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-zinc-700 animate-in fade-in zoom-in duration-200">
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-[#0071e3]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">สร้างโฟลเดอร์ใหม่</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">พื้นที่จัดเก็บไฟล์ส่วนตัวของคุณ</p>
              </div>
            </div>
            
            <form onSubmit={handleCreateFolder}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ชื่อโฟลเดอร์</label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                    placeholder="เช่น เอกสารโปรเจกต์ A"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-4 bg-gray-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                  <input
                    type="checkbox"
                    id="isProtected"
                    checked={newFolderIsProtected}
                    onChange={(e) => setNewFolderIsProtected(e.target.checked)}
                    className="w-4 h-4 text-[#0071e3] bg-gray-100 border-gray-300 rounded focus:ring-[#0071e3]"
                  />
                  <label htmlFor="isProtected" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    ล็อครหัสผ่านโฟลเดอร์นี้ (แนะนำ)
                  </label>
                </div>

                {newFolderIsProtected && (
                  <div className="animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ตั้งรหัสผ่านโฟลเดอร์</label>
                    <input
                      type="password"
                      value={newFolderPassword}
                      onChange={(e) => setNewFolderPassword(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                      placeholder="รหัสสำหรับปลดล็อคโฟลเดอร์..."
                      required={newFolderIsProtected}
                    />
                  </div>
                )}
              </div>

              <div className="h-6 mt-2">
                {createError && <p className="text-red-500 text-xs font-medium">{createError}</p>}
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFolderName('');
                    setNewFolderPassword('');
                    setCreateError('');
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-colors"
                >
                  สร้างโฟลเดอร์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Folder (3-Layer Authentication) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in duration-200">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ยืนยันการลบโฟลเดอร์</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                คุณกำลังจะลบ <span className="font-semibold text-red-500">"{folderToDelete?.folder_name}"</span><br/>โปรดยืนยันข้อมูลทั้งหมดเพื่อดำเนินการ
              </p>
            </div>
            
            <form onSubmit={submitDeleteFolder}>
              <div className="space-y-3">
                <input
                  type="text"
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="ชื่อผู้ใช้ หรือ อีเมลบัญชี"
                  required
                />
                <input
                  type="password"
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="รหัสผ่านเข้าบัญชี SE-Work"
                  required
                />
                {folderToDelete?.is_protected && (
                  <input
                    type="password"
                    value={deleteFolderPassword}
                    onChange={(e) => setDeleteFolderPassword(e.target.value)}
                    className="w-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-red-400"
                    placeholder="รหัสผ่านปลดล็อคโฟลเดอร์"
                    required
                  />
                )}
              </div>

              <div className="h-6 mt-3">
                {deleteError && <p className="text-red-500 text-xs font-medium text-center">{deleteError}</p>}
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-xl font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? 'กำลังลบ...' : 'ลบโฟลเดอร์ถาวร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Info (Privacy, Terms, Support) */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-zinc-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {infoType === 'privacy' ? 'Privacy Policy' : infoType === 'terms' ? 'Terms of Service' : 'Support'}
              </h2>
              <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-400 max-h-[60vh] overflow-y-auto pr-2">
              {infoType === 'privacy' && (
                <>
                  <p><strong>นโยบายความเป็นส่วนตัว (Privacy Policy)</strong></p>
                  <p>เราให้ความสำคัญกับความเป็นส่วนตัวของข้อมูลผู้ใช้งาน ไฟล์ทั้งหมดที่ถูกอัปโหลดจะถูกเก็บรักษาไว้อย่างปลอดภัยผ่านระบบ SE-Work Cloud</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>ข้อมูลส่วนบุคคลจะไม่ถูกนำไปเผยแพร่หรือขายให้กับบุคคลที่สาม</li>
                    <li>โฟลเดอร์ที่ตั้งรหัสผ่านจะถูกจำกัดสิทธิ์การเข้าถึงอย่างเคร่งครัด</li>
                    <li>เราจะเก็บรักษาไฟล์ของท่านจนกว่าจะมีการร้องขอให้ลบโดยเจ้าของข้อมูล</li>
                  </ul>
                </>
              )}
              {infoType === 'terms' && (
                <>
                  <p><strong>ข้อตกลงและเงื่อนไข (Terms of Service)</strong></p>
                  <p>การใช้งานระบบ Cloud File Center ผู้ใช้ต้องยินยอมปฏิบัติตามกฎกติกาต่อไปนี้:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>ห้ามอัปโหลดไฟล์ที่ละเมิดลิขสิทธิ์ ผิดกฎหมาย หรือขัดต่อศีลธรรมอันดี</li>
                    <li>ผู้ใช้งานต้องรับผิดชอบต่อไฟล์และการรักษาความปลอดภัยของรหัสผ่านโฟลเดอร์ตนเอง</li>
                    <li>ทีมงานขอสงวนสิทธิ์ในการตรวจสอบและลบไฟล์ที่ผิดกฎหมายโดยไม่ต้องแจ้งให้ทราบล่วงหน้า</li>
                  </ul>
                </>
              )}
              {infoType === 'support' && (
                <>
                  <p><strong>ติดต่อสอบถาม (Support)</strong></p>
                  <p>หากพบปัญหาในการใช้งานระบบ ไม่สามารถเข้าถึงไฟล์ หรือต้องการแจ้งปัญหาเกี่ยวกับการทำงานของระบบ สามารถติดต่อทีมพัฒนาได้ตามช่องทางด้านล่าง:</p>
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    <p className="font-medium text-gray-800 dark:text-gray-200">SE-Work Support Team</p>
                    <p className="mt-1">อีเมล: support@se-rmutl.com</p>
                    <p>เวลาทำการ: วันจันทร์ - ศุกร์ (09:00 - 17:00 น.)</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}