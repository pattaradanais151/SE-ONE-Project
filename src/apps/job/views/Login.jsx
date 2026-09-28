// src/apps/job/views/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { 
  ArrowLeft, Sun, Moon, 
  Eye, EyeOff, User, Lock, ShieldCheck, Zap, Loader2
} from 'lucide-react';
import 'animate.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🌓 ระบบจำ Theme ผ่าน localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ------------------------------------------
  // 🛡️ Security & Theme Setup
  // ------------------------------------------
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    // Check URL queries (Timeout & Banned Check)
    const params = new URLSearchParams(location.search);
    if (params.get('timeout')) setErrorMessage('เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่');
    if (params.get('banned')) setErrorMessage('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }, [location]);

  const toggleTheme = () => setIsDark(!isDark);
  const preventAction = (e) => e.preventDefault();

  // ------------------------------------------
  // 🚀 Login Logic
  // ------------------------------------------
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      let loginEmail = username.trim();
      // Auto-append email domain if not provided
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail}@se-rmutl.com`;
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, role, is_banned_until')
        .eq('id', authData.user.id)
        .single();

      if (profile?.is_banned_until && new Date(profile.is_banned_until) > new Date()) {
        await supabase.auth.signOut();
        setErrorMessage('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
        setIsLoading(false);
        return;
      }

      if (!profile?.first_name || !profile?.last_name || !profile?.phone) {
        navigate('/sework/contact-profile');
      } else {
        if (profile.role === 'User') {
          navigate('/sework');
        } else {
          navigate('/sework/admin/dashboard');
        }
      }
      
    } catch (error) {
      setErrorMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  return (
    <div 
      onCopy={preventAction}
      onCut={preventAction}
      onDragStart={preventAction}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative overflow-hidden select-none"
    >
      {/* ------------------------------------------
          ✨ Background Effects (Apple Style)
          ------------------------------------------ */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* ------------------------------------------
          🍎 Top Navigation
          ------------------------------------------ */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center px-6 py-6 z-50 animate__animated animate__fadeInDown">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm font-bold text-zinc-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl px-5 py-2.5 rounded-full border border-gray-200/50 dark:border-zinc-800/80 shadow-sm hover:text-zinc-900 dark:hover:text-white hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </button>

        <button 
          onClick={toggleTheme} 
          className="p-3 rounded-full border border-gray-200/50 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-sm hover:scale-110 active:scale-95 transition-all outline-none"
          title="สลับโหมด"
        >
          {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      {/* ------------------------------------------
          🍎 Main Login Card
          ------------------------------------------ */}
      <div className="w-full max-w-[440px] z-10 px-4 animate__animated animate__fadeInUp">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="h-16 w-16 flex items-center justify-center p-2.5 rounded-[1.5rem] bg-white dark:bg-[#121214] border border-gray-200 dark:border-zinc-800 shadow-xl shadow-blue-500/10 mb-5 hover:scale-105 transition-transform duration-300">
            <img src="/logo.png" alt="SE Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">
            Sign in to Workspace
          </h1>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure access for SE Gen 4
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:shadow-none border border-white dark:border-zinc-800/80 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071e3] to-indigo-500"></div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium text-center flex items-center gap-3 animate__animated animate__headShake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Username / Email Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Username / Email</label>
                <span className="text-[10px] text-zinc-400">ไม่ต้องใส่ @se-rmutl.com ก็ได้</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#0071e3] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl text-[15px] focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white placeholder-zinc-400 shadow-inner"
                  placeholder="Student ID หรือ Email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-[#0071e3] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-12 py-3.5 bg-zinc-100 dark:bg-zinc-900/50 border border-transparent dark:border-zinc-800 rounded-2xl text-[15px] focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-[#0071e3]/10 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white placeholder-zinc-400 shadow-inner"
                  placeholder="Enter your password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-[#0071e3] transition-colors outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-5 h-5 border-2 border-zinc-300 dark:border-zinc-700 rounded-md checked:bg-[#0071e3] checked:border-[#0071e3] transition-colors cursor-pointer"
                  />
                  <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                    <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

              <button 
                type="button" 
                onClick={() => navigate('/sework/forgot-password')} 
                className="text-sm font-bold text-[#0071e3] hover:text-[#0077ED] hover:underline transition-all outline-none"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full mt-2 py-4 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-2xl font-bold text-[15px] transition-all duration-300 shadow-[0_10px_20px_rgba(0,113,227,0.2)] hover:shadow-[0_10px_25px_rgba(0,113,227,0.4)] disabled:opacity-70 disabled:pointer-events-none active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/sework/register')} 
              className="font-bold text-[#0071e3] hover:text-[#0077ED] hover:underline transition-all outline-none"
            >
              Sign up now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}