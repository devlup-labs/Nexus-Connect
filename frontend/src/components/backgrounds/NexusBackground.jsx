import React from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

// Memoized starfield data so positions don't change on re-render
const stars = [...Array(150)].map(() => ({
  left: `${Math.random() * 100}vw`,
  top: `${Math.random() * 100}vh`,
  size: `${Math.random() * 2 + 1}px`,
  duration: `${Math.random() * 4 + 2}s`,
  delay: `${Math.random() * 4}s`,
  opacity: Math.random() * 0.8 + 0.2
}));

function NexusBackground() {
  const { theme } = useTheme();
  if (theme !== 'nexus') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDuration: star.duration,
            animationDelay: star.delay,
            opacity: star.opacity
          }}
        />
      ))}

      {/* Giant Planet */}
      <div className="absolute top-[30%] right-[15%] w-80 h-80 translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 bg-cyan-500 rounded-full blur-[80px] opacity-40 mix-blend-screen"></div>
        <div className="absolute inset-0 rounded-full overflow-hidden shadow-[inset_-30px_-30px_50px_rgba(0,0,0,0.9)]"
             style={{ background: 'linear-gradient(135deg, #06b6d4, #1d4ed8, #020617)' }}>
          <div className="absolute top-[20%] w-[150%] h-[10%] bg-white/10 -rotate-12 blur-sm"></div>
          <div className="absolute top-[50%] w-[150%] h-[15%] bg-black/20 -rotate-12 blur-md"></div>
          <div className="absolute top-[70%] w-[150%] h-[8%] bg-cyan-300/10 -rotate-12 blur-sm"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 w-[220%] h-[30%] border-[12px] border-x-cyan-300/40 border-y-blue-500/20 rounded-full -translate-x-1/2 -translate-y-1/2 rotate-[20deg] shadow-[0_0_30px_rgba(6,182,212,0.3)]"></div>
        <div className="absolute top-1/2 left-1/2 w-[260%] h-[40%] border-[2px] border-blue-300/30 rounded-full -translate-x-1/2 -translate-y-1/2 rotate-[20deg]"></div>
        <div className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.8)]"
             style={{ background: 'linear-gradient(135deg, #cbd5e1, #475569)', animation: 'orbit 20s linear infinite', marginTop: '-16px', marginLeft: '-16px' }}></div>
        <div className="absolute top-1/2 left-1/2 w-5 h-5 bg-cyan-300 rounded-full shadow-[0_0_15px_#67e8f9]"
             style={{ animation: 'orbit-reverse 35s linear infinite', marginTop: '-10px', marginLeft: '-10px' }}></div>
      </div>
    </div>
  );
}

export default React.memo(NexusBackground);
