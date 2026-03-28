import { Home, MessageSquare, Phone, Settings, Contact2, LogOut } from 'lucide-react';
import { useState } from 'react';

function Dock({ onNavigate, activeView, onLogout }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const dockItems = [
    { icon: Home, label: 'Home', view: 'home' },
    { icon: MessageSquare, label: 'Messages', view: 'messages' },
    { icon: Contact2, label: 'Contacts', view: 'contacts' },
    { icon: Phone, label: 'Phone', view: 'call-log' },
    { icon: Settings, label: 'Settings', view: 'settings' },
  ];

  return (
    <div
      className="dock flex flex-col gap-2 backdrop-blur-2xl rounded-2xl shadow-2xl z-50"
      style={{
        background: 'var(--dock-bg)',
        border: '1px solid var(--dock-border)',
      }}
    >
      {dockItems.map((item, index) => {
        const isActive = activeView === item.view;
        const isHovered = hoveredIndex === index;

        return (
          <div key={index} className="dock-item relative">
            <div
              onClick={() => {
                if (item.action && item.label === 'Logout') {
                  if (onLogout) onLogout();
                } else {
                  onNavigate(item.view);
                }
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="dock-item-btn w-12 h-12 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-300 ease-out relative"
              style={{
                background: isActive
                  ? 'var(--dock-active-bg)'
                  : isHovered
                    ? 'var(--dock-hover-bg)'
                    : 'transparent',
                boxShadow: isActive ? '0 4px 12px var(--shadow)' : 'none',
                transform: isHovered && !isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <item.icon
                className="w-6 h-6 transition-all duration-300"
                style={{
                  color: isActive
                    ? 'var(--dock-active-text)'
                    : isHovered
                      ? 'var(--text-primary)'
                      : 'var(--dock-text)',
                  transform: isHovered && !isActive ? 'scale(1.1)' : 'scale(1)',
                }}
                strokeWidth={2}
              />
              {/* Mobile label - hidden on desktop, shown on mobile via CSS */}
              <span className="dock-item-label">{item.label}</span>
            </div>
            {isActive && (
              <div
                className="dock-active-indicator absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-1 h-7 rounded-full"
                style={{ background: 'var(--dock-indicator)' }}
              ></div>
            )}
            {isHovered && (
              <div
                className="absolute left-16 top-1/2 -translate-y-1/2 font-semibold rounded-xl whitespace-nowrap pointer-events-none shadow-2xl transition-opacity duration-200"
                style={{
                  background: 'var(--surface, rgba(0, 0, 0, 0.75))',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  padding: '10px 20px',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-hover)',
                }}
              >
                {item.label}
                <div
                  className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px]"
                  style={{ borderRightColor: 'var(--surface, rgba(0, 0, 0, 0.75))' }}
                ></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Dock;