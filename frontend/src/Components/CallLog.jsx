import { Search, MoreVertical, Phone, Video, ArrowDownLeft, ArrowUpRight, X } from "lucide-react";
import { useState } from "react";

function CallLogPanel() {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCall, setHoveredCall] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const callLogs = [
    {
      id: 1,
      name: "Sarah Jenkins",
      number: "+1 123 456 789",
      time: "10:42 PM",
      date: "04-21",
      type: "incoming",
      status: "answered",
      callType: "voice", 
    },
    {
      id: 2,
      name: "Alex Chen",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "Missed",
      type: "outgoing",
      status: "missed",
      callType: "video", 
    },
    {
      id: 3,
      name: "Sarah Jenkins",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "04-21",
      type: "incoming",
      status: "answered",
      callType: "voice",
    },
    {
      id: 4,
      name: "Sarah Jenkins",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "04-21",
      type: "incoming",
      status: "answered",
      callType: "video",
    },
    {
      id: 5,
      name: "Alex Chen",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "Missed",
      type: "outgoing",
      status: "missed",
      callType: "voice",
    },
    {
      id: 6,
      name: "Sarah Jenkins",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "04-21",
      type: "incoming",
      status: "answered",
      callType: "video",
    },
    {
      id: 7,
      name: "Alex Chen",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "04-21",
      type: "outgoing",
      status: "answered",
      callType: "voice",
    },
  ];

  const getFilteredCalls = () => {
    let calls = callLogs;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const cleanedQuery = searchQuery.replace(/\D/g, ""); 

      calls = calls.filter((call) => {
        const nameMatch = call.name.toLowerCase().includes(lowerQuery);
        const cleanedNumber = call.number.replace(/\D/g, "");
        const numberMatch = cleanedQuery.length > 0 && cleanedNumber.includes(cleanedQuery);

        return nameMatch || numberMatch;
      });
    }

    if (activeFilter === "all") return calls;
    if (activeFilter === "missed") return calls.filter(call => call.status === "missed");
    if (activeFilter === "incoming") return calls.filter(call => call.type === "incoming");
    if (activeFilter === "outgoing") return calls.filter(call => call.type === "outgoing");
    if (activeFilter === "voice") return calls.filter(call => call.callType === "voice");
    if (activeFilter === "video") return calls.filter(call => call.callType === "video");
    
    return calls;
  };

  const filteredCalls = getFilteredCalls();

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ 
        boxSizing: "border-box",
        paddingRight: "24px", 
        paddingBottom: "32px",
        fontFamily: "'Inter', sans-serif",
       }}
    >
      <div style={{ padding: '10px 10px 25px 10px'  }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 500, 
          color: 'rgba(255, 255, 255, 0.9)',
          letterSpacing: '0.5px',
        }}>
          Call Log
        </h2>
      </div>
      <div
        className="w-full h-full rounded-2xl flex flex-col"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          maxHeight: "100%", 
        }}
      >
        <div 
          style={{ 
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <div 
            className="flex" 
            style={{ 
              gap: "8px", 
              overflowX: "auto", 
              scrollbarWidth: "none", 
              msOverflowStyle: "none", 
              paddingBottom: "4px", 
              alignItems: "center",
              flex: 1, 
              minWidth: 0, 
            }}
          >
            <style>{`
              .flex::-webkit-scrollbar { display: none; }
            `}</style>
            
            {["all", "missed", "incoming", "outgoing", "voice", "video"].map((filter) => (
                <button
                key={filter}
                style={{
                    background: activeFilter === filter ? "rgba(139, 237, 233, 0.9)" : "rgba(255, 255, 255, 0.1)",
                    color: activeFilter === filter ? "#1a1a2e" : "white",
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "none",
                    whiteSpace: "nowrap",
                    transform: hoveredButton === filter ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textTransform: "capitalize",
                    flexShrink: 0 
                }}
                onMouseEnter={() => setHoveredButton(filter)}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => setActiveFilter(filter)}
                >
                {filter === "voice" && <Phone size={12} />}
                {filter === "video" && <Video size={12} />}
                {filter}
                </button>
            ))}
          </div>

          <div className="flex items-center" style={{ gap: "12px", flexShrink: 0 }}>
              
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: isSearchActive ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  borderRadius: "99px",
                  padding: isSearchActive ? "6px 12px" : "6px",
                  transition: "all 0.3s ease",
                  border: isSearchActive ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                  width: isSearchActive ? "220px" : "36px", 
                }}
              >
                <Search
                  className="text-white cursor-pointer"
                  size={20}
                  style={{
                    opacity: hoveredIcon === "search" ? 1 : 0.7,
                    minWidth: "20px",
                  }}
                  onClick={() => setIsSearchActive(true)}
                  onMouseEnter={() => setHoveredIcon("search")}
                  onMouseLeave={() => setHoveredIcon(null)}
                />
                
                {isSearchActive && (
                  <>
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "white",
                        marginLeft: "8px",
                        fontSize: "14px",
                        width: "100%"
                      }}
                    />
                    <X 
                      size={16} 
                      className="text-white cursor-pointer" 
                      style={{ opacity: 0.7 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                        setIsSearchActive(false);
                      }}
                    />
                  </>
                )}
              </div>

              {!isSearchActive && (
                <MoreVertical
                  className="text-white cursor-pointer"
                  size={20}
                  style={{
                    opacity: hoveredIcon === "more" ? 1 : 0.7,
                    transform: hoveredIcon === "more" ? "scale(1.1)" : "scale(1)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={() => setHoveredIcon("more")}
                  onMouseLeave={() => setHoveredIcon(null)}
                />
              )}
            </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 32px 32px",
          }}
        >
          {filteredCalls.length > 0 ? (
            filteredCalls.map((call) => (
              <div
                key={call.id}
                style={{
                  marginBottom: "12px",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredCall(call.id)}
                onMouseLeave={() => setHoveredCall(null)}
              >
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background:
                      hoveredCall === call.id
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(180, 180, 180, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: "rgba(139, 237, 233, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "rgba(139, 237, 233, 1)",
                    }}
                  >
                    {call.name.charAt(0)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "white",
                        marginBottom: "4px",
                      }}
                    >
                      {call.name}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        color: "rgba(255, 255, 255, 0.5)",
                      }}
                    >
                      {call.number}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {call.callType === "video" ? (
                      <Video size={18} style={{ color: "rgba(139, 237, 233, 0.7)" }} />
                    ) : (
                      <Phone size={18} style={{ color: "rgba(139, 237, 233, 0.7)" }} />
                    )}
                    
                    {call.type === "incoming" ? (
                      <ArrowDownLeft size={20} style={{ color: "rgba(139, 237, 233, 1)" }} />
                    ) : (
                      <ArrowUpRight
                        size={20}
                        style={{ color: call.status === "missed" ? "rgba(255, 107, 107, 1)" : "rgba(139, 237, 233, 1)" }}
                      />
                    )}
                  </div>

                  <div style={{ 
                      minWidth: "120px", 
                      display: "flex", 
                      justifyContent: "flex-end",
                      alignItems: "center"
                  }}>
                    {hoveredCall === call.id ? (
                      <div style={{ display: "flex", gap: "8px", animation: "fadeIn 0.2s ease-in" }}>
                        <button
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: hoveredAction === `phone-${call.id}` ? "rgba(139, 237, 233, 0.3)" : "rgba(255, 255, 255, 0.1)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={() => setHoveredAction(`phone-${call.id}`)}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <Phone size={18} className="text-white" />
                        </button>
                        <button
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background: hoveredAction === `video-${call.id}` ? "rgba(139, 237, 233, 0.3)" : "rgba(255, 255, 255, 0.1)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={() => setHoveredAction(`video-${call.id}`)}
                          onMouseLeave={() => setHoveredAction(null)}
                        >
                          <Video size={18} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "white",
                            marginBottom: "4px",
                          }}
                        >
                          {call.time}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: call.status === "missed" ? "rgba(255, 107, 107, 1)" : "rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          {call.date}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginTop: "40px" }}>
              No calls found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CallLogPanel;