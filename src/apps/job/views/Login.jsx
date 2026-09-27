import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../shared/lib/supabase';
import { ArrowLeft, Globe, Clock, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import 'animate.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isDark, setIsDark] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [currentTime, setCurrentTime] = useState('');
  const [publicIp, setPublicIp] = useState('Fetching IP...');

  useEffect(() => {
    // Theme setup
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    // Clock setup
    const updateClock = () => {
      setCurrentTime(new Date().toLocaleTimeString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        hour12: false 
      }) + ' น.');
    };
    updateClock();
    const timeInterval = setInterval(updateClock, 1000);

    // IP Fetch
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setPublicIp(data.ip))
      .catch(() => setPublicIp('Offline / Unknown'));

    // Check URL queries
    const params = new URLSearchParams(location.search);
    if (params.get('timeout')) setErrorMessage('เซสชันหมดอายุเนื่องจากไม่มีการใช้งาน กรุณาเข้าสู่ระบบใหม่');
    if (params.get('banned')) setErrorMessage('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');

    return () => clearInterval(timeInterval);
  }, [location]);

  const toggleTheme = () => setIsDark(!isDark);
  const preventAction = (e) => e.preventDefault();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      let loginEmail = username.trim();
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
        navigate('/contact-profile');
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
      onSelectStart={preventAction}
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans transition-colors duration-500 relative overflow-hidden px-4 select-none"
    >
      {/* Floating Top Nav */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center p-6 z-50 animate__animated animate__fadeInDown">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm hover:scale-105 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก
        </button>

        <button 
          onClick={toggleTheme} 
          className="p-2.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-all"
          title="สลับโหมด"
        >
          {isDark ? <Sun className="w-4 h-4 text-zinc-300" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>

      {/* Main Centered Content */}
      <div className="w-full max-w-[420px] z-10 animate__animated animate__fadeInUp">
        
        {/* Logo & Brand */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="h-14 w-14 flex items-center justify-center p-2 rounded-[1.25rem] bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
            <img src="/logo.png" alt="SE Logo" className="h-full w-auto object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Software Engineering RMUTL
          </h1>
        </div>

        {/* Login Card (Apple Glass Style) */}
        <div className="bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white dark:border-zinc-800/80">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Welcome back</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sign in to your account</p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center animate__animated animate__headShake">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full px-4 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white placeholder-zinc-400"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-4 pr-12 py-3 bg-zinc-50 dark:bg-[#09090b] border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] outline-none transition-all duration-300 text-zinc-900 dark:text-white placeholder-zinc-400"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-[#0071e3] transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-[#0071e3] focus:ring-[#0071e3] dark:border-zinc-700 dark:bg-zinc-800" 
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Remember me</span>
              </label>
              <button type="button" onClick={() => navigate('/sework/forgot-password')} className="text-sm font-medium text-[#0071e3] hover:underline transition-all">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-3.5 px-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-blue-500/20 disabled:opacity-70 active:scale-[0.98]">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
            <button onClick={() => navigate('/sework/register')} className="font-medium text-[#0071e3] hover:underline transition-all">
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Floating Bottom Info (IP & Time) */}
      <div className="fixed bottom-6 flex items-center justify-center gap-4 px-5 py-2.5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-full border border-gray-200 dark:border-zinc-800 shadow-sm text-xs font-mono text-zinc-500 dark:text-zinc-400 z-10 animate__animated animate__fadeInUp">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          <span>IP: {publicIp}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>TH: {currentTime}</span>
        </div>
      </div>
    </div>
  );
}