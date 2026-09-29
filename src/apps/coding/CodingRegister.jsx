// src/apps/coding/CodingRegister.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Terminal, Lock, Mail, Loader2, ArrowLeft, User, Phone, Github } from 'lucide-react';

export default function CodingRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    tel: '',
    githubUrl: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. ตรวจสอบ Username ว่าซ้ำหรือไม่ (Optional แต่ทำไว้กันเหนียว)
      const { data: existingUser } = await supabase
        .from('coding_profiles')
        .select('username')
        .eq('username', formData.username)
        .single();
      
      if (existingUser) {
        throw new Error('Username นี้ถูกใช้งานแล้ว โปรดใช้ชื่ออื่น');
      }

      // 2. สมัครผ่าน Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.password 
      });

      if (authError) throw authError;

      // 3. บันทึกข้อมูลลง Table coding_profiles
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('coding_profiles')
          .insert([{
            id: authData.user.id,
            username: formData.username,
            email: formData.email,
            tel: formData.tel,
            github_url: formData.githubUrl
          }]);
        
        if (dbError) throw dbError;
      }

      alert("Registration successful! You can now log in.");
      navigate('/code/login');

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4 font-mono select-none overflow-y-auto py-10">
      <div className="absolute top-6 left-6 cursor-pointer text-zinc-400 hover:text-white flex items-center gap-2" onClick={() => navigate('/code/login')}>
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </div>
      
      <div className="w-full max-w-md bg-[#121214] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0E2A1F] text-emerald-500 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20">
            <Terminal className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Initialize Account</h2>
          <p className="text-zinc-500 text-sm mt-2">Join the coding playground</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm mb-6 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 mb-1 block uppercase tracking-widest">USERNAME</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="dev_gen4" />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] text-zinc-400 mb-1 block uppercase tracking-widest">EMAIL</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="developer@seone.site" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 mb-1 block uppercase tracking-widest">TEL. (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="text" name="tel" value={formData.tel} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="08x-xxx-xxxx" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 mb-1 block uppercase tracking-widest">GITHUB URL (Optional)</label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="url" name="githubUrl" value={formData.githubUrl} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="https://github.com/username" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 mb-1 block uppercase tracking-widest">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange} className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-emerald-500 outline-none transition-colors" placeholder="Min 6 characters" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Register();'}
          </button>
        </form>
      </div>
    </div>
  );
}