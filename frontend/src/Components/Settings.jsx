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
      className="w-screen h-screen flex flex-col"
      style={{ boxSizing: 'border-box' }}
    >
      {/* HEADER */}
      <div style={{ padding: '1.5rem 1.5rem 1.25rem 1.5rem' }}>
        <h2 style={{ 
          fontSize: '1.75rem', 
          fontWeight: 500, 
          color: 'rgba(255, 255, 255, 0.9)',
          letterSpacing: '0.5px',
          fontFamily: "'Inter', sans-serif",
        }}>
          Settings
        </h2>
      </div>

      {/* CONTENT */}
      <div
        className="flex-1 flex flex-col"
        style={{
          padding: '0 1.5rem 6.25rem 1.5rem',
          rowGap: '0.75rem',
          overflowY: 'auto',
        }}
      >
          {/* PROFILE SETTINGS */}
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              isolation: 'isolate',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ 
              fontSize: '1.125rem', 
              marginBottom: '1.25rem', 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
            }}>
              Profile Settings
            </h3>

            <div style={{ display: 'flex', gap: '1.25rem' }}>
              {/* Avatar */}
              <div style={{ position: 'relative',
                    width: '5rem',
                    height: '5rem',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(48, 251, 230, 0.3), rgba(138, 43, 226, 0.3))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.625rem',
                    fontWeight: '600',
                    color: 'rgba(255, 255, 255, 0.95)',
                    flexShrink: '0',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
              >
                <span style={{
                  fontSize: '1.75rem',
                  fontWeight: '500',
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
                }}>TB</span>
                <div/>
                
                <button
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    right: '0px',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.95)',
                  }}
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Fields */}
              <div className="flex-1 flex flex-col" style={{ rowGap: '0.625rem' }}>
                <Field text="Alex Chen" />
                <Field
                  text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod something a mind."
                  small
                />
                <button
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.9375rem',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          {/* GENERAL SETTINGS */}
          <section 
            className="flex flex-col" 
            style={{ 
              rowGap: '0.875rem',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0.875rem',
              padding: '1.25rem',
              isolation: 'isolate',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <h3 style={{ 
              fontSize: '1.125rem', 
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              marginBottom: '0.375rem',
            }}>
              General Settings
            </h3>

            <SettingRow label="Theme">
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '999px',
                  padding: '0.1875rem',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {['Dark', 'Light'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t.toLowerCase())}
                    style={{
                      padding: '0.375rem 0.875rem',
                      borderRadius: '999px',
                      background:
                        theme === t.toLowerCase() ? 'rgba(48, 251, 230, 0.2)' : 'transparent',
                      color:
                        theme === t.toLowerCase() ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)',
                      border: theme === t.toLowerCase() ? '1px solid rgba(48, 251, 230, 0.3)' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9375rem',
                      fontWeight: 500,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </SettingRow>

            <SettingRow label="Notifications">
              <div style={{ display: 'flex', gap: '1.25rem' }}>
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
                    gap: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {language}
                  <ChevronDown size={14} />
                </button>

                {langOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '110%',
                      minWidth: '8.75rem',
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.625rem',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
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
                          padding: '0.625rem 0.875rem',
                          cursor: 'pointer',
                          fontSize: '0.9375rem',
                          background:
                            language === l
                              ? 'rgba(48, 251, 230, 0.15)'
                              : 'transparent',
                          color: 'rgba(255, 255, 255, 0.9)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (language !== l) {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (language !== l) {
                            e.target.style.background = 'transparent';
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

            <SettingRow label="Privacy & Security" right="Menu" />
            <SettingRow label="Storage & Data" right="Menu" />

            {/* LOGOUT BUTTON */}
            <button
              onClick={() => {
                // Add logout logic here
                console.log('Logging out...');
              }}
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: 'rgba(255, 59, 48, 0.15)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9375rem',
                color: 'rgba(255, 99, 88, 0.95)',
                transition: 'all 0.3s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 59, 48, 0.25)';
                e.target.style.borderColor = 'rgba(255, 59, 48, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 59, 48, 0.15)';
                e.target.style.borderColor = 'rgba(255, 59, 48, 0.3)';
              }}
            >
              Logout
            </button>
          </section>
        </div>
      </div>
    );
  }

/* ---------- SMALL COMPONENTS ---------- */

export function Field({ text, small }) {
  return (
    <div
      style={{
        padding: small ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
        borderRadius: '0.625rem',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: small ? '0.875rem' : '0.9375rem',
        lineHeight: '1.5',
        color: 'rgba(255, 255, 255, 0.85)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
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
        padding: '0.75rem 0.875rem',
        borderRadius: '0.75rem',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span style={{ 
        fontSize: '0.9375rem', 
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: 500,
      }}>
        {label}
      </span>
      {children ?? (
        <span style={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9375rem',
        }}>
          {right}
        </span>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ 
        fontSize: '0.9375rem', 
        color: 'rgba(255, 255, 255, 0.85)',
      }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '2.375rem',
          height: '1.25rem',
          borderRadius: '999px',
          background: value
            ? 'rgba(48, 251, 230, 0.3)'
            : 'rgba(255, 255, 255, 0.15)',
          border: value 
            ? '1px solid rgba(48, 251, 230, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
      >
        <div
          style={{
            width: '1rem',
            height: '1rem',
            background: value 
              ? 'rgba(48, 251, 230, 0.9)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '50%',
            position: 'absolute',
            top: '1px',
            left: '1px',
            transform: value ? 'translateX(1.125rem)' : 'translateX(0)',
            transition: 'transform 0.25s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}

export default SettingsPanel;