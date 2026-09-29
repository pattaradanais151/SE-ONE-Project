// src/apps/coding/CodingLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Terminal, Lock, User, Loader2, ArrowLeft } from 'lucide-react';

export default function CodingLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(''); // ใช้ได้ทั้ง Username และ Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    let finalEmail = identifier;

    try {
      // เช็คว่าผู้ใช้พิมพ์ Email หรือ Username (ถ้าไม่มี @ ถือว่าเป็น Username)
      if (!identifier.includes('@')) {
        const { data, error: profileError } = await supabase
          .from('coding_profiles')
          .select('email')
          .eq('username', identifier)
          .single();

        if (profileError || !data) {
          throw new Error('ไม่พบ Username นี้ในระบบ');
        }
        finalEmail = data.email;
      }

      // ล็อกอินด้วย Email ที่แปลงมาแล้ว หรือ Email ตรงๆ
      const { error: authError } = await supabase.auth.signInWithPassword({ 
        email: finalEmail, 
        password 
      });

      if (authError) throw authError;

      // บันทึกเวลา Login ไว้เช็คตัด Session (5 ชั่วโมง)
      localStorage.setItem('code_login_time', Date.now().toString());
      navigate('/code/workspace');

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-mono select-none">
      <div className="absolute top-6 left-6 cursor-pointer text-zinc-400 hover:text-white flex items-center gap-2" onClick={() => navigate('/code/landing')}>
        <ArrowLeft className="w-4 h-4" /> Back to Landing
      </div>
      
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0E2A1F] text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Terminal className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Dev Playground</h2>
          <p className="text-zinc-500 text-sm mt-2">Sign in to access your workspace</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm mb-6 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                required 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" 
                placeholder="dev_gen4 หรือ dev@seone.site" 
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="password" 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Execute Login();'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6">
          New developer? <span className="text-emerald-500 cursor-pointer hover:underline" onClick={() => navigate('/code/register')}>Create an account</span>
        </p>
      </div>
    </div>
  );
}