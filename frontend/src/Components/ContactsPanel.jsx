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

// Mock data removed. Fetching from backend instead.

const statusColors = {
  online: "#22c55e",
  offline: "#6b7280",
};

const statusLabels = {
  online: "Online",
  offline: "Offline",
};

const ContactsPanel = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
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
      color: "#f59e0b",
      onClick: () => { },
    },
    {
      label: "Delete Contact",
      icon: <Trash2 size={16} />,
      color: "#ef4444",
      onClick: () => { },
    },
  ];

  return (
    <div style={{ width: '420px', maxWidth: '420px', height: '100%', background: 'transparent', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
      {/* Title */}
      <div style={{ padding: "10px 10px 0px 10px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h2
          style={{ fontSize: "24px", fontWeight: 500, paddingTop: "50px", paddingBottom: "0px", marginBottom: "0px", color: "rgba(255, 255, 255, 0.9)", letterSpacing: "0.5px", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}
        >
          Contacts
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
            <Search
              size={15}
              style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }}
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")
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
                color: "rgba(255, 255, 255, 0.4)",
                fontFamily: "'Inter', sans-serif",
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
                        ? "rgba(48, 251, 230, 0.06)"
                        : "transparent",
                    border:
                      selectedContact?._id === contact._id
                        ? "1px solid rgba(48, 251, 230, 0.12)"
                        : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedContact?._id !== contact._id) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.04)";
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
                        background: "linear-gradient(135deg, #30FBE6, #a855f7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                        fontFamily: "'Inter', sans-serif",
                        overflow: "hidden",
                      }}
                    >
                      {contact.profilePic ? (
                        <img src={contact.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(contact.fullName)
                      )}
                    </div>
                  </div>

                  {/* Name & status text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "rgba(255, 255, 255, 0.92)",
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: "2px",
                      }}
                    >
                      {contact.fullName}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "rgba(255, 255, 255, 0.45)",
                        fontFamily: "'Inter', sans-serif",
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
                    style={{ color: "rgba(255, 255, 255, 0.15)" }}
                  />
                  <span
                    style={{
                      fontSize: "14px",
                      color: "rgba(255, 255, 255, 0.35)",
                      fontFamily: "'Inter', sans-serif",
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
              background: "rgba(0, 0, 0, 0.3)",
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
              background: "rgba(10, 15, 30, 0.97)",
              backdropFilter: "blur(40px) saturate(180%)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.4)",
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
                  color: "rgba(255, 255, 255, 0.9)",
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
                  color: "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
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
                  style={{
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    padding: "3px",
                    background: "linear-gradient(135deg, #30FBE6, #a855f7)",
                    boxShadow: "0 0 25px rgba(48, 251, 230, 0.3)",
                    overflow: "hidden",
                  }}
                >
                  {selectedContact.profilePic ? (
                    <img src={selectedContact.profilePic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "rgba(15, 23, 42, 0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "28px",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.7)",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {getInitials(selectedContact.fullName)}
                    </div>
                  )}
                </div>
              </div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "rgba(255, 255, 255, 0.95)",
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
                  color: statusColors[selectedContact.status],
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: statusColors[selectedContact.status],
                  }}
                />
                {statusLabels[selectedContact.status]}
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background:
                  "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)",
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
                icon={<Info size={14} style={{ color: "#a855f7" }} />}
                label="About"
                value={selectedContact.about}
              />

              {/* Email */}
              <ProfileField
                icon={<Mail size={14} style={{ color: "#30FBE6" }} />}
                label="Email"
                value={selectedContact.email}
                interactive
              />

              {/* Phone */}
              <ProfileField
                icon={<Phone size={14} style={{ color: "#22c55e" }} />}
                label="Phone"
                value={selectedContact.phone}
                interactive
              />

              {/* Member Since */}
              <ProfileField
                icon={<User size={14} style={{ color: "#a855f7" }} />}
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
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(48, 251, 230, 0.3)",
                  background: "rgba(48, 251, 230, 0.1)",
                  color: "#30FBE6",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "rgba(48, 251, 230, 0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(48, 251, 230, 0.1)")
                }
              >
                Send Message
              </button>
              <button
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
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
    </div>
  );
};

/* ---------- SMALL SUB-COMPONENT ---------- */

const ProfileField = ({ icon, label, value, interactive }) => (
  <div
    style={{
      padding: "14px 16px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      cursor: interactive ? "pointer" : "default",
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      if (interactive) {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
      }
    }}
    onMouseLeave={(e) => {
      if (interactive) {
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
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
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {label}
      </span>
    </div>
    <p
      style={{
        fontSize: "13px",
        color: "rgba(255, 255, 255, 0.8)",
        lineHeight: 1.5,
        marginLeft: "24px",
      }}
    >
      {value}
    </p>
  </div>
);

export default ContactsPanel;
