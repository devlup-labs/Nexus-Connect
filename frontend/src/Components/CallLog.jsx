import { Search, MoreVertical, Phone, Video, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Field } from "./Settings";

function CallLogPanel() {
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredCall, setHoveredCall] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Call log data
  const callLogs = [
    {
      id: 1,
      name: "Sarah Jenkins",
      number: "+1 123 456 789",
      time: "10:42 PM",
      date: "04-21",
      type: "incoming",
      status: "answered",
      callType: "voice", // Added call type
    },
    {
      id: 2,
      name: "Alex Chen",
      number: "+1 123 456 789",
      time: "Yesterday",
      date: "Missed",
      type: "outgoing",
      status: "missed",
      callType: "video", // Added call type
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

  // Filter function
  const getFilteredCalls = () => {
    if (activeFilter === "all") {
      return callLogs;
    } else if (activeFilter === "missed") {
      return callLogs.filter(call => call.status === "missed");
    } else if (activeFilter === "incoming") {
      return callLogs.filter(call => call.type === "incoming");
    } else if (activeFilter === "outgoing") {
      return callLogs.filter(call => call.type === "outgoing");
    }
    return callLogs;
  };

  const filteredCalls = getFilteredCalls();

  return (
    <div
      className="w-220 h-screen"
      style={{ padding: "24px", boxSizing: "border-box" }}
    >
      <div
        className="w-full h-full rounded-2xl flex flex-col"
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "32px 32px 24px" }}>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: "24px" }}
          >
            <h2
              style={{
                fontSize: "32px",
                fontWeight: 500,
                color: "white",
                margin: 0,
              }}
            >
              Call Log
            </h2>
            <div className="flex items-center" style={{ gap: "16px" }}>
              <Search
                className="text-white cursor-pointer"
                size={24}
                style={{
                  opacity: hoveredIcon === "search" ? 1 : 0.7,
                  transform:
                    hoveredIcon === "search" ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={() => setHoveredIcon("search")}
                onMouseLeave={() => setHoveredIcon(null)}
              />
              <MoreVertical
                className="text-white cursor-pointer"
                size={24}
                style={{
                  opacity: hoveredIcon === "more" ? 1 : 0.7,
                  transform: hoveredIcon === "more" ? "scale(1.1)" : "scale(1)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={() => setHoveredIcon("more")}
                onMouseLeave={() => setHoveredIcon(null)}
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex" style={{ gap: "12px" }}>
            <button
              style={{
                background: activeFilter === "all" ? "rgba(139, 237, 233, 0.9)" : "rgba(255, 255, 255, 0.1)",
                color: activeFilter === "all" ? "#1a1a2e" : "white",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                transform: hoveredButton === "all" ? "scale(1.02)" : "scale(1)",
                boxShadow:
                  hoveredButton === "all" && activeFilter === "all"
                    ? "0 4px 12px rgba(139, 237, 233, 0.3)"
                    : "none",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHoveredButton("all")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            <button
              style={{
                background: activeFilter === "missed" ? "rgba(255, 107, 107, 0.9)" : "rgba(255, 255, 255, 0.1)",
                color: "white",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                transform:
                  hoveredButton === "missed" ? "scale(1.02)" : "scale(1)",
                boxShadow:
                  hoveredButton === "missed" && activeFilter === "missed"
                    ? "0 4px 12px rgba(255, 107, 107, 0.3)"
                    : "none",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHoveredButton("missed")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setActiveFilter("missed")}
            >
              Missed
            </button>
            <button
              style={{
                background:
                  hoveredButton === "incoming" || activeFilter === "incoming"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.1)",
                color: "white",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                transform:
                  hoveredButton === "incoming" ? "scale(1.02)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHoveredButton("incoming")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setActiveFilter("incoming")}
            >
              Incoming
            </button>
            <button
              style={{
                background:
                  hoveredButton === "outgoing" || activeFilter === "outgoing"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.1)",
                color: "white",
                padding: "8px 20px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                border: "none",
                transform:
                  hoveredButton === "outgoing" ? "scale(1.02)" : "scale(1)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={() => setHoveredButton("outgoing")}
              onMouseLeave={() => setHoveredButton(null)}
              onClick={() => setActiveFilter("outgoing")}
            >
              Outgoing
            </button>
          </div>
        </div>

        {/* Call Log List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 32px 32px",
          }}
        >
          {filteredCalls.map((call) => (
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
                {/* Avatar */}
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

                {/* Contact Info */}
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

                {/* Call Type & Direction Icons */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {/* Call Type Icon (Voice or Video) */}
                  {call.callType === "video" ? (
                    <Video
                      size={18}
                      style={{
                        color: "rgba(139, 237, 233, 0.7)",
                      }}
                    />
                  ) : (
                    <Phone
                      size={18}
                      style={{
                        color: "rgba(139, 237, 233, 0.7)",
                      }}
                    />
                  )}
                  
                  {/* Direction Icon */}
                  {call.type === "incoming" ? (
                    <ArrowDownLeft
                      size={20}
                      style={{
                        color: "rgba(139, 237, 233, 1)",
                      }}
                    />
                  ) : (
                    <ArrowUpRight
                      size={20}
                      style={{
                        color: call.status === "missed" ? "rgba(255, 107, 107, 1)" : "rgba(139, 237, 233, 1)",
                      }}
                    />
                  )}
                </div>

                {/* Time and Date */}
                <div style={{ textAlign: "right", minWidth: "80px" }}>
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

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: hoveredAction === `phone-${call.id}` ? "rgba(139, 237, 233, 0.3)" : "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: hoveredAction === `phone-${call.id}` ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={() => setHoveredAction(`phone-${call.id}`)}
                    onMouseLeave={() => setHoveredAction(null)}
                  >
                    <Phone size={20} className="text-white" />
                  </button>
                  <button
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      background: hoveredAction === `video-${call.id}` ? "rgba(139, 237, 233, 0.3)" : "rgba(255, 255, 255, 0.1)",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: hoveredAction === `video-${call.id}` ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={() => setHoveredAction(`video-${call.id}`)}
                    onMouseLeave={() => setHoveredAction(null)}
                  >
                    <Video size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CallLogPanel;