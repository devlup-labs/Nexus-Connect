import { Search, X, Phone, Video, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState, useRef } from "react";

function CallLogPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const searchInputRef = useRef(null);

  const callLogs = [
    { id: 1, name: "Sarah Jenkins", number: "+1 123 456 789", time: "10:42 PM", date: "04-21", type: "incoming", status: "answered", callType: "voice", initials: "SJ", gradient: "linear-gradient(135deg, #30FBE6, #a855f7)" },
    { id: 2, name: "Alex Chen", number: "+1 123 456 789", time: "Yesterday", date: "Missed", type: "outgoing", status: "missed", callType: "video", initials: "AC", gradient: "linear-gradient(135deg, #f472b6, #a855f7)" },
    { id: 3, name: "Sarah Jenkins", number: "+1 123 456 789", time: "Yesterday", date: "04-21", type: "incoming", status: "answered", callType: "voice", initials: "SJ", gradient: "linear-gradient(135deg, #30FBE6, #a855f7)" },
    { id: 4, name: "Sarah Jenkins", number: "+1 123 456 789", time: "Yesterday", date: "04-21", type: "incoming", status: "answered", callType: "video", initials: "SJ", gradient: "linear-gradient(135deg, #30FBE6, #a855f7)" },
    { id: 5, name: "Alex Chen", number: "+1 123 456 789", time: "Yesterday", date: "Missed", type: "outgoing", status: "missed", callType: "voice", initials: "AC", gradient: "linear-gradient(135deg, #f472b6, #a855f7)" },
    { id: 6, name: "Sarah Jenkins", number: "+1 123 456 789", time: "Yesterday", date: "04-21", type: "incoming", status: "answered", callType: "video", initials: "SJ", gradient: "linear-gradient(135deg, #30FBE6, #a855f7)" },
    { id: 7, name: "Alex Chen", number: "+1 123 456 789", time: "Yesterday", date: "04-21", type: "outgoing", status: "answered", callType: "voice", initials: "AC", gradient: "linear-gradient(135deg, #f472b6, #a855f7)" },
  ];

  const getFilteredCalls = () => {
    let filtered = callLogs;
    if (activeFilter === "missed") filtered = callLogs.filter(c => c.status === "missed");
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
    <div style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '24px', paddingBottom: '24px' }}>
      {/* Title */}
      <div style={{ padding: "10px 10px 20px 10px" }}>
        <h2
          className="text-[24px] font-medium text-white/90 tracking-[0.5px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Call Log
        </h2>
      </div>

      {/* Main Glass Panel */}
      <div className="relative flex-1 rounded-[14px] border border-white/8 overflow-hidden backdrop-blur-3xl bg-gradient-to-br from-[#0b1220]/40 via-[#2b1b3a]/20 to-[#091021]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
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
              {filteredCalls.length} call{filteredCalls.length !== 1 ? "s" : ""}
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