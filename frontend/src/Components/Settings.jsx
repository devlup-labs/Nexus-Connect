import React, { useState, useRef } from "react";
import { Edit2, ChevronDown } from "lucide-react";
import { updateProfile } from "../api";

function SettingsPanel({ authUser, onLogout, onProfileUpdate }) {
  const fileInputRef = useRef(null);
  const [theme, setTheme] = useState("dark");
  const [sounds, setSounds] = useState(true);
  const [banners, setBanners] = useState(true);
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);

  const languages = ["English", "Hindi", "Spanish", "French"];
  const [uploadingPic, setUploadingPic] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;
      setUploadingPic(true);
      try {
        const res = await updateProfile(base64);
        if (onProfileUpdate) onProfileUpdate(res.data);
      } catch (err) {
        console.error("Failed to update profile pic:", err);
      } finally {
        setUploadingPic(false);
      }
    };
  };

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', background: 'transparent', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '24px', paddingBottom: '24px' }}>
      {/* Title */}
      <div style={{ padding: "10px 10px 20px 10px" }}>
        <h2
          className="text-[24px] font-medium text-white/90 tracking-[0.5px]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Settings
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
          className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent"
          style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px", gap: "12px", paddingBottom: "100px" }}
        >
          {/* Profile Settings Section */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}>
            <h3 style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.5)",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Profile
            </h3>

            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              {/* Avatar */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  padding: "2px",
                  background: "linear-gradient(135deg, #30FBE6, #a855f7)",
                  boxShadow: "0 0 20px rgba(48, 251, 230, 0.25)",
                }}>
                  <div style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "rgba(15, 23, 42, 0.95)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.7)",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    TB
                  </div>
                </div>
                <button style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "rgba(48, 251, 230, 0.2)",
                  border: "2px solid rgba(11, 18, 32, 0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#30FBE6",
                }}>
                  <Edit2 size={10} />
                </button>
              </div>

              {/* Fields */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <Field text="Alex Chen" />
                <Field
                  text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod something a mind."
                  small
                />
                <button
                  style={{
                    marginTop: "4px",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "rgba(48, 251, 230, 0.1)",
                    border: "1px solid rgba(48, 251, 230, 0.2)",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "12px",
                    color: "#30FBE6",
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s ease",
                    alignSelf: "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(48, 251, 230, 0.18)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(48, 251, 230, 0.1)";
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* General Settings Section */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <h3 style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.5)",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              General
            </h3>

            {/* Theme */}
            <SettingRow label="Theme">
              <div style={{
                display: "flex",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "8px",
                padding: "3px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}>
                {["Dark", "Light"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t.toLowerCase())}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "6px",
                      background: theme === t.toLowerCase() ? "rgba(48, 251, 230, 0.15)" : "transparent",
                      color: theme === t.toLowerCase() ? "#30FBE6" : "rgba(255, 255, 255, 0.5)",
                      border: theme === t.toLowerCase() ? "1px solid rgba(48, 251, 230, 0.2)" : "1px solid transparent",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </SettingRow>

            {/* Notifications */}
            <SettingRow label="Notifications">
              <div style={{ display: "flex", gap: "12px" }}>
                <Toggle label="Sounds" value={sounds} onChange={setSounds} />
                <Toggle label="Banners" value={banners} onChange={setBanners} />
              </div>
            </SettingRow>

            {/* Language */}
            <SettingRow label="Language">
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "12px",
                    fontWeight: 500,
                    fontFamily: "'Inter', sans-serif",
                    transition: "all 0.15s ease",
                  }}
                >
                  {language}
                  <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </button>

                {langOpen && (
                  <div style={{
                    position: "absolute",
                    right: 0,
                    top: "110%",
                    minWidth: "120px",
                    background: "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "10px",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                    overflow: "hidden",
                    zIndex: 10,
                    padding: "4px",
                  }}>
                    {languages.map((l) => (
                      <div
                        key={l}
                        onClick={() => { setLanguage(l); setLangOpen(false); }}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontFamily: "'Inter', sans-serif",
                          borderRadius: "8px",
                          background: language === l ? "rgba(48, 251, 230, 0.12)" : "transparent",
                          color: language === l ? "#30FBE6" : "rgba(255, 255, 255, 0.8)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (language !== l) {
                            e.target.style.background = "rgba(255, 255, 255, 0.06)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (language !== l) {
                            e.target.style.background = "transparent";
                          }
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingRow>

            <SettingRow label="Privacy & Security" right="→" />
            <SettingRow label="Storage & Data" right="→" />
          </div>

          {/* Logout */}
          <button
            onClick={() => console.log("Logging out...")}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              background: "rgba(239, 68, 68, 0.08)",
              color: "rgba(239, 68, 68, 0.9)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

export function Field({ text, small }) {
  return (
    <div style={{
      padding: small ? "8px 12px" : "10px 14px",
      borderRadius: "10px",
      background: "rgba(15, 23, 42, 0.6)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      fontSize: small ? "11px" : "13px",
      lineHeight: "1.5",
      color: "rgba(255, 255, 255, 0.75)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {text}
    </div>
  );
}

function SettingRow({ label, children, right }) {
  return (
    <div style={{
      padding: "12px 14px",
      borderRadius: "10px",
      background: "rgba(15, 23, 42, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.06)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: right ? "pointer" : "default",
      transition: "all 0.15s ease",
    }}
      onMouseEnter={(e) => {
        if (right) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (right) {
          e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
        }
      }}
    >
      <span style={{
        fontSize: "13px",
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: 500,
        fontFamily: "'Inter', sans-serif",
      }}>
        {label}
      </span>
      {children ?? (
        <span style={{
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: "13px",
          fontFamily: "'Inter', sans-serif",
        }}>
          {right}
        </span>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{
        fontSize: "12px",
        color: "rgba(255, 255, 255, 0.7)",
        fontFamily: "'Inter', sans-serif",
      }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "34px",
          height: "18px",
          borderRadius: "999px",
          background: value ? "rgba(48, 251, 230, 0.25)" : "rgba(255, 255, 255, 0.1)",
          border: value ? "1px solid rgba(48, 251, 230, 0.35)" : "1px solid rgba(255, 255, 255, 0.15)",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{
          width: "14px",
          height: "14px",
          background: value ? "#30FBE6" : "rgba(255, 255, 255, 0.7)",
          borderRadius: "50%",
          position: "absolute",
          top: "1px",
          left: "1px",
          transform: value ? "translateX(16px)" : "translateX(0)",
          transition: "transform 0.2s ease",
          boxShadow: value ? "0 0 8px rgba(48, 251, 230, 0.4)" : "0 1px 3px rgba(0, 0, 0, 0.2)",
        }} />
      </button>
    </div>
  );
}

export default SettingsPanel;
