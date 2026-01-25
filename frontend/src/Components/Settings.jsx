import React, { useState } from 'react';
import { Edit2, ChevronDown } from 'lucide-react';

function SettingsPanel() {
  const [theme, setTheme] = useState('dark');
  const [sounds, setSounds] = useState(true);
  const [banners, setBanners] = useState(true);
  const [language, setLanguage] = useState('English');
  const [langOpen, setLangOpen] = useState(false);

  const languages = ['English', 'Hindi', 'Spanish', 'French'];

  return (
    <div
      className="w-175 h-screen"
      style={{ padding: '24px', boxSizing: 'border-box' }}
    >
      {/* GLASS PANEL */}
      <div
        className="w-full h-full rounded-2xl flex flex-col"
        style={{
          backdropFilter: 'blur(22px)',
          background: 'rgba(220,220,220,0.28)',
          border: '1px solid rgba(180,180,180,0.45)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        {/* HEADER */}
        <div style={{ padding: '24px 32px 12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#1f2937' }}>
            Settings
          </h2>
        </div>

        {/* CONTENT */}
        <div
          className="flex-1 flex flex-col"
          style={{
            padding: '24px 32px',
            rowGap: '48px',
            overflowY: 'auto',
          }}
        >
          {/* PROFILE SETTINGS */}
          <section>
            <h3 style={{ fontSize: '20px', marginBottom: '20px', color: '#1f2937' }}>
              Profile Settings
            </h3>

            <div style={{ display: 'flex', gap: '32px' }}>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '112px',
                    height: '112px',
                    borderRadius: '50%',
                    background: 'rgba(200,200,200,0.5)',
                  }}
                />
                <button
                  style={{
                    position: 'absolute',
                    bottom: '6px',
                    right: '6px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(220,220,220,0.85)',
                    border: '1px solid rgba(180,180,180,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Edit2 size={16} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 flex flex-col" style={{ rowGap: '16px' }}>
                <Field text="Alex Chen" />
                <Field
                  text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod something a mind."
                  small
                />
                <button
                  style={{
                    marginTop: '6px',
                    padding: '10px',
                    borderRadius: '12px',
                    background: 'rgba(200,200,200,0.65)',
                    border: '1px solid rgba(170,170,170,0.5)',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          {/* GENERAL SETTINGS */}
          <section className="flex flex-col" style={{ rowGap: '18px' }}>
            <h3 style={{ fontSize: '20px', color: '#1f2937' }}>
              General Settings
            </h3>

            <SettingRow label="Theme">
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(180,180,180,0.4)',
                  borderRadius: '999px',
                  padding: '4px',
                }}
              >
                {['Dark', 'Light'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t.toLowerCase())}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '999px',
                      background:
                        theme === t.toLowerCase() ? '#1f2937' : 'transparent',
                      color:
                        theme === t.toLowerCase() ? '#ffffff' : '#374151',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Notifications">
              <div style={{ display: 'flex', gap: '20px' }}>
                <Toggle label="Sounds" value={sounds} onChange={setSounds} />
                <Toggle label="Banners" value={banners} onChange={setBanners} />
              </div>
            </SettingRow>

            {/* LANGUAGE DROPDOWN */}
            <SettingRow label="Language">
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(200,200,200,0.6)',
                    border: '1px solid rgba(170,170,170,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  {language}
                  <ChevronDown size={16} />
                </button>

                {langOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '110%',
                      minWidth: '140px',
                      background: 'rgba(230,230,230,0.95)',
                      border: '1px solid rgba(180,180,180,0.5)',
                      borderRadius: '10px',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                      overflow: 'hidden',
                      zIndex: 10,
                    }}
                  >
                    {languages.map((l) => (
                      <div
                        key={l}
                        onClick={() => {
                          setLanguage(l);
                          setLangOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          background:
                            language === l
                              ? 'rgba(31,41,55,0.1)'
                              : 'transparent',
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SettingRow>

            <SettingRow label="Privacy & Security" right="Menu" />
            <SettingRow label="Storage & Data" right="Menu" />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Field({ text, small }) {
  return (
    <div
      style={{
        padding: small ? '10px 14px' : '10px 16px',
        borderRadius: '10px',
        background: 'rgba(210,210,210,0.42)',
        border: '1px solid rgba(180,180,180,0.5)',
        fontSize: small ? '14px' : '15px',
        lineHeight: '1.45',
        color: '#1f2937',
      }}
    >
      {text}
    </div>
  );
}

function SettingRow({ label, children, right }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'rgba(210,210,210,0.4)',
        border: '1px solid rgba(180,180,180,0.45)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '16px', color: '#1f2937' }}>{label}</span>
      {children ?? <span style={{ color: '#4b5563' }}>{right}</span>}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '999px',
          background: value
            ? 'rgba(31,41,55,0.95)'
            : 'rgba(160,160,160,0.5)',
          position: 'relative',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            background: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '2px',
            left: '2px',
            transform: value ? 'translateX(18px)' : 'translateX(0)',
            transition: 'transform 0.25s ease',
          }}
        />
      </button>
    </div>
  );
}

export default SettingsPanel