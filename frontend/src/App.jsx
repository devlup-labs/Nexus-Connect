import Dock from './Components/Dock.jsx'
import ChatContainer from './Components/ChatContainer.jsx'
import StreamPanel from './Components/StreamPanel.jsx'
import SettingsPanel from './Components/Settings.jsx'
import CallLogPanel from './Components/CallLog.jsx'
import Home from './components/Home.jsx'; 
import { useState } from 'react';

function App() {
  const [activeView, setActiveView] = useState('home');

  const renderView = () => {
    switch (activeView) {
      case 'home': return <Home />;
      case 'messages': return <ChatContainer />;
      case 'call-log': return <CallLogPanel />;
      case 'settings': return <SettingsPanel />;
      default: return <Home />;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-[#050A1F] via-[#0A1535] via-[#0F2550] via-[#0A1535] to-[#02040A] overflow-hidden">
      {/* Your Original Glow Effects */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-pulse-slow pointer-events-none opacity-100"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(30, 64, 175, 0.25) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0, 191, 255, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 35%)
          `
        }}>
      </div>
      
      {/* Your Original Noise Texture */}
      <div className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`
        }}>
      </div>

      <Dock onNavigate={setActiveView} activeView={activeView} />

      {/* Main Layout: Fixed Sidebar + Global Stream + Dynamic Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', height: '100vh', marginLeft: '100px' }}>
        
        {/* The Stream is now global and shows on every page */}
        <StreamPanel /> 
        
        <div className="flex-1 h-full">
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;