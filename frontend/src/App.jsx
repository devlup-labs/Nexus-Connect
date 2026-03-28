import { useState, useEffect } from 'react'
import Dock from './components/Dock.jsx'
import ChatContainer from './Components/ChatContainer.jsx'
import StreamPanel from './Components/StreamPanel.jsx'
import SettingsPanel from './Components/Settings.jsx'
import CallLogPanel from './Components/CallLog.jsx'
import Login from './components/Login.jsx'
import Signup from './components/signup.jsx'
import ContactsPanel from './Components/ContactsPanel.jsx'
import { checkAuth, logout as logoutApi } from './api'
import { initializeSocket, disconnectSocket, getSocket } from './services/socket'
import CallOverlay from './Components/CallOverlay.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import NexusBackground from './components/backgrounds/NexusBackground.jsx'
import SakuraBackground from './components/backgrounds/SakuraBackground.jsx'
import CelestiaBackground from './components/backgrounds/CelestiaBackground.jsx'
import { createPeerConnection, startLocalMedia, addLocalTracks, createOffer, applyRemoteOffer, createAnswer, applyRemoteAnswer, addIceCandidate, cleanupWebRTC } from './services/webrtc.js'




function App() {
  const [activeView, setActiveView] = useState('messages');
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'signup'
  const [selectedContact, setSelectedContact] = useState(null);

  const [callState, setCallState] = useState({
    status: 'idle', // 'idle', 'ringing', 'incoming', 'connecting', 'connected', 'ended', 'dialing'
    callId: null,
    otherUserId: null,
    otherUserName: '',
    otherUserPic: '',
    callType: null, // 'voice' | 'video'
    isCaller: false,
    remoteStreamUpdated: 0,
  });

  // Check if user is already logged in (JWT cookie)
  useEffect(() => {
    checkAuth()
      .then((res) => setAuthUser(res.data))
      .catch(() => setAuthUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  // Initialize WebSocket when user is authenticated
  useEffect(() => {
    if (authUser?._id) {
      initializeSocket(authUser._id);
    }
    return () => {
      // Socket cleanup handled on logout
    };
  }, [authUser]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !authUser?._id) return;

    const handleIncoming = (data) => {
      if (callState.status !== 'idle') return;
      setCallState({
        status: 'incoming',
        callId: data.callId,
        otherUserId: data.fromUserId,
        otherUserName: data.fromUserName || 'Incoming Caller',
        otherUserPic: data.fromUserPic || '',
        callType: data.callType,
        isCaller: false,
        remoteStreamUpdated: 0,
      });
    };

    const handleRinging = (data) => {
      setCallState(prev => ({ ...prev, status: 'ringing', callId: data.callId }));
    };

    const handleAccepted = async (data) => {
      setCallState(prev => ({ ...prev, status: 'connecting' }));
      try {
        await startLocalMedia(callState.callType);
        await createPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          onIceCandidate: (candidate) => socket.emit('call:ice-candidate', { callId: callState.callId, candidate }),
          onTrack: () => setCallState(prev => ({ ...prev, remoteStreamUpdated: prev.remoteStreamUpdated + 1 })),
        });
        addLocalTracks();
        const offer = await createOffer();
        socket.emit('call:offer', { callId: callState.callId, sdp: offer });
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } catch (err) {
        console.error('Error starting call:', err);
        handleEndCall();
      }
    };

    const handleOffer = async (data) => {
      if (callState.status !== 'connecting') return;
      try {
        await applyRemoteOffer(data.sdp);
        const answer = await createAnswer();
        socket.emit('call:answer', { callId: data.callId, sdp: answer });
        setCallState(prev => ({ ...prev, status: 'connected' }));
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (data) => {
      await applyRemoteAnswer(data.sdp);
    };

    const handleIceCandidate = async (data) => {
      if (data.candidate) {
        await addIceCandidate(data.candidate);
      }
    };

    const handleEnded = () => {
      cleanupWebRTC();
      setCallState({ status: 'idle', callId: null, otherUserId: null, otherUserName: '', otherUserPic: '', callType: null, isCaller: false, remoteStreamUpdated: 0 });
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:ringing', handleRinging);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:offer', handleOffer);
    socket.on('call:answer', handleAnswer);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:ringing', handleRinging);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:offer', handleOffer);
      socket.off('call:answer', handleAnswer);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleEnded);
    };
  }, [callState.status, callState.callId, callState.callType, authUser?._id]);

  const handleStartCall = (type, customContact = null) => {
    const contactToCall = customContact || selectedContact;
    if (!contactToCall || !authUser?._id) return;
    const socket = getSocket();
    if (!socket) return;

    if (customContact) {
      setSelectedContact(customContact);
      setActiveView('messages');
    }

    setCallState({
      status: 'dialing',
      callId: null,
      otherUserId: contactToCall._id,
      otherUserName: contactToCall.fullName,
      otherUserPic: contactToCall.profilePic,
      callType: type,
      isCaller: true,
      remoteStreamUpdated: 0,
    });

    socket.emit('call:invite', { toUserId: contactToCall._id, callType: type }, (res) => {
      if (!res?.ok) {
        setCallState(prev => ({ ...prev, status: 'failed', errorMessage: res?.error || 'User is offline' }));
        setTimeout(() => {
          setCallState({ status: 'idle', callId: null, otherUserId: null, otherUserName: '', otherUserPic: '', callType: null, isCaller: false, remoteStreamUpdated: 0 });
        }, 2000);
      }
    });
  };

  const handleAcceptCall = async () => {
    const socket = getSocket();
    if (!socket) return;

    // We update status first, so that when handleOffer comes in, status is 'connecting'
    setCallState(prev => ({ ...prev, status: 'connecting' }));
    try {
      await startLocalMedia(callState.callType);
      await createPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        onIceCandidate: (candidate) => socket.emit('call:ice-candidate', { callId: callState.callId, candidate }),
        onTrack: () => setCallState(prev => ({ ...prev, remoteStreamUpdated: prev.remoteStreamUpdated + 1 })),
      });
      addLocalTracks();
      socket.emit('call:accept', { callId: callState.callId });
    } catch (err) {
      console.error('Accept call error: ', err);
      handleRejectCall();
    }
  };

  const handleRejectCall = () => {
    const socket = getSocket();
    if (socket && callState.callId) {
      socket.emit('call:reject', { callId: callState.callId });
    }
    cleanupWebRTC();
    setCallState({ status: 'idle', callId: null, otherUserId: null, otherUserName: '', otherUserPic: '', callType: null, isCaller: false, remoteStreamUpdated: 0 });
  };

  function handleEndCall() {
    const socket = getSocket();
    if (socket && callState.callId) {
      socket.emit('call:end', { callId: callState.callId });
    }
    cleanupWebRTC();
    setCallState({ status: 'idle', callId: null, otherUserId: null, otherUserName: '', otherUserPic: '', callType: null, isCaller: false, remoteStreamUpdated: 0 });
  };

  const handleAuth = (user) => {
    setAuthUser(user);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    disconnectSocket();
    setAuthUser(null);
    setSelectedContact(null);
  };

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: 'var(--bg-base, #050A1F)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(var(--accent-rgb, 48, 251, 230), 0.2)',
          borderTopColor: 'var(--accent, #30FBE6)',
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
          onStartCall={handleStartCall}
        />
      );
      case 'contacts': return null;
      case 'call-log': return <CallLogPanel authUser={authUser} onStartCall={handleStartCall} />;
      case 'settings': return <SettingsPanel authUser={authUser} onLogout={handleLogout} onProfileUpdate={(updatedUser) => setAuthUser(updatedUser)} />;
      default: return (
        <ChatContainer
          selectedContact={selectedContact}
          authUser={authUser}
          onLogout={handleLogout}
          onStartCall={handleStartCall}
        />
      );
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: `linear-gradient(135deg, var(--bg-gradient-from), var(--bg-gradient-via), var(--bg-gradient-to))` }}>
      {/* Blob Mesh Gradient Background */}
      <div 
        className="absolute inset-[-50%] pointer-events-none z-0" 
        style={{ filter: 'blur(100px)', WebkitFilter: 'blur(100px)', transform: 'translate3d(0,0,0)' }}
      >
        <div className="absolute top-[30%] left-[20%] w-[50vw] h-[50vh] rounded-full blob-1 opacity-80" style={{ background: 'var(--glow-1)' }}></div>
        <div className="absolute bottom-[30%] right-[20%] w-[60vw] h-[60vh] rounded-full blob-2 opacity-80" style={{ background: 'var(--glow-2)' }}></div>
        <div className="absolute top-[20%] left-[40%] w-[70vw] h-[70vh] rounded-full blob-3 opacity-60" style={{ background: 'var(--glow-3)' }}></div>
        <div className="absolute bottom-[20%] left-[30%] w-[50vw] h-[50vh] rounded-full blob-4 opacity-50" style={{ background: 'var(--glow-1)' }}></div>
      </div>

      {/* Theme-specific animated backgrounds */}
      <NexusBackground />
      <SakuraBackground />
      <CelestiaBackground />

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`
        }}>
      </div>
      <div className="relative z-10 flex items-center gap-6 h-screen pl-5">
        <Dock onNavigate={setActiveView} activeView={activeView} onLogout={handleLogout} />

        <div className="flex items-center gap-3 h-full">
          {activeView === 'contacts' ? <ContactsPanel onSendMessage={(contact) => { setSelectedContact(contact); setActiveView('messages'); }} /> : <StreamPanel
            authUser={authUser}
            selectedContactId={selectedContact?._id}
            onSelectContact={(contact) => { setSelectedContact(contact); setActiveView('messages'); }}
          />}
          {renderView()}
        </div>
      </div>

      {/* Global Call Overlay */}
      {callState.status !== 'idle' && (
        <CallOverlay
          callState={callState}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
        />
      )}
    </div>
  );
}

// Wrap App with ThemeProvider
function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;