import React from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const dustParticles = [...Array(25)].map(() => ({
  left: `${Math.random() * 100}vw`,
  top: `${Math.random() * 100}vh`,
  width: `${Math.random() * 5 + 2}px`,
  height: `${Math.random() * 5 + 2}px`,
  duration: `${Math.random() * 20 + 15}s`,
  delay: `${Math.random() * 20}s`,
}));

function CelestiaBackground() {
  const { theme } = useTheme();
  if (theme !== 'celestia') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Sun / Moon */}
      <div className="absolute top-16 right-[20%] w-64 h-64 bg-white rounded-full blur-[2px] opacity-40 mix-blend-overlay"></div>

      {/* Dry Branch */}
      <svg className="absolute top-0 right-0 w-[28rem] h-[28rem] opacity-20 transform translate-x-8 -translate-y-4" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M 220,-20 Q 140,20 100,100 T 60,180" fill="none" stroke="var(--text-primary)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 150,15 Q 110,30 90,80" fill="none" stroke="var(--text-primary)" strokeWidth="1" strokeLinecap="round" />
        <path d="M 120,40 Q 80,60 50,70" fill="none" stroke="var(--text-primary)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 100,100 Q 70,120 40,110" fill="none" stroke="var(--text-primary)" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M 75,145 Q 50,155 30,140" fill="none" stroke="var(--text-primary)" strokeWidth="0.5" strokeLinecap="round" />
      </svg>

      {/* Minimalist Mountains */}
      <svg className="absolute bottom-0 left-0 w-full h-72 opacity-30" preserveAspectRatio="none" viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0,200 L 0,100 Q 150,50 300,120 T 600,80 T 1000,120 L 1000,200 Z" fill="var(--accent)" opacity="0.3" />
        <path d="M 0,200 L 0,150 Q 200,80 400,160 T 800,130 T 1000,160 L 1000,200 Z" fill="var(--text-secondary)" opacity="0.2" />
        <path d="M 0,200 L 0,180 Q 250,140 500,190 T 1000,170 L 1000,200 Z" fill="var(--text-primary)" opacity="0.1" />
      </svg>

      {/* Floating Dust */}
      {dustParticles.map((d, i) => (
        <div 
          key={i} 
          className="dust" 
          style={{
            left: d.left,
            top: d.top,
            width: d.width,
            height: d.height,
            animation: `float-dust ${d.duration} linear infinite`,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

export default React.memo(CelestiaBackground);
