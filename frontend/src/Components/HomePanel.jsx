import React, { useState, useEffect } from 'react';
import { ChevronRight, Plus, MessageSquare, PhoneMissed, Activity, CheckCircle, Clock } from 'lucide-react';
import { getChatPartners, getCallLogs } from '../api';

/* ---------------------------------
   Clock Widget Component
--------------------------------- */
const ClockWidget = () => {
  const [time, setTime] = useState(new Date());
  const [isAnalog, setIsAnalog] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format for digital
  const timeString = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const ampm = time.toLocaleTimeString([], { hour12: true }).slice(-2);

  // Calculate rotation for analog hands
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div
      onClick={() => setIsAnalog(!isAnalog)}
      className="relative cursor-pointer transition-transform duration-300 hover:scale-105 flex items-center justify-center shrink-0 w-[160px] h-[160px] lg:w-[200px] lg:h-[200px] rounded-full mx-auto md:mx-0"
      style={{
        backgroundColor: 'var(--surface)',
        backdropFilter: 'blur(12px)',
        boxShadow: 'inset 0 1px 0 var(--border), 0 0 30px rgba(var(--accent-rgb), 0.15)',
        border: '1px solid var(--border)'
      }}
    >
      {/* Inner Glow */}
      <div className="absolute inset-2 rounded-full border border-[var(--border)] pointer-events-none" style={{ boxShadow: 'inset 0 0 20px rgba(var(--accent-rgb), 0.1)' }} />

      {/* Glowing Edge Gradient */}
      <div
        className="absolute inset-0 rounded-full animate-spin-slow pointer-events-none opacity-50"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(var(--accent-rgb), 0.8) 50%, transparent 100%)',
          maskImage: 'radial-gradient(transparent 68%, black 70%)',
          WebkitMaskImage: 'radial-gradient(transparent 68%, black 70%)',
          animationDuration: '8s'
        }}
      />

      {isAnalog ? (
        /* Analog Display */
        <div className="relative w-full h-full rounded-full">
          {/* Tick Marks (render a few to look cool) */}
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${i * 30}deg)` }}>
              <div className="w-1 h-3 mt-3 rounded-full bg-[var(--surface-hover)]" />
            </div>
          ))}
          {/* Hour Hand */}
          <div className="absolute left-1/2 top-1/2 w-[4px] h-[30%] origin-bottom rounded-full z-10"
            style={{ transform: `translate(-50%, -100%) rotate(${hourDeg}deg)`, backgroundColor: 'var(--text-primary)', boxShadow: '0 0 4px var(--text-secondary)' }} />
          {/* Minute Hand */}
          <div className="absolute left-1/2 top-1/2 w-[3px] h-[40%] origin-bottom rounded-full z-20"
            style={{ transform: `translate(-50%, -100%) rotate(${minuteDeg}deg)`, backgroundColor: 'var(--text-secondary)' }} />
          {/* Second Hand */}
          <div className="absolute left-1/2 top-1/2 w-[2px] h-[45%] origin-bottom rounded-full z-30"
            style={{ transform: `translate(-50%, -100%) rotate(${secondDeg}deg)`, backgroundColor: 'var(--accent)' }} />
          {/* Center Dot */}
          <div className="absolute left-1/2 top-1/2 w-3 h-3 origin-center rounded-full z-40 transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: 'var(--accent)', border: '2px solid var(--surface-input)' }} />
        </div>
      ) : (
        /* Digital Display */
        <div className="flex items-baseline gap-1 relative z-10" style={{ textShadow: '0 0 20px rgba(var(--accent-rgb), 0.8)' }}>
          <span className="text-4xl lg:text-5xl font-semibold text-[var(--text-primary)] tracking-tight">{timeString.split(' ')[0]}</span>
          <span className="text-sm font-medium text-[var(--text-secondary)]">{ampm}</span>
        </div>
      )}
    </div>
  );
};


/* ---------------------------------
   Home Panel Main View
--------------------------------- */
function HomePanel({ onNavigate, authUser }) {
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({ totalChats: 0, activeChatName: 'No active chat', missedCalls: 0 });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const [chatsRes, callsRes] = await Promise.all([getChatPartners(), getCallLogs()]);
        const chats = chatsRes.data || [];
        const calls = callsRes.data || [];

        const missed = calls.filter(c => c.status === 'missed').length;
        let topChat = 'no one';
        if (chats.length > 0) {
          topChat = chats[0].fullName || chats[0].groupName || 'a contact';
        }

        setStats({
          totalChats: chats.length,
          activeChatName: topChat,
          missedCalls: missed
        });
      } catch (e) {
        console.error('Failed to load stats', e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="main-content-panel flex flex-col flex-1 w-full h-full mr-12 mb-0 min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-transparent">
      <div className="pt-8 md:pt-12 pb-6 pl-2 relative z-20">
        <h1 className="text-3xl md:text-5xl font-medium text-[var(--text-primary)] tracking-tight leading-none" style={{ textShadow: '0 4px 20px var(--shadow)' }}>
          {greeting}
        </h1>
      </div>

      <div className="flex-1 flex flex-col gap-6 w-full max-w-5xl pl-2 pr-6 pb-20">

        {/* -----------------------------
                    AI Summary Card
                ----------------------------- */}
        <div
          className="relative w-full rounded-3xl p-[2px] overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.4) 0%, rgba(var(--accent-secondary-rgb), 0.1) 100%)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(var(--accent-rgb),0.2)] to-transparent -translate-x-[200%] group-hover:animate-[shimmer_2.5s_infinite]" />

          <div
            className="relative w-full rounded-[23px] overflow-hidden backdrop-blur-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start"
            style={{
              backgroundColor: 'var(--surface-panel)',
              boxShadow: 'inset 0 1px 0 var(--border), 0 10px 40px var(--shadow)'
            }}
          >
            {/* Clock Left Side */}
            <div className="flex-shrink-0 relative">
              <ClockWidget />
              <div className="absolute -bottom-4 inset-x-0 text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-tertiary)] backdrop-blur-md bg-[var(--surface-panel)] px-3 py-1 rounded-full border border-[var(--border)]">
                  Click to Toggle
                </span>
              </div>
            </div>

            {/* Summary Content Right Side */}
            <div className="flex-1 flex flex-col justify-center h-full w-full">
              <div className="flex items-center gap-3 mb-4 mt-2">
                <div className="p-2 rounded-xl bg-[var(--surface)] shadow-[inset_0_1px_0_var(--border-hover)]">
                  <Activity className="w-6 h-6 text-[var(--text-primary)]" style={{ filter: 'drop-shadow(0 0 8px var(--text-secondary))' }} />
                </div>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-wide">Nexus Summary</h2>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-white/20 via-white/10 to-transparent my-3" />

              <p className="text-[var(--text-secondary)] text-lg mb-5 font-medium">Here's your activity for today:</p>

              <ul className="flex flex-col gap-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                  <span className="text-[var(--text-primary)] text-base">You have <strong className="text-[var(--text-primary)]">{stats.totalChats} active chats</strong> currently.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                  <span className="text-[var(--text-primary)] text-base">Your most active chat was with <strong className="text-[var(--text-primary)]">{stats.activeChatName}</strong>.</span>
                </li>
                {stats.missedCalls > 0 && (
                  <li className="flex items-start gap-3">
                    <PhoneMissed className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--status-danger, #ff4d4d)' }} />
                    <span className="text-[var(--text-primary)] text-base">You missed <strong style={{ color: 'var(--status-danger, #ff4d4d)' }}>{stats.missedCalls} calls</strong>.</span>
                  </li>
                )}
              </ul>

              <div className="mt-auto flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="relative w-3 h-3">
                    <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ backgroundColor: 'var(--status-online, #00ff00)' }} />
                    <div className="absolute inset-[2px] rounded-full" style={{ backgroundColor: 'var(--status-online, #00ff00)', boxShadow: '0 0 10px var(--status-online-shadow, #00ff00)' }} />
                  </div>
                  <span className="text-xs font-medium text-[var(--text-secondary)] tracking-wider uppercase">System Activity</span>
                </div>

                <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-hover)] hover:bg-[var(--surface)] border border-[var(--border)] transition-colors">
                  <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -----------------------------
                    Start New Chat Button
                ----------------------------- */}
        <div className="flex justify-center md:justify-start w-full mt-2">
          <button
            onClick={() => onNavigate && onNavigate('contacts')}
            className="group relative px-6 py-4 rounded-2xl flex items-center gap-3 overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: 'linear-gradient(to right, rgba(var(--accent-rgb), 0.2), rgba(var(--accent-secondary-rgb), 0.2))',
              border: '1px solid rgba(var(--accent-rgb), 0.4)',
              boxShadow: '0 8px 30px var(--shadow)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(var(--accent-rgb),0.3)] to-[rgba(var(--accent-secondary-rgb),0.3)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Plus className="w-6 h-6 text-[var(--text-primary)] relative z-10" />
            <span className="text-[var(--text-primary)] font-medium text-lg tracking-wide relative z-10">Start New Chat</span>
          </button>
        </div>

        {/* -----------------------------
                    Secondary Widgets Grid
                ----------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Widget 1 */}
          <div
            onClick={() => onNavigate && onNavigate('call-log')}
            className="rounded-2xl p-5 border backdrop-blur-xl transition-transform hover:-translate-y-1 cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(var(--accent-rgb), 0.1)' }}>
                <PhoneMissed className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-tertiary)]">CALLS</span>
            </div>
            <h3 className="text-[var(--text-primary)] font-medium mb-1">Missed Calls ({stats.missedCalls})</h3>
            <p className="text-[var(--text-tertiary)] text-sm">Review your call history</p>
          </div>

          {/* Widget 2 */}
          <div
            onClick={() => onNavigate && onNavigate('messages')}
            className="rounded-2xl p-5 border backdrop-blur-xl transition-transform hover:-translate-y-1 cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 rounded-lg" style={{ background: 'rgba(var(--accent-secondary-rgb), 0.1)' }}>
                <MessageSquare className="w-5 h-5" style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-[var(--surface-hover)] text-[var(--text-tertiary)]">MESSAGES</span>
            </div>
            <h3 className="text-[var(--text-primary)] font-medium mb-1">Active Chats ({stats.totalChats})</h3>
            <p className="text-[var(--text-tertiary)] text-sm">Jump back into the conversation</p>
          </div>
        </div>

      </div>

      {/* Custom Animations for Home */}
      <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
                .animate-spin-slow {
                    animation: spin 10s linear infinite;
                }
            `}</style>
    </div>
  );
}

export default HomePanel;
