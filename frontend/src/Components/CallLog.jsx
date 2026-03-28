import { Search, X, Phone, Video, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { getCallLogs } from "../api";

function CallLogPanel({ authUser, onStartCall }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const searchInputRef = useRef(null);

  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const getGradient = (name) => {
    const colors = [
      ["#30FBE6", "#a855f7"],
      ["#f472b6", "#a855f7"],
      ["#3b82f6", "#8b5cf6"],
      ["#10b981", "#3b82f6"],
      ["#f59e0b", "#ef4444"],
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
    const color = colors[hash % colors.length];
    return `linear-gradient(135deg, ${color[0]}, ${color[1]})`;
  };

  const fetchLogs = async () => {
    try {
      const res = await getCallLogs();
      const formatted = res.data.map(call => {
        const isCaller = call.callerId?._id === authUser?._id;
        const otherUser = isCaller ? call.receiverId : call.callerId;

        let type = isCaller ? 'outgoing' : 'incoming';

        const dateObj = new Date(call.startedAt || call.createdAt);
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let dateDisplay = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        // Optional: 'Yesterday', 'Today' logic
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dateObj.toDateString() === today.toDateString()) {
          dateDisplay = 'Today';
        } else if (dateObj.toDateString() === yesterday.toDateString()) {
          dateDisplay = 'Yesterday';
        }

        if (["missed", "rejected", "canceled", "failed"].includes(call.status)) {
          dateDisplay = call.status.charAt(0).toUpperCase() + call.status.slice(1);
        }

        const name = otherUser?.fullName || 'Unknown';
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        return {
          id: call._id,
          name,
          number: name,
          time,
          date: dateDisplay,
          type,
          status: call.status,
          callType: call.type,
          initials,
          gradient: getGradient(name),
          otherUser,
        };
      });
      setCallLogs(formatted);
    } catch (err) {
      console.error('Error fetching call logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCalls = () => {
    let filtered = callLogs;
    if (activeFilter === "missed") filtered = callLogs.filter(c => ["missed", "rejected", "canceled", "failed"].includes(c.status));
    else if (activeFilter === "incoming") filtered = callLogs.filter(c => c.type === "incoming");
    else if (activeFilter === "outgoing") filtered = callLogs.filter(c => c.type === "outgoing");
    else if (activeFilter === "voice") filtered = callLogs.filter(c => c.callType === "voice");
    else if (activeFilter === "video") filtered = callLogs.filter(c => c.callType === "video");

    if (searchQuery.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return filtered;
  };

  const filteredCalls = getFilteredCalls();

  const filters = [
    { key: "all", label: "All" },
    { key: "missed", label: "Missed" },
    { key: "incoming", label: "Incoming" },
    { key: "outgoing", label: "Outgoing" },
    { key: "voice", label: "Voice", icon: <Phone size={12} /> },
    { key: "video", label: "Video", icon: <Video size={12} /> },
  ];

  return (
    <div className="flex flex-col flex-1 h-full mr-12 min-w-[840px] mb-2">
      {/* Title */}
      <div className="pt-[60px] pb-0 pl-2 flex justify-between items-end mb-[-30px] relative z-20">
        <h2 className="text-[24px] font-medium text-white/90 tracking-[0.5px] font-sans leading-none pb-0">Call Log</h2>
      </div>

      {/* Main Glass Panel */}
      <div className="relative flex-1 rounded-[14px] border border-white/8 overflow-hidden backdrop-blur-3xl bg-linear-to-br from-[#0b1220]/40 via-[#2b1b3a]/20 to-[#091021]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px" }}>
          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              margin: "4px 0 8px 0",
              padding: "8px 12px",
              borderRadius: "10px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "border-color 0.2s",
            }}
          >
            <Search size={15} style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calls..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "13px",
                fontFamily: "'Inter', sans-serif",
                caretColor: "#30FBE6",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  padding: "4px",
                  borderRadius: "6px",
                  border: "none",
                  background: "transparent",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", padding: "4px 4px 8px 4px" }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  fontWeight: 500,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  border: activeFilter === f.key ? "1px solid rgba(48, 251, 230, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: activeFilter === f.key ? "rgba(48, 251, 230, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  color: activeFilter === f.key ? "#30FBE6" : "rgba(255, 255, 255, 0.5)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== f.key) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== f.key) {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                  }
                }}
              >
                {f.icon}{f.label}
              </button>
            ))}
          </div>

          {/* Call count */}
          <div style={{ padding: "0 8px 4px 8px" }}>
            <span style={{
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.4)",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.04em",
            }}>
              {loading ? "Loading..." : `${filteredCalls.length} call${filteredCalls.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          {/* Call List */}
          <div
            className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent"
            style={{ flex: 1, paddingLeft: "4px", paddingRight: "4px", paddingBottom: "100px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredCalls.map((call) => (
                <div
                  key={call.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: "transparent",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    {call.otherUser?.profilePic ? (
                      <img
                        src={call.otherUser.profilePic}
                        alt={call.name}
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: call.gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "rgba(255, 255, 255, 0.95)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {call.initials}
                      </div>
                    )}
                    {/* Call direction indicator */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: call.status === "missed" ? "rgba(239, 68, 68, 0.9)" : "rgba(34, 197, 94, 0.9)",
                        border: "2px solid rgba(11, 18, 32, 0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {call.type === "incoming" ? (
                        <ArrowDownLeft size={10} style={{ color: "white" }} />
                      ) : (
                        <ArrowUpRight size={10} style={{ color: "white" }} />
                      )}
                    </div>
                  </div>

                  {/* Name & number */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: call.status === "missed" ? "rgba(239, 68, 68, 0.9)" : "rgba(255, 255, 255, 0.92)",
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: "2px",
                    }}>
                      {call.name}
                    </div>
                    <div style={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.45)",
                      fontFamily: "'Inter', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      {call.callType === "video" ? <Video size={10} /> : <Phone size={10} />}
                      {call.number}
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{
                      fontSize: "11px",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontFamily: "'Inter', sans-serif",
                      marginBottom: "2px",
                    }}>
                      {call.time}
                    </div>
                    <div style={{
                      fontSize: "10px",
                      color: call.status === "missed" ? "rgba(239, 68, 68, 0.7)" : "rgba(255, 255, 255, 0.35)",
                      fontFamily: "'Inter', sans-serif",
                    }}>
                      {call.date}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartCall && call.otherUser) {
                          onStartCall('voice', call.otherUser);
                        }
                      }}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255, 255, 255, 0.5)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(48, 251, 230, 0.12)";
                        e.currentTarget.style.color = "#30FBE6";
                        e.currentTarget.style.borderColor = "rgba(48, 251, 230, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      }}
                    >
                      <Phone size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onStartCall && call.otherUser) {
                          onStartCall('video', call.otherUser);
                        }
                      }}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255, 255, 255, 0.5)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(48, 251, 230, 0.12)";
                        e.currentTarget.style.color = "#30FBE6";
                        e.currentTarget.style.borderColor = "rgba(48, 251, 230, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      }}
                    >
                      <Video size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredCalls.length === 0 && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "60px 20px",
                  gap: "12px",
                }}>
                  <Phone size={32} style={{ color: "rgba(255, 255, 255, 0.15)" }} />
                  <span style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.35)",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    No calls found
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallLogPanel;