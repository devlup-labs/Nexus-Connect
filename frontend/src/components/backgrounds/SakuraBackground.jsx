import React from 'react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const petals = [...Array(15)].map(() => ({
  left: `${Math.random() * 100}vw`,
  width: `${Math.random() * 8 + 8}px`,
  height: `${Math.random() * 8 + 8}px`,
  duration: `${Math.random() * 10 + 10}s`,
  delay: `${Math.random() * 15}s`,
  color: Math.random() > 0.4 ? '#f4a7b9' : '#e16b8c',
}));

function SakuraBackground() {
  const { theme } = useTheme();
  if (theme !== 'sakura') return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Stylized Branch */}
      <svg className="absolute top-0 right-0 w-[30rem] h-[30rem] opacity-40 transform translate-x-12 -translate-y-12" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M 220,-20 Q 150,40 80,80 T -20,150" fill="none" stroke="#5c544e" strokeWidth="2" strokeLinecap="round" />
        <path d="M 160,20 Q 120,50 80,40" fill="none" stroke="#5c544e" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 120,60 Q 90,90 40,80" fill="none" stroke="#5c544e" strokeWidth="1" strokeLinecap="round" />
        <g fill="#f4a7b9">
          <circle cx="80" cy="80" r="6" />
          <circle cx="75" cy="75" r="4" fill="#e16b8c" />
          <circle cx="85" cy="85" r="4" />
          <circle cx="160" cy="20" r="5" />
          <circle cx="155" cy="25" r="3" fill="#e16b8c"/>
          <circle cx="40" cy="80" r="4" />
          <circle cx="120" cy="60" r="6" fill="#e16b8c"/>
          <circle cx="125" cy="55" r="4" />
          <circle cx="100" cy="45" r="3" />
          <circle cx="30" cy="110" r="4" fill="#e16b8c"/>
          <circle cx="0" cy="135" r="5" />
        </g>
      </svg>

      {/* Falling Petals */}
      {petals.map((p, i) => (
        <div 
          key={i} 
          className="petal" 
          style={{
            left: p.left,
            top: '-20px',
            width: p.width,
            height: p.height,
            animation: `fall ${p.duration} linear infinite`,
            animationDelay: p.delay,
            background: p.color,
            filter: 'blur(1px)'
          }}
        />
      ))}
    </div>
  );
}

export default React.memo(SakuraBackground);
