<div align="center">
  <img src="public/logo.png" alt="SE Portal Logo" width="150" />

  <h1>🚀 SE Portal Workspace</h1>
  <p>
    <strong>The Ultimate Workspace, Learning Ecosystem & Management System</strong><br>
    <em>Exclusive for Software Engineering Students (Gen 4) at RMUTL</em>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
    <img src="https://img.shields.io/badge/Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Pages" />
    <img src="https://img.shields.io/badge/Status-Internal_Use_Only-red?style=for-the-badge" alt="Internal Only" />
  </p>
</div>

---

## 📖 About The Project

**SE Portal Workspace** (SE-ONE.SITE) เป็นเว็บแอปพลิเคชันที่ถูกออกแบบและพัฒนาขึ้นมาโดยเฉพาะสำหรับนักศึกษาสาขาวิศวกรรมซอฟต์แวร์ (Software Engineering) รุ่นที่ 4 (เทียบโอน) มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา (RMUTL) 

ระบบนี้ทำหน้าที่เป็นศูนย์กลาง (Centralized Hub) ในการจัดการการเรียนการสอน รวบรวมผลงาน (Portfolio) ติดตามสถานะการส่งงาน กระดานคะแนนแบบเรียลไทม์ และระบบแอดมินหลังบ้านแบบครบวงจร พร้อมด้วย UI สไตล์ Glassmorphism ที่ให้ความรู้สึกพรีเมียม ลื่นไหล และทันสมัย รองรับการแสดงผลทั้ง Light Mode และ Dark Mode อย่างสมบูรณ์แบบ

---

## ✨ Core Features & Subsystems

ระบบถูกแบ่งออกเป็นโมดูลหลักๆ เพื่อรองรับการใช้งานที่หลากหลาย ดังนี้:

### 1. 🔐 Security & Identity (ระบบยืนยันตัวตนและความปลอดภัย)
- **Supabase Authentication:** ระบบล็อกอินที่ปลอดภัย ผูกกับโดเมนอีเมล `@se-rmutl.com` อัตโนมัติ
- **Anti-Inspect Protocol:** ป้องกันการกด F12, คลิกขวา, คัดลอก หรือเข้าถึงเครื่องมือสำหรับนักพัฒนาซอฟต์แวร์ในหน้าต่างระบบ
- **Role-Based Access Control (RBAC):** มีระดับสิทธิ์การเข้าถึง 3 ระดับ ได้แก่ `User` (นักศึกษา), `Admin` (แอดมิน), และ `Super Admin` (ผู้ดูแลระบบสูงสุด)

### 2. 📊 Real-time Dashboard & Analytics (ระบบสถิติ)
- **Interactive Charts:** แสดงผลข้อมูลด้วย ApexCharts, Chart.js, และ Highcharts
- **Live Sync:** ดึงข้อมูลสถิติจำนวนผู้ใช้งาน รายวิชา และงานที่ต้องส่ง แบบเรียลไทม์
- **Activity Logs:** บันทึกและแสดงประวัติการทำรายการทุกอย่างในระบบ (Audit Trail)

### 3. 📝 Submission Tracking & Leaderboard (ระบบติดตามงานและกระดานคะแนน)
- **Real-time Status:** เช็คชื่อและอัปเดตสถานะการส่งงาน (รอส่ง / ตรวจแล้ว / ส่งแล้ว)
- **Auto-Calculated XP:** คำนวณแต้มคะแนนสะสมอัตโนมัติ (1 งาน = 300 XP) อ้างอิงจากสถานะการส่งงาน
- **Wall of Fame:** กระดานจัดอันดับ Top 3 แบบ Podium พร้อมแอนิเมชันสุดล้ำ

### 4. 📂 Resource Center & Export (คลังทรัพยากรและการส่งออกข้อมูล)
- **Cloud Storage:** อัปโหลดและดาวน์โหลดไฟล์เอกสารการเรียน แหล่งส่งงาน หรือตารางเรียน ผ่าน Supabase Storage
- **Base64 Encoding:** ป้องกันปัญหาภาษาไทยเพี้ยนหรือข้อจำกัดด้านชื่อไฟล์ด้วยการเข้ารหัสชื่อไฟล์ก่อนลงฐานข้อมูล
- **Multi-format Export:** แอดมินสามารถส่งออกข้อมูลนักศึกษาและตาราง Matrix การส่งงาน ได้ทั้งในรูปแบบ `.csv`, `.xlsx` (Excel), `.pdf` และสามารถกด Backup ข้อมูลทั้งหมดเป็นไฟล์ `.zip` ได้ในคลิกเดียว

### 5. 🤖 External Integrations (การเชื่อมต่อภายนอก)
- **Discord Webhooks:** ระบบจะทำการส่งแจ้งเตือนไปยังห้อง Discord ของสาขาทันทีที่มีความเคลื่อนไหวสำคัญ เช่น:
  - การสร้างผู้ใช้งานใหม่ / การแบนบัญชี
  - การอัปเดตคะแนนและอันดับใน Leaderboard (อันดับพุ่ง / อันดับร่วง)
  - การแก้ไขข้อมูลส่วนตัว
  - การเพิ่ม/ลบ เอกสารประกอบการเรียน
- **Cloudflare Functions:** ใช้ Serverless API ในการจัดการสิทธิ์ขั้นสูง เช่น บังคับรีเซ็ตรหัสผ่าน (Admin Override) โดยใช้ `Supabase Service Role Key`

---

## 🛠️ Technology Stack

ระบบถูกสร้างขึ้นด้วยเทคโนโลยีที่ทันสมัย (Modern Web Stack) เพื่อประสิทธิภาพสูงสุด:

**Frontend Ecosystem:**
- **Core:** [React 18](https://reactjs.org/) (Hooks, Context, Memoization)
- **Build Tool:** [Vite](https://vitejs.dev/) (Ultra-fast HMR)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Emotion](https://emotion.sh/) (CSS-in-JS)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Animate.css](https://animate.style/)
- **Charts:** ApexCharts, Chart.js, Highcharts
- **Data Export:** SheetJS (xlsx), jsPDF, JSZip, FileSaver.js

**Backend & Cloud Services:**
- **Database:** PostgreSQL (via [Supabase](https://supabase.com/))
- **Auth & Storage:** Supabase Auth & Buckets
- **Realtime:** Supabase Realtime Channels (WebSockets)
- **Serverless API:** Cloudflare Pages Functions
- **Hosting / CDN:** Cloudflare Pages

---

## 📁 Project Structure

โครงสร้างของโปรเจกต์ถูกจัดวางอย่างเป็นระเบียบ เพื่อง่ายต่อการพัฒนาและต่อยอดในอนาคต:

```text
SE-ONE-Project/
├── functions/
│   └── api/
│       └── reset-password.js      # Cloudflare Edge Function สำหรับรีเซ็ตรหัสผ่าน
├── public/
│   ├── favicon.svg                # ไอคอนเว็บไซต์
│   ├── logo.png                   # โลโก้โครงการ
│   └── robots.txt                 # SEO Configuration
├── src/
│   ├── apps/
│   │   ├── coding/                # ระบบ Coding IDE (Monaco Editor)
│   │   ├── job/                   # ระบบ SE-Job หลัก
│   │   │   ├── layouts/           # Layouts สำหรับหน้า Admin
│   │   │   └── views/             # หน้า UI ทั้งหมดของระบบ (Login, Dashboard ฯลฯ)
│   │   ├── landing/               # หน้าเว็บไซต์หลัก (Home, Portfolio, Showcase)
│   │   └── portfolio/             # หน้าย่อยสำหรับ Portfolio
│   ├── components/
│   │   └── seo/                   # Components จัดการ Metadata & JSON-LD
│   ├── config/
│   │   └── site.js                # ไฟล์ตั้งค่า Global Variables
│   ├── shared/
│   │   └── lib/
│   │       └── supabase.js        # ตัวเชื่อมต่อฐานข้อมูล Supabase
│   ├── App.css
│   ├── App.jsx                    # Router Controller หลัก
│   ├── index.css                  # Tailwind Base CSS
│   └── main.jsx                   # React Entry Point
├── .env                           # Environment Variables (อย่า Commit ลง Git)
├── package.json                   # Dependencies
└── vite.config.js                 # Vite Config