// functions/api/reset-password.js
import { createClient } from '@supabase/supabase-js';

export async function onRequestPost({ request, env }) {
  try {
    // รับค่าจาก Frontend
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return new Response(JSON.stringify({ error: 'ข้อมูลไม่ครบถ้วน' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ดึงตัวแปรสภาพแวดล้อมจาก Cloudflare (ตั้งค่าใน Dashboard)
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Environment Variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // สร้าง Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // ใช้ Admin API เปลี่ยนรหัสผ่านให้ผู้ใช้
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, message: 'Password updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}