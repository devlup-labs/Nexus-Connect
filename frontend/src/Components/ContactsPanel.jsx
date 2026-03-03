import React, { useState, useRef } from "react";
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

const contacts = [
  {
    id: 1,
    name: "Stephen Hawking",
    status: "online",
    about:
      'Theoretical physicist and cosmologist. Author of "A Brief History of Time".',
    email: "stephen.hawking@cambridge.edu",
    phone: "+44 1223 337733",
    joinedDate: "March 2024",
    initials: "SH",
    gradient: "linear-gradient(135deg, #30FBE6, #a855f7)",
  },
  {
    id: 2,
    name: "Marie Curie",
    status: "online",
    about:
      "Pioneer in radioactivity research. First woman to win a Nobel Prize.",
    email: "marie.curie@sorbonne.fr",
    phone: "+33 1 44 27 10 00",
    joinedDate: "January 2024",
    initials: "MC",
    gradient: "linear-gradient(135deg, #f472b6, #a855f7)",
  },
  {
    id: 3,
    name: "Alan Turing",
    status: "away",
    about:
      "Father of theoretical computer science and artificial intelligence.",
    email: "alan.turing@bletchley.uk",
    phone: "+44 1908 640404",
    joinedDate: "February 2024",
    initials: "AT",
    gradient: "linear-gradient(135deg, #22d3ee, #3b82f6)",
  },
  {
    id: 4,
    name: "Ada Lovelace",
    status: "online",
    about: "Mathematician. First computer programmer in history.",
    email: "ada.lovelace@babbage.co.uk",
    phone: "+44 20 7946 0958",
    joinedDate: "April 2024",
    initials: "AL",
    gradient: "linear-gradient(135deg, #c084fc, #ec4899)",
  },
  {
    id: 5,
    name: "Nikola Tesla",
    status: "offline",
    about: "Inventor, electrical engineer. Pioneer of AC electricity.",
    email: "nikola.tesla@wardenclyffe.com",
    phone: "+1 212 555 0187",
    joinedDate: "December 2023",
    initials: "NT",
    gradient: "linear-gradient(135deg, #fbbf24, #f97316)",
  },
  {
    id: 6,
    name: "Richard Feynman",
    status: "online",
    about: "Quantum electrodynamics pioneer. Nobel laureate in Physics 1965.",
    email: "richard.feynman@caltech.edu",
    phone: "+1 626 555 0134",
    joinedDate: "May 2024",
    initials: "RF",
    gradient: "linear-gradient(135deg, #34d399, #22d3ee)",
  },
  {
    id: 7,
    name: "Emmy Noether",
    status: "away",
    about:
      "Mathematician known for contributions to abstract algebra and theoretical physics.",
    email: "emmy.noether@erlangen.de",
    phone: "+49 9131 85 0",
    joinedDate: "June 2024",
    initials: "EN",
    gradient: "linear-gradient(135deg, #fb923c, #ef4444)",
  },
  {
    id: 8,
    name: "Carl Sagan",
    status: "offline",
    about: "Astronomer, author of Cosmos. Voyager Golden Record curator.",
    email: "carl.sagan@cornell.edu",
    phone: "+1 607 555 0199",
    joinedDate: "July 2024",
    initials: "CS",
    gradient: "linear-gradient(135deg, #818cf8, #c084fc)",
  },
  {
    id: 9,
    name: "Rosalind Franklin",
    status: "online",
    about:
      "Biophysicist. Key contributor to understanding the structure of DNA.",
    email: "rosalind.franklin@kcl.ac.uk",
    phone: "+44 20 7836 5454",
    joinedDate: "August 2024",
    initials: "RFr",
    gradient: "linear-gradient(135deg, #f9a8d4, #a78bfa)",
  },
  {
    id: 10,
    name: "Enrico Fermi",
    status: "offline",
    about: "Nuclear physicist. Created the first nuclear reactor.",
    email: "enrico.fermi@uchicago.edu",
    phone: "+1 773 555 0142",
    joinedDate: "September 2024",
    initials: "EF",
    gradient: "linear-gradient(135deg, #60a5fa, #34d399)",
  },
];

const statusColors = {
  online: "#22c55e",
  away: "#f59e0b",
  offline: "#6b7280",
};

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

const ContactsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const searchInputRef = useRef(null);

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Sort: online first, then away, then offline
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const order = { online: 0, away: 1, offline: 2 };
    return order[a.status] - order[b.status];
  });

  const openProfile = (contact) => {
    setSelectedContact(contact);
  };

  const getContextMenuItems = (contact) => [
    { label: "Message", icon: <MessageSquare size={16} />, onClick: () => {} },
    { label: "Voice Call", icon: <Phone size={16} />, onClick: () => {} },
    { label: "Video Call", icon: <Video size={16} />, onClick: () => {} },
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
      onClick: () => {},
    },
    {
      label: "Delete Contact",
      icon: <Trash2 size={16} />,
      color: "#ef4444",
      onClick: () => {},
    },
  ];

  return (
    <div
      className="flex flex-col w-[820px] flex-shrink-0"
      style={{ height: "100%", marginTop: "4px", paddingBottom: "20px" }}
    >
      {/* Title */}
      <div style={{ padding: "10px 10px 25px 10px" }}>
        <h2
          className="text-[24px] font-medium text-white/90 tracking-[0.5px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
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

        <div
          className="px-8"
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 32px 8px 32px",
              padding: "10px 16px",
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "border-color 0.2s",
            }}
          >
            <Search
              size={16}
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
                fontSize: "14px",
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
                <X size={16} />
              </button>
            )}
          </div>

          {/* Contact count */}
          <div style={{ padding: "8px 32px 4px 32px" }}>
            <span
              style={{
                fontSize: "12px",
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
              paddingLeft: "32px",
              paddingRight: "24px",
              paddingBottom: "20px",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {sortedContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => openProfile(contact)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, contact });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background:
                      selectedContact?.id === contact.id
                        ? "rgba(48, 251, 230, 0.06)"
                        : "transparent",
                    border:
                      selectedContact?.id === contact.id
                        ? "1px solid rgba(48, 251, 230, 0.12)"
                        : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedContact?.id !== contact.id) {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedContact?.id !== contact.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: contact.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {contact.initials}
                    </div>
                    {/* Status dot */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "1px",
                        right: "1px",
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: statusColors[contact.status],
                        border: "2.5px solid rgba(11, 18, 32, 0.95)",
                        boxShadow:
                          contact.status === "online"
                            ? "0 0 6px rgba(34, 197, 94, 0.5)"
                            : "none",
                      }}
                    />
                  </div>

                  {/* Name & status text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "rgba(255, 255, 255, 0.92)",
                        fontFamily: "'Inter', sans-serif",
                        marginBottom: "2px",
                      }}
                    >
                      {contact.name}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 255, 255, 0.45)",
                        fontFamily: "'Inter', sans-serif",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contact.about}
                    </div>
                  </div>

                  {/* Status label */}
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: statusColors[contact.status],
                      fontFamily: "'Inter', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {statusLabels[contact.status]}
                  </span>
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
                    background: selectedContact.gradient,
                    boxShadow: "0 0 25px rgba(48, 251, 230, 0.3)",
                  }}
                >
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
                    {selectedContact.initials}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "2px",
                    right: "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: statusColors[selectedContact.status],
                    border: "3px solid rgba(15, 23, 42, 0.95)",
                    boxShadow:
                      selectedContact.status === "online"
                        ? "0 0 8px rgba(34, 197, 94, 0.5)"
                        : "none",
                  }}
                />
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
                {selectedContact.name}
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
                value={selectedContact.joinedDate}
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
