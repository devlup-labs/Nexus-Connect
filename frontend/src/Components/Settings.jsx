import React, { useState, useRef } from "react";
import { Edit2, ChevronDown, Check, X, Camera, Download, Upload } from "lucide-react";
import { updateProfile } from "../api";
import Cropper from "react-easy-crop";
import getCroppedImg, { convertBlobToBase64 } from "../utils/cropImage";
import { useTheme, THEME_LIST } from "../contexts/ThemeContext.jsx";
import { exportAllE2EEKeys, importAllE2EEKeys } from "../services/sessionStore.js";

function SettingsPanel({ authUser, onLogout, onProfileUpdate }) {
  const fileInputRef = useRef(null);
  const { theme, setTheme } = useTheme();
  const [sounds, setSounds] = useState(true);
  const [banners, setBanners] = useState(true);
  const [language, setLanguage] = useState("English");
  const [langOpen, setLangOpen] = useState(false);

  const languages = ["English", "Hindi", "Spanish", "French"];
  const [uploadingPic, setUploadingPic] = useState(false);

  // Export/Import Keys logic
  const importInputRef = useRef(null);

  const handleExportKeys = async () => {
    try {
      if (!authUser?._id) return;
      const data = await exportAllE2EEKeys(authUser._id);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexus_e2ee_keys_${authUser._id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export keys:", err);
    }
  };

  const handleImportKeys = async (e) => {
    const file = e.target.files[0];
    if (!file || !authUser?._id) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        await importAllE2EEKeys(authUser._id, event.target.result);
        alert("E2EE keys imported successfully!");
        window.location.reload(); // Force app state re-initialization
      } catch (err) {
        console.error("Failed to import keys:", err);
        alert("Invalid backup file or mismatched user ID.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Cropping State
  const [activeImage, setActiveImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(authUser?.fullName || "");
  const [editAbout, setEditAbout] = useState(authUser?.about || "");
  const [saving, setSaving] = useState(false);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleProfilePicSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setActiveImage(reader.result);
      setShowCropModal(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    e.target.value = null; // reset input
  };

  const handleCropComplete = async () => {
    if (!activeImage || !croppedAreaPixels) return;
    try {
      setUploadingPic(true);

      const croppedImageBlobUrl = await getCroppedImg(activeImage, croppedAreaPixels);
      const base64Image = await convertBlobToBase64(croppedImageBlobUrl);

      const res = await updateProfile({ profilePic: base64Image });
      if (onProfileUpdate) onProfileUpdate(res.data);

      setShowCropModal(false);
      setActiveImage(null);
    } catch (err) {
      console.error("Failed to update profile pic:", err);
    } finally {
      setUploadingPic(false);
    }
  };

  const handleEditSave = async () => {
    if (editName.trim().length < 2) return;
    const nameChanged = editName.trim() !== (authUser?.fullName || "");
    const aboutChanged = editAbout.trim() !== (authUser?.about || "");
    if (!nameChanged && !aboutChanged) { setEditMode(false); return; }
    setSaving(true);
    try {
      const res = await updateProfile({ fullName: editName.trim(), about: editAbout.trim() });
      if (onProfileUpdate) onProfileUpdate(res.data);
      setEditMode(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditName(authUser?.fullName || "");
    setEditAbout(authUser?.about || "");
    setEditMode(false);
  };

  return (
    <div className="settings-panel flex flex-col flex-1 h-full mr-12 min-w-[840px] mb-2">
      {/* Title */}
      <div className="pt-[60px] pb-0 pl-2 flex justify-between items-end mb-[-30px] relative z-20">
        <h2 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '0.5px', fontFamily: 'var(--font-main)', lineHeight: 1 }}>Settings</h2>
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

        <div
          className="overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-transparent"
          style={{ display: "flex", flexDirection: "column", height: "100%", padding: "12px", gap: "12px", paddingBottom: "100px" }}
        >
          {/* Profile Settings Section */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}>
            <h3 style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-main)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}>
              Profile
            </h3>

            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              {/* Avatar with upload */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  padding: "2px",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-secondary))",
                  boxShadow: "0 0 20px var(--shadow-glow)",
                  opacity: uploadingPic ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}>
                  {authUser?.profilePic ? (
                    <img
                      src={authUser.profilePic}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "var(--surface-input)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-main)",
                    }}>
                      {getInitials(authUser?.fullName)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    background: "rgba(var(--accent-rgb), 0.2)",
                    border: "2px solid var(--bg-base)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--accent)",
                  }}>
                  <Camera size={10} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicSelect}
                  style={{ display: "none" }}
                />
              </div>

              {/* Fields — editable or static */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                {editMode ? (
                  <>
                    {/* Editable Name */}
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "var(--surface-input)",
                      border: "1px solid var(--border-accent)",
                    }}>
                      <label style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "var(--font-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={50}
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "var(--text-primary)",
                          fontSize: "13px",
                          fontFamily: "var(--font-main)",
                          caretColor: "var(--accent)",
                          marginTop: "2px",
                        }}
                      />
                    </div>

                    {/* Editable Bio */}
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "var(--surface-input)",
                      border: "1px solid var(--border-accent)",
                    }}>
                      <label style={{ fontSize: "10px", color: "var(--text-tertiary)", fontFamily: "var(--font-main)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Bio</label>
                      <textarea
                        value={editAbout}
                        onChange={(e) => setEditAbout(e.target.value)}
                        maxLength={200}
                        rows={2}
                        placeholder="Write something about yourself..."
                        style={{
                          width: "100%",
                          background: "transparent",
                          border: "none",
                          outline: "none",
                          color: "var(--text-primary)",
                          fontSize: "12px",
                          fontFamily: "var(--font-main)",
                          caretColor: "var(--accent)",
                          resize: "none",
                          lineHeight: "1.5",
                          marginTop: "2px",
                        }}
                      />
                      <div style={{ fontSize: "10px", color: "var(--text-tertiary)", textAlign: "right" }}>
                        {editAbout.length}/200
                      </div>
                    </div>

                    {/* Save / Cancel */}
                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                      <button
                        onClick={handleEditSave}
                        disabled={saving || editName.trim().length < 2}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          background: saving ? "rgba(var(--accent-rgb), 0.05)" : "rgba(var(--accent-rgb), 0.15)",
                          border: "1px solid var(--border-accent-strong)",
                          cursor: saving ? "wait" : "pointer",
                          fontWeight: 500,
                          fontSize: "12px",
                          color: "var(--accent)",
                          fontFamily: "var(--font-main)",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          opacity: (editName.trim().length < 2) ? 0.4 : 1,
                        }}
                      >
                        <Check size={13} />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleEditCancel}
                        disabled={saving}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "10px",
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          fontFamily: "var(--font-main)",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <X size={13} />
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Field text={authUser?.fullName || "User Name"} />
                    <Field
                      text={authUser?.about || "No bio set yet."}
                      small
                    />
                    <button
                      onClick={() => {
                        setEditName(authUser?.fullName || "");
                        setEditAbout(authUser?.about || "");
                        setEditMode(true);
                      }}
                      style={{
                        marginTop: "4px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        background: "rgba(var(--accent-rgb), 0.1)",
                        border: "1px solid var(--border-accent)",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "12px",
                        color: "var(--accent)",
                        fontFamily: "var(--font-main)",
                        transition: "all 0.15s ease",
                        alignSelf: "flex-start",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(var(--accent-rgb), 0.18)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(var(--accent-rgb), 0.1)";
                      }}
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* General Settings Section */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}>
            <h3 style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text-secondary)",
              fontFamily: "var(--font-main)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              General
            </h3>

            {/* Theme */}
            <SettingRow label="Theme">
              <ThemeDropdown theme={theme} setTheme={setTheme} />
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
                    background: "var(--surface-input)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    fontFamily: "var(--font-main)",
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
                    background: "var(--surface-input)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--border-hover)",
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
                          fontFamily: "var(--font-main)",
                          borderRadius: "8px",
                          background: language === l ? "rgba(var(--accent-rgb), 0.12)" : "transparent",
                          color: language === l ? "var(--accent)" : "var(--text-primary)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (language !== l) {
                            e.target.style.background = "var(--surface)";
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

            {/* Export/Import E2EE Keys */}
            <SettingRow label="Export E2EE Backup">
              <button
                onClick={handleExportKeys}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  background: "rgba(var(--accent-rgb), 0.15)",
                  border: "1px solid var(--border-accent-strong)",
                  cursor: "pointer",
                  color: "var(--accent)",
                  fontSize: "12px",
                  fontWeight: 500,
                  fontFamily: "var(--font-main)"
                }}
              >
                <Download size={13} />
                Export
              </button>
            </SettingRow>

            <SettingRow label="Import E2EE Backup">
              <button
                onClick={() => importInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  background: "var(--surface)",
                  border: "1px solid var(--border-hover)",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  fontFamily: "var(--font-main)"
                }}
              >
                <Upload size={13} />
                Import
              </button>
              <input
                type="file"
                ref={importInputRef}
                accept=".json"
                onChange={handleImportKeys}
                style={{ display: "none" }}
              />
            </SettingRow>

            <SettingRow label="Storage & Data" right="→" />
          </div>

          {/* Logout */}
          <button
            onClick={() => onLogout && onLogout()}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--status-danger-border)",
              background: "var(--status-danger-bg)",
              color: "var(--status-danger)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
              fontFamily: "var(--font-main)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)";
              e.currentTarget.style.borderColor = "var(--status-danger-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--status-danger-bg)";
              e.currentTarget.style.borderColor = "var(--status-danger-border)";
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "16px", width: "100%", maxWidth: "400px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            <h3 style={{ color: "var(--text-primary)", fontWeight: 500, marginBottom: "20px", width: "100%", textAlign: "center", fontFamily: "var(--font-main)" }}>Adjust Profile Picture</h3>

            <div style={{ position: "relative", width: "100%", height: "260px", background: "rgba(0,0,0,0.5)", borderRadius: "12px", overflow: "hidden", marginBottom: "24px" }}>
              <Cropper
                image={activeImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            <div style={{ width: "100%", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-main)" }}>Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(e.target.value)}
                style={{ flex: 1, accentColor: "var(--accent)", background: "var(--surface-hover)", borderRadius: "999px", height: "4px", outline: "none", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", width: "100%", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setShowCropModal(false); setActiveImage(null); }}
                disabled={uploadingPic}
                style={{ padding: "10px 16px", borderRadius: "10px", color: "var(--text-secondary)", background: "transparent", cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-main)", border: "none" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                disabled={uploadingPic}
                style={{ padding: "10px 20px", background: "rgba(var(--accent-rgb), 0.15)", color: "var(--accent)", border: "1px solid var(--border-accent-strong)", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 500, fontFamily: "var(--font-main)", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {uploadingPic ? "Saving..." : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

export function Field({ text, small }) {
  return (
    <div style={{
      padding: small ? "8px 12px" : "10px 14px",
      borderRadius: "10px",
      background: "var(--surface-input)",
      border: "1px solid var(--border)",
      fontSize: small ? "11px" : "13px",
      lineHeight: "1.5",
      color: "var(--text-primary)",
      fontFamily: "var(--font-main)",
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
      background: "var(--surface-input)",
      border: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      cursor: right ? "pointer" : "default",
      transition: "all 0.15s ease",
    }}
      onMouseEnter={(e) => {
        if (right) {
          e.currentTarget.style.background = "var(--surface)";
        }
      }}
      onMouseLeave={(e) => {
        if (right) {
          e.currentTarget.style.background = "var(--surface-input)";
        }
      }}
    >
      <span style={{
        fontSize: "13px",
        color: "var(--text-primary)",
        fontWeight: 500,
        fontFamily: "var(--font-main)",
      }}>
        {label}
      </span>
      {children ?? (
        <span style={{
          color: "var(--text-tertiary)",
          fontSize: "13px",
          fontFamily: "var(--font-main)",
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
        color: "var(--text-secondary)",
        fontFamily: "var(--font-main)",
      }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: "34px",
          height: "18px",
          borderRadius: "999px",
          background: value ? "rgba(var(--accent-rgb), 0.25)" : "var(--surface-hover)",
          border: value ? "1px solid var(--border-accent-strong)" : "1px solid var(--border-hover)",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{
          width: "14px",
          height: "14px",
          background: value ? "var(--accent)" : "var(--text-secondary)",
          borderRadius: "50%",
          position: "absolute",
          top: "1px",
          left: "1px",
          transform: value ? "translateX(16px)" : "translateX(0)",
          transition: "transform 0.2s ease",
          boxShadow: value ? "0 0 8px var(--shadow-glow)" : "0 1px 3px rgba(0, 0, 0, 0.2)",
        }} />
      </button>
    </div>
  );
}

function ThemeDropdown({ theme, setTheme }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "10px",
          background: "var(--surface-hover)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-hover)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
          fontFamily: "var(--font-main)",
          textTransform: "capitalize",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 8px var(--shadow)",
        }}
      >
        {theme}
        <ChevronDown
          size={16}
          style={{
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
          }}
        />
      </button>

      {isOpen && (
        <>
          {/* Click-away overlay */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              width: "160px",
              background: "var(--surface-input)",
              backdropFilter: "blur(40px) saturate(180%)",
              border: "1px solid var(--border-hover)",
              borderRadius: "12px",
              boxShadow: "0 12px 40px var(--shadow)",
              overflow: "hidden",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {THEME_LIST.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTheme(t);
                  setIsOpen(false);
                }}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  fontSize: "13px",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s ease",
                  fontFamily: "var(--font-main)",
                  background:
                    theme === t
                      ? "linear-gradient(90deg, var(--accent), var(--accent-secondary))"
                      : "transparent",
                  color:
                    theme === t
                      ? "var(--text-on-accent)"
                      : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (theme !== t) {
                    e.currentTarget.style.background = "var(--surface-hover)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme !== t) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsPanel;
