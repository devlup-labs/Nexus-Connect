import { useState, useEffect } from 'react'
import Dock from './Components/Dock.jsx'
import ChatContainer from './Components/ChatContainer.jsx'
import StreamPanel from './Components/StreamPanel.jsx'
import SettingsPanel from './Components/Settings.jsx'
import CallLogPanel from './Components/CallLog.jsx'
import Login from './Components/Login.jsx'
import Signup from './Components/signup.jsx'
import { checkAuth, logout as logoutApi } from './api'

function App() {
  const [activeView, setActiveView] = useState('messages');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'signup'
  const [selectedContact, setSelectedContact] = useState(null);

  // Check if user is already logged in (JWT cookie)
  useEffect(() => {
    checkAuth()
      .then((res) => setAuthUser(res.data))
      .catch(() => setAuthUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleAuth = (user) => {
    setAuthUser(user);
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore
    }
    setAuthUser(null);
    setSelectedContact(null);
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-gradient-to-br from-[#050A1F] via-[#0A1535] to-[#02040A] flex items-center justify-center">
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(48, 251, 230, 0.2)',
          borderTopColor: '#30FBE6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not authenticated → show login/signup
  if (!authUser) {
    if (authPage === 'signup') {
      return (
        <Signup
          onAuth={handleAuth}
          onSwitchToLogin={() => setAuthPage('login')}
        />
      );
    }
    return (
      <Login
        onAuth={handleAuth}
        onSwitchToSignup={() => setAuthPage('signup')}
      />
    );
  }

  // Authenticated → main app
  const renderView = () => {
    switch (activeView) {
      case 'home': return null;
      case 'messages': return (
        <ChatContainer
          selectedContact={selectedContact}
          authUser={authUser}
          onLogout={handleLogout}
        />
      );
      case 'contacts': return null;
      case 'call-log': return <CallLogPanel />;
      case 'settings': return <SettingsPanel authUser={authUser} onLogout={handleLogout} onProfileUpdate={(updatedUser) => setAuthUser(updatedUser)} />;
      default: return (
        <ChatContainer
          selectedContact={selectedContact}
          authUser={authUser}
          onLogout={handleLogout}
        />
      );
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-[#050A1F] via-[#0A1535] via-[#0F2550] via-[#0A1535] to-[#02040A] overflow-hidden">
      {/* Glow Effects */}
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
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`
        }}>
      </div>
      <div className="relative z-10 flex items-center gap-6 h-screen pl-5">
        <Dock onNavigate={setActiveView} activeView={activeView} />

        <div className="flex items-center gap-3 h-full">
          <StreamPanel
            authUser={authUser}
            selectedContactId={selectedContact?._id}
            onSelectContact={(contact) => { setSelectedContact(contact); setActiveView('messages'); }}
          />
          {renderView()}
        </div>
      </div>
    </div>
  );
}

export default App;
