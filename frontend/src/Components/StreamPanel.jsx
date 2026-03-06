import React, { useState, useEffect } from 'react';
import { AppWindow, MoreHorizontal, Play, Eye, Bookmark, Flag, RefreshCw, PlusCircle, UserPlus, X, Search } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { getChatPartners, getContacts } from '../api';
import './StreamPanel.css';

const StreamPanel = ({ authUser, selectedContactId, onSelectContact }) => {
    const [activeCard, setActiveCard] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [chatPartners, setChatPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [newChatSearch, setNewChatSearch] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(false);

    const fetchChatPartners = async () => {
        try {
            const res = await getChatPartners();
            setChatPartners(res.data);
        } catch (err) {
            console.error('Failed to fetch chat partners:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllContacts = async () => {
        setLoadingContacts(true);
        try {
            const res = await getContacts();
            setAllContacts(res.data);
        } catch (err) {
            console.error('Failed to fetch contacts:', err);
        } finally {
            setLoadingContacts(false);
        }
    };

    useEffect(() => {
        fetchChatPartners();
        const interval = setInterval(fetchChatPartners, 8000);
        return () => clearInterval(interval);
    }, []);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const getCardType = (index) => {
        const types = ['text', 'text', 'large-media', 'text', 'audio', 'small-media', 'text', 'large-media', 'text'];
        return types[index % types.length];
    };

    const getTimestamp = (contact) => {
        if (contact.updatedAt) {
            const d = new Date(contact.updatedAt);
            const now = new Date();
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return `${diffMins} minutes ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} hours ago`;
            return d.toLocaleDateString();
        }
        return 'recently';
    };

    const handleNewChatSelect = (contact) => {
        setShowNewChat(false);
        setNewChatSearch('');
        onSelectContact(contact);
    };

    const filteredNewChatContacts = allContacts.filter(c =>
        c.fullName?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(newChatSearch.toLowerCase())
    );

    const renderCard = (contact, index) => {
        const type = getCardType(index);
        const isActive = contact._id === activeCard;
        const isSelected = contact._id === selectedContactId;

        const CardHeader = () => (
            <div className="card-header">
                <div className="avatar" style={contact.profilePic ? {
                    backgroundImage: `url(${contact.profilePic})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: 'transparent'
                } : {}}>
                    {!contact.profilePic && getInitials(contact.fullName)}
                </div>
                <span className="user-name">{contact.fullName}</span>
            </div>
        );

        const cardStyle = isSelected ? {
            border: '1px solid rgba(48, 251, 230, 0.35)',
            boxShadow: '0 0 15px rgba(48, 251, 230, 0.1)',
        } : {};

        switch (type) {
            case 'text':
                return (
                    <div
                        className={`stream-card text-card ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="card-content">
                            <p className="card-text">{contact.email}</p>
                            <span className="card-timestamp">{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'small-media':
                return (
                    <div
                        className={`stream-card small-media-card ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="media-preview">
                            <div className="play-button">
                                <Play size={20} fill="white" />
                            </div>
                            <div className="audio-indicator">
                                <div className="waveform-mini">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="wave-bar-mini"
                                            style={{ height: `${Math.random() * 60 + 20}%` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="card-content">
                            <span className="card-timestamp">{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'audio':
                return (
                    <div
                        className={`stream-card audio-card ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="audio-content">
                            <div className="waveform">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="wave-bar"
                                        style={{ height: `${Math.random() * 60 + 20}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="card-content">
                            <span className="card-timestamp">{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'large-media':
                return (
                    <div
                        className={`stream-card large-media-card ${isActive ? 'active' : ''}`}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="large-media-preview">
                            <div className="play-button large">
                                <Play size={28} fill="white" />
                            </div>
                        </div>
                        <div className="card-content">
                            <p className="card-text">{contact.email}</p>
                            <span className="card-timestamp">{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const leftColumnContacts = chatPartners.filter((_, i) => i % 2 === 0);
    const rightColumnContacts = chatPartners.filter((_, i) => i % 2 === 1);

    return (
        <div className="stream-panel">
            <div className="stream-header">
                <h2 className="stream-title">Stream</h2>
                <div className="header-actions">
                    <button
                        className="icon-button"
                        onClick={() => { setShowNewChat(true); fetchAllContacts(); }}
                        title="New Chat"
                    >
                        <UserPlus size={18} />
                    </button>
                    <button className="icon-button">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>
            {/* <div className="stream-divider"></div> */}

            {/* New Chat Modal Overlay */}
            {showNewChat && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    background: 'rgba(5, 10, 31, 0.92)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '14px',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                            New Chat
                        </span>
                        <button
                            onClick={() => { setShowNewChat(false); setNewChatSearch(''); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div style={{ padding: '12px 16px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Search size={14} style={{ color: '#30FBE6', flexShrink: 0 }} />
                            <input
                                type="text"
                                autoFocus
                                placeholder="Search by name or email..."
                                value={newChatSearch}
                                onChange={(e) => setNewChatSearch(e.target.value)}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '13px',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                            />
                        </div>
                    </div>

                    {/* User list */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0 12px 12px' }}>
                        {loadingContacts ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                                <div style={{
                                    width: '24px', height: '24px',
                                    border: '2px solid rgba(48, 251, 230, 0.15)',
                                    borderTopColor: '#30FBE6',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : filteredNewChatContacts.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '30px 16px' }}>
                                {newChatSearch ? 'No users found' : 'No other users yet'}
                            </div>
                        ) : (
                            filteredNewChatContacts.map(contact => (
                                <div
                                    key={contact._id}
                                    onClick={() => handleNewChatSelect(contact)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: contact.profilePic ? `url(${contact.profilePic}) center/cover` : 'linear-gradient(135deg, rgba(48,251,230,0.3), rgba(168,85,247,0.3))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)'
                                    }}>
                                        {!contact.profilePic && getInitials(contact.fullName)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {contact.fullName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                            {contact.email}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div className="stream-feed-masonry"
                onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'panel' });
                }}
            >
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', width: '100%' }}>
                        <div style={{
                            width: '28px', height: '28px',
                            border: '2px solid rgba(48, 251, 230, 0.15)',
                            borderTopColor: '#30FBE6',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : chatPartners.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '40px 16px', width: '100%' }}>
                        <UserPlus size={32} style={{ color: 'rgba(48, 251, 230, 0.2)', margin: '0 auto 12px' }} />
                        <p>No chats yet.</p>
                        <p style={{ marginTop: '4px' }}>Click <strong style={{ color: '#30FBE6' }}>+</strong> above to start a conversation!</p>
                    </div>
                ) : (
                    <>
                        <div className="feed-column">
                            {leftColumnContacts.map((contact, i) => (
                                <React.Fragment key={contact._id}>
                                    {renderCard(contact, i * 2)}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="feed-column">
                            {rightColumnContacts.map((contact, i) => (
                                <React.Fragment key={contact._id}>
                                    {renderCard(contact, i * 2 + 1)}
                                </React.Fragment>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={
                        contextMenu.type === 'card'
                            ? [
                                { label: 'View Chat', icon: <Eye size={16} />, onClick: () => { } },
                                { label: 'Archive', icon: <Bookmark size={16} />, onClick: () => { } },
                                { divider: true },
                                { label: 'Report', icon: <Flag size={16} />, color: '#ef4444', onClick: () => { } },
                            ]
                            : [
                                { label: 'Refresh Feed', icon: <RefreshCw size={16} />, onClick: () => fetchChatPartners() },
                                { label: 'New Chat', icon: <PlusCircle size={16} />, onClick: () => { setShowNewChat(true); fetchAllContacts(); } },
                            ]
                    }
                />
            )}
        </div>
    );
};

export default StreamPanel;
