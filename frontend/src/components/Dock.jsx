import { Home, MessageSquare, Users, Archive, Settings } from 'lucide-react';
import { useState } from 'react';

function Dock() {
  const dockItems = [
    { icon: Home, label: 'Home' },
    { icon: MessageSquare, label: 'Messages' },
    { icon: Users, label: 'User' },
    { icon: Archive, label: 'Archive' },
    { icon: Settings, label: 'Settings' },
  ];

  const [activeIndex, setActiveIndex] = useState(1);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="fixed left-3 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-2 sm:gap-3 bg-black/30 backdrop-blur-xl px-3 sm:px-4 py-3 sm:py-4 rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
        {dockItems.map((item, index) => (
          <div key={index} className="relative">
            <div
              onClick={() => setActiveIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                transform: hoveredIndex === index ? 'scale(1.25) translateX(4px)' : 'scale(1)',
                transition: 'transform 0.3s ease-out'
              }}
              className={`
                w-14 h-14 flex items-center justify-center rounded-xl cursor-pointer 
                ${index === activeIndex
                  ? 'bg-white/20 ring-2 ring-white/40 shadow-lg shadow-white/20'
                  : 'bg-white/10 hover:bg-white/20'
                }
              `}
            >
              <item.icon className={`w-6 h-6 ${index === activeIndex ? 'text-white' : 'text-white/70'}`} />
            </div>

            {/* Tooltip */}
            {hoveredIndex === index && (
              <div
                className="absolute left-20 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none"
                style={{
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                {item.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dock;