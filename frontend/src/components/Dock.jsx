import { Home, MessageSquare, Users, Phone, Settings } from 'lucide-react';
import { useState } from 'react';

function Dock() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const dockItems = [
    { icon: Home, label: 'Home' },
    { icon: MessageSquare, label: 'Messages' },
    { icon: Users, label: 'User' },
    { icon: Phone, label: 'Phone' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 bg-white/10 backdrop-blur-2xl px-3 py-5 rounded-xl shadow-2xl border border-white/20" style={{ backdropFilter: 'blur(40px) saturate(180%)' }}>
        {dockItems.map((item, index) => (
          <div key={index} className="relative">
            <div
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300 ease-out relative ${
                index === activeIndex 
                  ? 'bg-white shadow-lg' 
                  : hoveredIndex === index
                    ? 'bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shadow-white/5 scale-105'
                    : 'hover:bg-white/5'
              }`}
            >
              <item.icon 
                className={`w-6 h-6 transition-all duration-300 ${index === activeIndex ? 'text-gray-800' : 'text-white/70'} ${hoveredIndex === index && index !== activeIndex ? 'scale-110 text-white' : ''}`}
                strokeWidth={2}
              />
            </div>
            
            {index === activeIndex && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3.5 w-1 h-7 bg-cyan-400 rounded-full"></div>
            )}
            
            {hoveredIndex === index && (
              <div
                className="absolute left-16 top-1/2 -translate-y-1/2 text-white font-semibold rounded-xl whitespace-nowrap pointer-events-none shadow-2xl border border-white/30 transition-opacity duration-200"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  padding: '10px 20px',
                  fontSize: '15px'
                }}
              >
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]" style={{ borderRightColor: 'rgba(0, 0, 0, 0.75)' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
      
   
    </div>
  );
}

export default Dock;