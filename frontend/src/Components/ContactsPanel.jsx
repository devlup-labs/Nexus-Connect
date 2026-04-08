import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  User,
  Mail,
  Phone,
  Info,
  MessageSquare,
  Video,
  UserX,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import ContextMenu from "./ContextMenu";
import { getContacts } from "../api";
import { getSocket, getActiveUsers } from "../services/socket";

// Mock data removed. Fetching from backend instead.

const statusColors = {
  online: "var(--status-online)",
  offline: "var(--text-tertiary)",
};

const statusLabels = {
  online: "Online",
  offline: "Offline",
};

const ContactsPanel = ({ onSendMessage }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => {
    const users = getActiveUsers();
    const map = {};
    users.forEach((id) => {
      map[id] = "online";
    });
    return map;
  });
  const [lightboxPic, setLightboxPic] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await getContacts();
        setContacts(res.data);
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  // ── WebSocket listeners for real-time online status ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUserStatus = (data) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [data.userId]: data.status,
      }));
    };

    const handleActiveUsers = (activeUserIds) => {
      const onlineMap = {};
      activeUserIds.forEach((id) => {
        onlineMap[id] = "online";
      });
      setOnlineUsers(onlineMap);
    };

    socket.on("user_status_update", handleUserStatus);
    socket.on("active_users", handleActiveUsers);

    return () => {
      socket.off("user_status_update", handleUserStatus);
      socket.off("active_users", handleActiveUsers);
    };
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredContacts = (contacts || []).filter((c) =>
    (c.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Simple sort (real data might not have online/offline status in the same way)
  const sortedContacts = [...filteredContacts];

  const openProfile = (contact) => {
    setSelectedContact(contact);
  };

  const getContextMenuItems = (contact) => [
    { label: "Message", icon: <MessageSquare size={16} />, onClick: () => { } },
    { label: "Voice Call", icon: <Phone size={16} />, onClick: () => { } },
    { label: "Video Call", icon: <Video size={16} />, onClick: () => { } },
    { divider: true },
    {
      label: "View Profile",
      icon: <User size={16} />,
      onClick: () => openProfile(contact),
    },
    { divider: true },
    {
      label: "Block",
      icon: <UserX size={16} />,
      color: "var(--text-primary)",
      onClick: () => { },
    },
    {
      label: "Delete Contact",
      icon: <Trash2 size={16} />,
      color: "var(--status-danger)",
      onClick: () => { },
    },
  ];

  return (
    <div className="w-[320px] lg:w-[420px] shrink-0 relative z-10 flex flex-col h-full overflow-hidden bg-transparent">
      {/* Title */}
      <div style={{ padding: "10px 10px 0px 10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2
          style={{ fontSize: "24px", fontWeight: 500, paddingTop: "50px", paddingBottom: "0px", marginBottom: "0px", color: "var(--text-primary)", letterSpacing: "0.5px", fontFamily: "var(--font-main)", lineHeight: 1 }}
        >
          Contacts
        </h2>
      </div>

      {/* Main Glass Panel */}
      <div className="relative flex-1 rounded-[14px] border border-[var(--border)] overflow-hidden backdrop-blur-3xl bg-[var(--surface-panel)] shadow-[0_8px_32px_var(--shadow)]">
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
              background: "var(--surface-input)",
              border: "1px solid var(--border)",
              transition: "border-color 0.2s",
            }}
          >
            <Search
              size={15}
              style={{ color: "var(--text-tertiary)", flexShrink: 0 }}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontFamily: "var(--font-main)",
                caretColor: "var(--accent)",
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
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-secondary)")
                }
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Contact count */}
          <div style={{ padding: "4px 8px 4px 8px" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-main)",
                letterSpacing: "0.04em",
              }}
            >
              {sortedContacts.length} contact
              {sortedContacts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Contact List */}
          <div
            className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent"
            style={{
              flex: 1,
              paddingLeft: "4px",
              paddingRight: "4px",
              paddingBottom: "100px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {sortedContacts.map((contact) => (
                <div
                  key={contact._id}
                  onClick={() => openProfile(contact)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, contact });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background:
                      selectedContact?._id === contact._id
                        ? "var(--surface-hover)"
                        : "transparent",
                    border:
                      selectedContact?._id === contact._id
                        ? "1px solid var(--border-accent)"
                        : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedContact?._id !== contact._id) {
                      e.currentTarget.style.background =
                        "var(--surface)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedContact?._id !== contact._id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        boxShadow: "0 2px 10px var(--shadow)",
                        fontFamily: "var(--font-main)",
                        overflow: "hidden",
                      }}
                    >
                      {contact.profilePic ? (
                        <img src={contact.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(contact.fullName)
                      )}
                    </div>
                    {/* Online indicator dot */}
                    {onlineUsers[contact._id] === "online" && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-1px",
                          right: "-1px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "var(--status-online)",
                          border: "2px solid var(--bg-base)",
                          boxShadow: "0 0 8px var(--status-online-shadow)",
                        }}
                      />
                    )}
                  </div>

                  {/* Name & status text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        fontFamily: "var(--font-main)",
                        marginBottom: "2px",
                      }}
                    >
                      {contact.fullName}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-main)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contact.about || "No bio available"}
                    </div>
                  </div>
                </div>
              ))}

              {sortedContacts.length === 0 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 20px",
                    gap: "12px",
                  }}
                >
                  <Search
                    size={32}
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-main)",
                    }}
                  >
                    No contacts found
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Slide-in Panel */}
      {selectedContact && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelectedContact(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--shadow)",
              zIndex: 99,
              animation: "fadeIn 0.2s ease-out",
            }}
          />
          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "380px",
              height: "100%",
              background: "var(--bg-base)",
              backdropFilter: "blur(40px) saturate(180%)",
              borderLeft: "1px solid var(--border)",
              boxShadow: "-10px 0 40px var(--shadow)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "24px",
              animation: "slideInRight 0.25s ease-out",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                }}
              >
                Profile
              </span>
              <button
                onClick={() => setSelectedContact(null)}
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Avatar */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div
                  onClick={() => selectedContact.profilePic && setLightboxPic(selectedContact.profilePic)}
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    padding: "3px",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                    boxShadow: "0 0 25px var(--shadow-glow)",
                    overflow: "hidden",
                    cursor: selectedContact.profilePic ? "pointer" : "default",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => { if (selectedContact.profilePic) e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {selectedContact.profilePic ? (
                    <img src={selectedContact.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "var(--surface-input)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-main)",
                      }}
                    >
                      {getInitials(selectedContact.fullName)}
                    </div>
                  )}
                </div>
                {/* Online indicator dot on PFP */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: onlineUsers[selectedContact._id] === "online" ? "var(--status-online)" : "var(--text-tertiary)",
                    border: "3px solid var(--bg-base)",
                    boxShadow: onlineUsers[selectedContact._id] === "online" ? "0 0 8px var(--status-online-shadow)" : "none",
                  }}
                />
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                  textAlign: "center",
                }}
              >
                {selectedContact.fullName}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  color: onlineUsers[selectedContact._id] === "online" ? statusColors.online : statusColors.offline,
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: onlineUsers[selectedContact._id] === "online" ? statusColors.online : statusColors.offline,
                  }}
                />
                {onlineUsers[selectedContact._id] === "online" ? statusLabels.online : statusLabels.offline}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, var(--border), transparent)",
                marginBottom: "20px",
              }}
            />

            {/* Profile Details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                flex: 1,
              }}
            >
              {/* About */}
              <ProfileField
                icon={<Info size={14} style={{ color: "var(--accent-secondary)" }} />}
                label="About"
                value={selectedContact.about}
              />

              {/* Email */}
              <ProfileField
                icon={<Mail size={14} style={{ color: "var(--accent)" }} />}
                label="Email"
                value={selectedContact.email}
                interactive
              />

              {/* Phone */}
              <ProfileField
                icon={<Phone size={14} style={{ color: "var(--status-online)" }} />}
                label="Phone"
                value={selectedContact.phone}
                interactive
              />

              {/* Member Since */}
              <ProfileField
                icon={<User size={14} style={{ color: "var(--accent-secondary)" }} />}
                label="Member Since"
                value={selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleDateString() : "Unknown"}
                interactive
              />
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                onClick={() => {
                  if (onSendMessage) {
                    onSendMessage(selectedContact);
                    setSelectedContact(null);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-accent-strong)",
                  background: "var(--surface-input)",
                  color: "var(--accent)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "var(--font-main)",
                }}
                onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--surface-selected)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "var(--surface-input)")
                }
              >
                Send Message
              </button>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "var(--font-main)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--surface-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "var(--surface)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                Block User
              </button>
            </div>
          </div>
        </>
      )}

      {/* CSS Animations */}
      <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={getContextMenuItems(contextMenu.contact)}
        />
      )}

      {/* PFP Lightbox */}
      {lightboxPic && (
        <div
          onClick={() => setLightboxPic(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "var(--shadow)",
            backdropFilter: "blur(20px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxPic(null); }}
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              zIndex: 201,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "var(--surface-hover)",
              border: "1px solid var(--border-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-primary)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxPic}
            alt="Profile"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 20px 60px var(--shadow)",
              cursor: "default",
              animation: "fadeIn 0.25s ease-out",
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ---------- SMALL SUB-COMPONENT ---------- */

const ProfileField = ({ icon, label, value, interactive }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: "12px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      cursor: interactive ? "pointer" : "default",
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      if (interactive) {
        e.currentTarget.style.background = "var(--surface-hover)";
        e.currentTarget.style.borderColor = "var(--border-hover)";
      }
    }}
    onMouseLeave={(e) => {
      if (interactive) {
        e.currentTarget.style.background = "var(--surface)";
        e.currentTarget.style.borderColor = "var(--border)";
      }
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: label === "About" ? "8px" : "4px",
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {icon}
      </span>
      <span
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </span>
    </div>
    <p
      style={{
        fontSize: "13px",
        color: "var(--text-primary)",
        lineHeight: 1.5,
        marginLeft: "24px",
      }}
    >
      {value}
    </p>
  </div>
);

export default ContactsPanel;
