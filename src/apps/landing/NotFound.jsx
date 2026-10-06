// src/apps/landing/NotFound.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import { Home } from 'lucide-react';
import SEO from '../../components/seo/SEO';
import 'animate.css';

// ==========================================
// 🎨 Emotion CSS-in-JS (Animations)
// ==========================================
const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(12px); }
`;

// แอนิเมชันรอยตัด (Slice) ของ Glitch
const glitchSlice1 = keyframes`
  0% { clip-path: inset(20% 0 80% 0); transform: translate(-3px, 1px); }
  10% { clip-path: inset(60% 0 10% 0); transform: translate(3px, -1px); }
  20% { clip-path: inset(40% 0 50% 0); transform: translate(-3px, 2px); }
  30% { clip-path: inset(80% 0 5% 0); transform: translate(3px, -2px); }
  40% { clip-path: inset(10% 0 70% 0); transform: translate(-2px, 1px); }
  50% { clip-path: inset(30% 0 50% 0); transform: translate(2px, -1px); }
  60% { clip-path: inset(80% 0 5% 0); transform: translate(-3px, 2px); }
  70% { clip-path: inset(20% 0 50% 0); transform: translate(3px, -1px); }
  80% { clip-path: inset(50% 0 30% 0); transform: translate(-2px, 2px); }
  90% { clip-path: inset(10% 0 80% 0); transform: translate(3px, -2px); }
  100% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 1px); }
`;

const glitchSlice2 = keyframes`
  0% { clip-path: inset(10% 0 60% 0); transform: translate(3px, 1px); }
  10% { clip-path: inset(30% 0 20% 0); transform: translate(-3px, -1px); }
  20% { clip-path: inset(70% 0 10% 0); transform: translate(3px, 2px); }
  30% { clip-path: inset(20% 0 50% 0); transform: translate(-3px, -2px); }
  40% { clip-path: inset(50% 0 30% 0); transform: translate(2px, 1px); }
  50% { clip-path: inset(5% 0 80% 0); transform: translate(-2px, -1px); }
  60% { clip-path: inset(40% 0 20% 0); transform: translate(3px, -2px); }
  70% { clip-path: inset(80% 0 10% 0); transform: translate(-3px, 1px); }
  80% { clip-path: inset(20% 0 60% 0); transform: translate(2px, -2px); }
  90% { clip-path: inset(60% 0 20% 0); transform: translate(-3px, 2px); }
  100% { clip-path: inset(10% 0 70% 0); transform: translate(2px, -1px); }
`;

const glitchTextClass = css`
  position: relative;
  display: inline-block;
  
  &::before, &::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    color: currentColor;
    background: transparent;
  }

  &::before {
    left: 4px;
    text-shadow: -2px 0 #0071e3; /* Apple Blue instead of Cyan */
    animation: ${glitchSlice1} 2.5s infinite linear alternate-reverse;
  }
  
  &::after {
    left: -4px;
    text-shadow: 2px 0 #d946ef; /* Fuchsia */
    animation: ${glitchSlice2} 3s infinite linear alternate-reverse;
  }
`;

const hoverGlow = css`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px -3px rgba(0, 113, 227, 0.3);
  
  &:hover {
    box-shadow: 0 8px 25px -5px rgba(0, 113, 227, 0.5);
    transform: translateY(-2px) scale(1.02);
  }
  &:active {
    transform: scale(0.95);
  }
`;

export default function NotFound() {
  const navigate = useNavigate();

  // ป้องกันการคลุมดำ/คัดลอก แต่ปล่อยให้ Inspect (F12) ทำงานได้ปกติ
  const preventAction = (e) => e.preventDefault();

  // สี่เหลี่ยมเล็กๆ ที่ลอยอยู่รอบๆ (Particles)
  const particles = [
    { color: 'bg-[#d946ef]', size: 'w-2 h-2', top: '-5%', left: '25%', anim: float, delay: '0s' },
    { color: 'bg-[#0071e3]', size: 'w-1.5 h-1.5', top: '10%', left: '75%', anim: floatReverse, delay: '0.3s' },
    { color: 'bg-[#0071e3]', size: 'w-2.5 h-2.5', top: '25%', left: '-5%', anim: float, delay: '0.7s' },
    { color: 'bg-[#d946ef]', size: 'w-1 h-1', top: '40%', left: '105%', anim: floatReverse, delay: '1s' },
    { color: 'bg-[#d946ef]', size: 'w-2.5 h-2.5', top: '75%', left: '85%', anim: float, delay: '0.2s' },
    { color: 'bg-[#0071e3]', size: 'w-1.5 h-1.5', top: '85%', left: '15%', anim: floatReverse, delay: '0.8s' },
    { color: 'bg-[#d946ef]', size: 'w-2 h-2', top: '105%', left: '35%', anim: float, delay: '1.2s' },
    { color: 'bg-[#d946ef]', size: 'w-1.5 h-1.5', top: '95%', left: '65%', anim: floatReverse, delay: '0.5s' },
  ];

  return (
    <>
      <SEO 
        title="404 Not Found" 
        description="The page you were looking for doesn't exist."
        url="/404"
      />
      <div 
        onContextMenu={preventAction} onCopy={preventAction} onCut={preventAction} onDragStart={preventAction} onSelectStart={preventAction}
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fbfbfd] dark:bg-black text-[#1d1d1f] dark:text-[#f5f5f7] font-sans p-6 relative overflow-hidden transition-colors duration-500 select-none"
      >
        <div className="relative z-10 flex flex-col items-center text-center animate__animated animate__fadeIn max-w-3xl w-full">
          
          <h2 className="text-lg sm:text-2xl font-semibold mb-16 sm:mb-20 text-zinc-500 dark:text-zinc-400 tracking-wide">
            The page you were looking for doesn't exist.
          </h2>

          <div className="relative w-full flex flex-col items-center justify-center mb-20 sm:mb-24">
            
            {/* Particles (Glitch Cubes) */}
            {particles.map((p, index) => (
              <div 
                key={index}
                className={`absolute rounded-full ${p.color} ${p.size}`}
                style={{
                  top: p.top,
                  left: p.left,
                  animation: `${p.anim} 4s ease-in-out infinite`,
                  animationDelay: p.delay
                }}
              ></div>
            ))}

            <div className="font-black text-xl sm:text-2xl tracking-[0.4em] sm:tracking-[0.6em] uppercase mb-4 text-[#1d1d1f] dark:text-white ml-3">
              Error
            </div>

            <h1 
              className={`text-[7rem] sm:text-[11rem] md:text-[13rem] font-black leading-none italic tracking-tighter text-[#1d1d1f] dark:text-[#f5f5f7] select-none ${glitchTextClass}`}
              data-text="404"
            >
              404
            </h1>

            <div className="font-black text-sm sm:text-xl tracking-[0.3em] sm:tracking-[0.4em] uppercase mt-4 text-[#1d1d1f] dark:text-white ml-2">
              Page Not Found
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className={`flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full text-sm sm:text-base font-bold tracking-wider uppercase shadow-lg shadow-blue-500/20 active:scale-95 ${hoverGlow}`}
          >
            <Home className="w-5 h-5"/> กลับสู่หน้าหลัก
          </button>

        </div>
      </div>
    </>
  );
}