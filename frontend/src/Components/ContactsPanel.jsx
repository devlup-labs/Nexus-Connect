import { 
  Search, Plus, MoreVertical, Phone, MessageSquare, Video, 
  Mail, MapPin, Grid, Clock, Calendar, X, Settings
} from "lucide-react";
import { useState } from "react";

function ContactsPanel() {
  const [selectedContactId, setSelectedContactId] = useState(5); // Default to David Kim
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("info");

  const contacts = [
    {
      id: 1,
      name: "Sarah Jenkins",
      role: "Product Manager",
      status: "online",
      avatar: "S",
      color: "#22d3ee", // Cyan
      email: "sarah.j@design.co",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      recentActivity: "Called 2h ago",
      sharedMedia: [1, 2, 3, 4]
    },
    {
      id: 2,
      name: "Alex Chen",
      role: "UX Designer",
      status: "busy",
      avatar: "A",
      color: "#f472b6", // Pink
      email: "alex.chen@design.co",
      phone: "+1 (555) 987-6543",
      location: "New York, NY",
      recentActivity: "Missed call yesterday",
      sharedMedia: [1, 2]
    },
    {
      id: 3,
      name: "Mike Ross",
      role: "Senior Developer",
      status: "offline",
      avatar: "M",
      color: "#a78bfa", // Purple
      email: "mike.r@dev.co",
      phone: "+1 (555) 456-7890",
      location: "Austin, TX",
      recentActivity: "Message sent 1d ago",
      sharedMedia: [1, 2, 3, 4, 5, 6]
    },
    {
      id: 4,
      name: "Jessica Lewis",
      role: "Marketing Director",
      status: "online",
      avatar: "J",
      color: "#34d399", // Green
      email: "jess.lewis@market.ing",
      phone: "+1 (555) 222-3333",
      location: "London, UK",
      recentActivity: "Video call 3d ago",
      sharedMedia: []
    },
    {
      id: 5,
      name: "David Kim",
      role: "Frontend Dev",
      status: "busy",
      avatar: "D",
      color: "#fbbf24", // Amber
      email: "d.kim@frontend.io",
      phone: "+1 (555) 777-8888",
      location: "Seoul, KR",
      recentActivity: "Called 1w ago",
      sharedMedia: [1, 2, 3]
    },
  ];

  const getFilteredContacts = () => {
    if (!searchQuery) return contacts;
    const lowerQuery = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) || 
      c.role.toLowerCase().includes(lowerQuery)
    );
  };

  const selectedContact = contacts.find(c => c.id === selectedContactId) || contacts[0];
  const filteredContacts = getFilteredContacts();

  // STYLES FROM STREAM PANEL CSS
  const glassPanelStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  };

  const activeCardStyle = {
    background: "rgba(48, 251, 230, 0.12)",
    boxShadow: "0 0 30px rgba(48, 251, 230, 0.2), 0 8px 28px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden flex flex-col"
      style={{ 
        fontFamily: "'Inter', sans-serif",
        // Main App Background Gradient
        background: "linear-gradient(135deg, #050A1F 0%, #0A1535 20%, #0F2550 40%, #0A1535 60%, #050A1F 80%, #02040A 100%)",
      }}
    >
      {/* Background Radial Glow Effects */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        pointerEvents: 'none',
        background: `
            radial-gradient(circle at 20% 30%, rgba(30, 64, 175, 0.25) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(0, 191, 255, 0.2) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 70% 20%, rgba(14, 165, 233, 0.15) 0%, transparent 35%)
        `,
        zIndex: 0
      }} />

      {/* Noise Texture Overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.25,
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Main Content Container */}
      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        padding: "0 20px 20px 20px" // Standard padding for the view
      }}>
        
        {/* STREAM PANEL STYLE HEADER */}
        <div style={{ 
          padding: "10px 10px 20px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0
        }}>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 500, 
            color: 'rgba(255, 255, 255, 0.9)',
            letterSpacing: '0.5px',
            fontFamily: "'Inter', sans-serif",
          }}>
            Contacts
          </h2>
          
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
               <Calendar size={20} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
               <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: "flex", gap: "20px", overflow: "hidden" }}>
          
          {/* LEFT COLUMN: Contact List */}
          <div 
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={glassPanelStyle}
          >
            {/* Search Bar Area */}
            <div style={{ padding: "20px" }}>
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <Search size={18} className="text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "white",
                    fontSize: "14px",
                    marginLeft: "12px",
                    width: "100%"
                  }}
                />
                <button 
                  style={{
                    background: "rgba(48, 251, 230, 0.1)",
                    color: "#30FBE6",
                    border: "1px solid rgba(48, 251, 230, 0.3)",
                    borderRadius: "6px",
                    padding: "4px",
                    cursor: "pointer",
                    marginLeft: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filteredContacts.map((contact) => {
                const isActive = selectedContactId === contact.id;
                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className="group"
                    style={{
                      marginBottom: "12px",
                      padding: "16px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      position: "relative",
                      // Apply active styles if selected, else default transparent/hover styles
                      ...(isActive ? activeCardStyle : {
                         border: "1px solid transparent",
                         background: "transparent"
                      })
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "none";
                        }
                    }}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                        <div style={{
                            position: "absolute",
                            left: 0, top: 0, bottom: 0,
                            width: "3px",
                            background: "linear-gradient(to bottom, #30FBE6, rgba(48, 251, 230, 0.5))",
                            borderRadius: "18px 0 0 18px",
                            zIndex: 0
                        }} />
                    )}

                    {/* Avatar */}
                    <div className="relative z-10">
                      <div 
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          // Using gradients from stream panel CSS
                          background: `linear-gradient(135deg, ${contact.color}44, rgba(138, 43, 226, 0.3))`,
                          border: `1px solid rgba(255, 255, 255, 0.2)`,
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "white"
                        }}
                      >
                        {contact.avatar}
                      </div>
                      <div 
                        style={{
                          position: "absolute",
                          bottom: "0px",
                          right: "0px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          border: "2px solid rgba(20, 25, 40, 1)",
                          background: contact.status === 'online' ? '#34d399' : contact.status === 'busy' ? '#f472b6' : '#94a3b8'
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 z-10">
                      <div style={{ 
                          color: "rgba(255, 255, 255, 0.95)", 
                          fontWeight: 500, 
                          fontSize: "14px",
                          textShadow: "0 1px 3px rgba(0, 0, 0, 0.3)"
                      }}>
                          {contact.name}
                      </div>
                      <div style={{ 
                          color: "rgba(255, 255, 255, 0.6)", 
                          fontSize: "12px",
                          marginTop: "2px"
                      }}>
                          {contact.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Context Deck */}
          <div 
            style={{ 
                width: "380px", 
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "20px"
            }}
          >
            {/* 1. Profile Card */}
            <div 
              style={{
                ...glassPanelStyle,
                borderRadius: "16px",
                padding: "32px 24px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative"
              }}
            >
                <div className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
                    <MoreVertical size={20} />
                </div>

                <div 
                    style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${selectedContact.color}33, ${selectedContact.color}66)`,
                        border: `1px solid rgba(255,255,255,0.2)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "white",
                        marginBottom: "16px",
                        boxShadow: `0 0 30px ${selectedContact.color}33`
                    }}
                >
                    {selectedContact.avatar}
                </div>

                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.95)", marginBottom: "4px" }}>
                    {selectedContact.name}
                </h2>
                <div className="flex items-center gap-2 mb-8">
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: selectedContact.status === 'online' ? '#34d399' : '#94a3b8' }} />
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                        {selectedContact.role}
                    </span>
                </div>

                <div className="flex gap-3 w-full">
                    <button className="flex-1 py-2.5 rounded-xl bg-[#30FBE6] text-[#050A1F] font-semibold flex justify-center items-center gap-2 hover:bg-[#67e8f9] transition-colors shadow-[0_0_15px_rgba(48,251,230,0.3)]">
                        <Phone size={18} />
                        <span>Call</span>
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl bg-white/5 text-white font-medium flex justify-center items-center gap-2 border border-white/10 hover:bg-white/10 transition-colors">
                        <MessageSquare size={18} />
                        <span>Chat</span>
                    </button>
                    <button className="w-12 py-2.5 rounded-xl bg-white/5 text-white flex justify-center items-center border border-white/10 hover:bg-white/10 transition-colors">
                        <Video size={18} />
                    </button>
                </div>
            </div>

            {/* 2. Info / Media Tabs */}
            <div 
            className="flex-1 flex flex-col"
            style={{
                ...glassPanelStyle,
                borderRadius: "16px",
                overflow: "hidden"
            }}
            >
                <div className="flex border-b border-white/10">
                    {['info', 'media'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 py-3 text-sm font-medium capitalize transition-all relative"
                            style={{
                                color: activeTab === tab ? "#30FBE6" : "rgba(255,255,255,0.5)",
                                background: activeTab === tab ? "rgba(48, 251, 230, 0.05)" : "transparent",
                                cursor: 'pointer',
                                border: 'none'
                            }}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#30FBE6] shadow-[0_0_10px_#30FBE6]" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'info' ? (
                        <div className="flex flex-col gap-6">
                            <div className="flex items-start gap-4 group">
                                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#30FBE6] border border-white/5 group-hover:border-[#30FBE6]/30 transition-colors">
                                    <Mail size={16} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Email Address</div>
                                    <div className="text-sm text-white select-all font-medium tracking-wide">{selectedContact.email}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#30FBE6] border border-white/5 group-hover:border-[#30FBE6]/30 transition-colors">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Phone Number</div>
                                    <div className="text-sm text-white select-all font-medium tracking-wide">{selectedContact.phone}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group">
                                <div className="mt-1 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#30FBE6] border border-white/5 group-hover:border-[#30FBE6]/30 transition-colors">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Location</div>
                                    <div className="text-sm text-white font-medium tracking-wide">{selectedContact.location}</div>
                                </div>
                            </div>
                            
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1" />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-[#30FBE6]/30 transition-colors">
                                    <div className="flex items-center gap-2 text-[#30FBE6] mb-2">
                                        <Clock size={14} /> <span className="text-xs font-medium">Last Seen</span>
                                    </div>
                                    <div className="text-sm text-white/90">{selectedContact.recentActivity}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-purple-400/30 transition-colors">
                                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                                        <Calendar size={14} /> <span className="text-xs font-medium">Calendar</span>
                                    </div>
                                    <div className="text-sm text-white/90">No shared events</div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {selectedContact.sharedMedia.length > 0 ? (
                                selectedContact.sharedMedia.map(item => (
                                    <div key={item} className="aspect-square rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Grid size={20} className="text-white/30 group-hover:text-white/80 transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-3 text-center py-8 text-slate-500 text-sm">
                                    No shared media
                                </div>
                            )}
                            <div className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#30FBE6]/50 hover:text-[#30FBE6] text-white/20 transition-all">
                                <Plus size={20} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scrollbar CSS injection */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

export default ContactsPanel;