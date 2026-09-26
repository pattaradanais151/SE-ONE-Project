// src/shared/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🌟 สำคัญ: ต้องมีคำว่า 'export const supabase' แบบนี้
export const supabase = createClient(supabaseUrl, supabaseAnonKey);