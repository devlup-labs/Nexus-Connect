import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppWindow, MoreHorizontal, Play, Eye, Bookmark, Flag, RefreshCw, PlusCircle, UserPlus, X, Search, Archive, RotateCcw, FileText as FileIcon } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { getChatPartners, getContacts, toggleArchiveUser, getArchivedUsers } from '../api';
import { getSocket, getActiveUsers } from '../services/socket';
import { ThemeContext } from '../contexts/ThemeContext';
import { getCachedDecryptedMessages } from '../services/sessionStore';
import './StreamPanel.css';
// StreamPanel component
const StreamPanel = ({ authUser, selectedContactId, onSelectContact, className }) => {
    const { theme } = useContext(ThemeContext);

    const [activeCard, setActiveCard] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [chatPartners, setChatPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewChat, setShowNewChat] = useState(false);
    const [allContacts, setAllContacts] = useState([]);
    const [newChatSearch, setNewChatSearch] = useState('');
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [archivedUsers, setArchivedUsers] = useState([]);
    const [loadingArchived, setLoadingArchived] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const headerMenuRef = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState(() => {
        const users = getActiveUsers();
        const map = {};
        users.forEach((id) => {
            map[id] = 'online';
        });
        return map;
    });
    const [unreadCounts, setUnreadCounts] = useState({});
    const selectedContactIdRef = useRef(selectedContactId);

    // Close header menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
                setShowHeaderMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchArchivedUsers = async () => {
        setLoadingArchived(true);
        try {
            const res = await getArchivedUsers();
            setArchivedUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch archived users:', err);
        } finally {
            setLoadingArchived(false);
        }
    };

    const handleUnarchive = async (userId) => {
        try {
            await toggleArchiveUser(userId);
            setArchivedUsers(prev => prev.filter(u => u._id !== userId));
            fetchChatPartners();
        } catch (err) {
            console.error('Failed to unarchive user:', err);
        }
    };

    const fetchChatPartners = async () => {
        try {
            const res = await getChatPartners();
            let partners = res.data;

            // Resolve decrypted previews for E2EE messages from cache
            const encryptedIds = partners
                .filter(p => p.lastMessage?.encryptionVersion === 'e2ee-v1' && p.lastMessage?._id)
                .map(p => p.lastMessage._id);

            if (encryptedIds.length > 0) {
                try {
                    const cached = await getCachedDecryptedMessages(encryptedIds);
                    partners = partners.map(p => {
                        if (p.lastMessage?.encryptionVersion === 'e2ee-v1' && p.lastMessage?._id) {
                            const decrypted = cached.get(p.lastMessage._id);
                            if (decrypted) {
                                return {
                                    ...p,
                                    lastMessage: { ...p.lastMessage, _decryptedPreview: decrypted }
                                };
                            }
                        }
                        return p;
                    });
                } catch (cacheErr) {
                    console.warn('[E2EE] Failed to resolve preview cache:', cacheErr);
                }
            }

            setChatPartners(partners);
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
    }, []);

    // ── Clear unread badge when a chat is opened ──
    useEffect(() => {
        if (selectedContactId) {
            setUnreadCounts(prev => {
                if (!prev[selectedContactId]) return prev;
                const next = { ...prev };
                delete next[selectedContactId];
                return next;
            });
        }
    }, [selectedContactId]);

    // Keep the ref in sync with the prop
    useEffect(() => {
        selectedContactIdRef.current = selectedContactId;
    }, [selectedContactId]);

    // ── WebSocket listeners for real-time stream updates ──
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleMessageReceived = (newMessage) => {
            // Refresh chat partners list when a new message arrives
            fetchChatPartners();

            // Increment unread badge if this chat isn't currently open
            const senderId = newMessage.senderId;
            if (senderId !== selectedContactIdRef.current) {
                setUnreadCounts(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1,
                }));
            }
        };

        const handleMessageSentAck = () => {
            // Refresh chat partners so the sent message preview updates
            fetchChatPartners();
        };

        const handleUserStatus = (data) => {
            setOnlineUsers(prev => ({
                ...prev,
                [data.userId]: data.status
            }));
        };

        const handleUnreadCounts = (counts) => {
            setUnreadCounts(counts);
        };

        const handleActiveUsers = (activeUserIds) => {
            const onlineMap = {};
            activeUserIds.forEach(id => { onlineMap[id] = 'online'; });
            setOnlineUsers(onlineMap);
        };

        const handleMessageEdited = () => {
            fetchChatPartners();
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('message_sent_ack', handleMessageSentAck);
        socket.on('message_edited', handleMessageEdited);
        socket.on('user_status_update', handleUserStatus);
        socket.on('unread_counts', handleUnreadCounts);
        socket.on('active_users', handleActiveUsers);

        return () => {
            socket.off('message_received', handleMessageReceived);
            socket.off('message_sent_ack', handleMessageSentAck);
            socket.off('message_edited', handleMessageEdited);
            socket.off('user_status_update', handleUserStatus);
            socket.off('unread_counts', handleUnreadCounts);
            socket.off('active_users', handleActiveUsers);
        };
    }, []);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const getCardType = (contact) => {
        if (!contact.lastMessage || !contact.lastMessage.image) return 'text';
        const img = contact.lastMessage.image.toLowerCase();

        // Check for documents first
        if (img.includes('.pdf') || img.includes('.doc') || img.includes('.docx') || img.includes('.xls') || img.includes('.xlsx') || img.includes('.ppt') || img.includes('.pptx') || img.includes('.txt') || img.includes('.zip') || img.includes('.rar')) {
            return 'document';
        }

        // Check for audio. We also check the preview text as a hint.
        const preview = getLastMessagePreview(contact);
        if (img.includes('.mp3') || img.includes('.wav') || img.includes('.ogg') || img.includes('audio') || preview === 'Voice' || (img.includes('.webm') && (!img.includes('/video/') || img.includes('f_auto') || img.includes('upload/v')))) {
            return 'audio';
        }

        if (img.includes('/video/') || img.includes('.mp4') || img.includes('.webm') || img.includes('.mov')) {
            return 'large-media';
        }

        return 'image';
    };

    const getLastMessagePreview = (contact) => {
        if (!contact.lastMessage) return contact.email;
        if (contact.lastMessage.image) {
            const img = contact.lastMessage.image.toLowerCase();
            // Check Document first
            if (img.includes('.pdf') || img.includes('.doc') || img.includes('.docx') || img.includes('.xls') || img.includes('.xlsx') || img.includes('.ppt') || img.includes('.pptx') || img.includes('.txt') || img.includes('.zip') || img.includes('.rar')) {
                return 'Document';
            }
            // Check Voice before Video
            if (img.includes('.mp3') || img.includes('.wav') || img.includes('.ogg') || img.includes('audio') || (img.includes('.webm') && !img.includes('/video/'))) {
                return 'Voice';
            }
            if (img.includes('/video/') || img.includes('.mp4') || img.includes('.webm') || img.includes('.mov')) {
                return 'Video';
            }
            return 'Image';
        }
        // E2EE message: use resolved cached preview, or show lock indicator
        if (contact.lastMessage.encryptionVersion === 'e2ee-v1') {
            return contact.lastMessage._decryptedPreview || '\uD83D\uDD12 Encrypted message';
        }
        return contact.lastMessage.text || 'Message';
    };

    const getTimestamp = (contact) => {
        const dateToUse = contact.lastMessage?.createdAt || contact.updatedAt;
        if (dateToUse) {
            const d = new Date(dateToUse);
            const now = new Date();
            const diffMs = now - d;
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 60) return `${diffMins} m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours} h ago`;
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

    const renderCard = (contact) => {
        const type = getCardType(contact);
        const isActive = activeCard === contact._id || selectedContactId === contact._id;

        const CardHeader = () => {
            const status = onlineUsers[contact._id] || 'offline';
            const initials = contact.fullName ? contact.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            const unreadCount = unreadCounts[contact._id] || 0;

            return (
                <div className="card-header">
                    <div className="avatar" style={{
                        position: 'relative',
                        ...(contact.profilePic ? {
                            backgroundImage: `url(${contact.profilePic})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            color: 'transparent'
                        } : {})
                    }}>
                        {!contact.profilePic && initials}
                        {status === 'online' && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-1px',
                                right: '-1px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: 'var(--status-online)',
                                border: '2px solid var(--bg-base)',
                                boxShadow: '0 0 8px var(--status-online-shadow)'
                            }} />
                        )}
                    </div>
                    <span className="user-name">{contact.fullName}</span>
                    <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {unreadCount > 0 && (
                            <div style={{
                                minWidth: '20px',
                                height: '20px',
                                padding: '0 6px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-accent)',
                                background: 'var(--accent)',
                                color: 'var(--text-on-accent)',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        )}
                        <button className="icon-button" style={{ padding: '2px' }}>
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>
            );
        };

        const cardStyle = {};
        const cardClasses = `stream-card ${type}-card ${isActive ? 'active' : ''}`;

        switch (type) {
            case 'document':
                return (
                    <div
                        className={cardClasses}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="doc-content" style={{ background: theme.panelInner, borderColor: theme.borderInner }}>
                            <div className="doc-icon" style={{ background: theme.id === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)', color: theme.id === 'light' ? '#2563eb' : '#60a5fa' }}>
                                <FileIcon size={22} />
                            </div>
                            <div className="doc-info" style={{ justifyContent: 'center' }}>
                                <span style={{ fontSize: '15px', color: 'var(--text-primary)' }}>Document</span>
                            </div>
                        </div>
                        <div className="card-content">
                            <span className={`card-timestamp ${theme.textMuted}`}>{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'text':
                return (
                    <div
                        className={cardClasses}
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
                            <p className={`card-text line-clamp-1 ${theme.textMain}`}>{getLastMessagePreview(contact)}</p>
                            <span className={`card-timestamp whitespace-nowrap ${theme.textMuted}`}>{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'small-media':
                return (
                    <div
                        className={cardClasses}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="media-preview" style={{ background: `linear-gradient(135deg, ${theme.id === 'light' ? 'rgba(30, 144, 255, 0.1)' : 'rgba(138, 43, 226, 0.2)'}, ${theme.id === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(30, 144, 255, 0.2)'})` }}>
                            <div className="play-button" style={{ background: theme.panelInner, borderColor: theme.borderInner }}>
                                <Play size={20} fill={theme.id === 'light' ? '#475569' : 'white'} className={theme.textMain} />
                            </div>
                            <div className="audio-indicator">
                                <div className="waveform-mini">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="wave-bar-mini"
                                            style={{
                                                height: `${Math.random() * 60 + 20}%`,
                                                background: `linear-gradient(to top, ${theme.id === 'light' ? '#3b82f6' : 'rgba(138, 43, 226, 0.7)'}, ${theme.id === 'light' ? '#60a5fa' : 'rgba(147, 51, 234, 0.4)'})`
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="card-content">
                            <span className={`card-timestamp ${theme.textMuted}`}>{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'audio':
                return (
                    <div
                        className={cardClasses}
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
                                        style={{
                                            height: `${Math.random() * 60 + 20}%`,
                                            background: `linear-gradient(to top, ${theme.id === 'light' ? '#3b82f6' : 'rgba(138, 43, 226, 0.6)'}, ${theme.id === 'light' ? '#60a5fa' : 'rgba(147, 51, 234, 0.3)'})`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="card-content">
                            <span className={`card-timestamp ${theme.textMuted}`}>{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'large-media':
                return (
                    <div
                        className={cardClasses}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="large-media-preview" style={contact.lastMessage.image.includes('.mp4') || contact.lastMessage.image.includes('/video/') ? { backgroundImage: `url(${contact.lastMessage.image.replace('.mp4', '.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `1px solid ${theme.borderInner}` } : { border: `1px solid ${theme.borderInner}` }}>
                            <div className="play-button large" style={{ background: theme.panelInner, borderColor: theme.borderInner }}>
                                <Play size={28} fill={theme.id === 'light' ? '#475569' : 'white'} className={theme.textMain} />
                            </div>
                        </div>
                        <div className="card-content">
                            <p className={`card-text line-clamp-1 ${theme.textMain}`}>{getLastMessagePreview(contact)}</p>
                            <span className={`card-timestamp whitespace-nowrap ${theme.textMuted}`}>{getTimestamp(contact)}</span>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div
                        className={cardClasses}
                        onClick={() => { setActiveCard(contact._id); onSelectContact(contact); }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'card', itemId: contact._id });
                        }}
                        style={cardStyle}
                    >
                        <CardHeader />
                        <div className="large-media-preview" style={{ backgroundImage: `url(${contact.lastMessage.image})`, backgroundSize: 'cover', backgroundPosition: 'center', border: `1px solid ${theme.borderInner}` }}>
                            {/* Empty preview - no play button */}
                        </div>
                        <div className="card-content">
                            <p className={`card-text line-clamp-1 ${theme.textMain}`}>{getLastMessagePreview(contact)}</p>
                            <span className={`card-timestamp whitespace-nowrap ${theme.textMuted}`}>{getTimestamp(contact)}</span>
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
        <div className={`stream-panel ${className || ''}`}>
            <div className="stream-header">
                <h2 className="stream-title">Stream</h2>
                <div className="header-actions">
                    {/* <button
                        className="icon-button"
                        onClick={() => { setShowNewChat(true); fetchAllContacts(); }}
                        title="New Chat"
                    >
                        <UserPlus size={18} />
                    </button> */}
                    <div style={{ position: 'relative' }} ref={headerMenuRef}>
                        <button className="icon-button" onClick={() => setShowHeaderMenu(!showHeaderMenu)}>
                            <MoreHorizontal size={18} />
                        </button>
                        {showHeaderMenu && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '110%',
                                minWidth: '180px',
                                background: 'var(--surface-input)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid var(--border-hover)',
                                borderRadius: '12px',
                                boxShadow: '0 10px 40px var(--shadow)',
                                padding: '6px',
                                zIndex: 30
                            }}>
                                <button
                                    onClick={() => { setShowHeaderMenu(false); setShowArchived(true); fetchArchivedUsers(); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <Archive size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    <span>Archived Chats</span>
                                </button>
                                <button
                                    onClick={() => { setShowHeaderMenu(false); fetchChatPartners(); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s',
                                        fontFamily: "'Inter', sans-serif"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <RefreshCw size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
                                    <span>Refresh Feed</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* <div className="stream-divider"></div> */}

            {/* Archived Users Modal Overlay */}
            {showArchived && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
                    background: 'var(--surface-panel)',
                    backdropFilter: 'blur(25px) saturate(180%)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: '0 20px 50px var(--shadow)',
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Archive size={18} style={{ color: 'var(--accent)' }} />
                            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                Archived Chats
                            </span>
                        </div>
                        <button
                            onClick={() => setShowArchived(false)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Archived users list */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px 12px' }}>
                        {loadingArchived ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                                <div style={{
                                    width: '24px', height: '24px',
                                    border: '2px solid var(--border-accent)',
                                    borderTopColor: 'var(--accent)',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : archivedUsers.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '30px 16px' }}>
                                <Archive size={28} style={{ color: 'var(--text-tertiary)', margin: '0 auto 10px', display: 'block' }} />
                                No archived chats
                            </div>
                        ) : (
                            archivedUsers.map(user => (
                                <div
                                    key={user._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: user.profilePic ? `url(${user.profilePic}) center/cover` : 'linear-gradient(135deg, var(--shadow-glow), rgba(168,85,247,0.3))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--border)',
                                        fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)'
                                    }}>
                                        {!user.profilePic && getInitials(user.fullName)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {user.fullName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                            {user.email}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnarchive(user._id)}
                                        title="Unarchive"
                                        style={{
                                            background: 'rgba(var(--accent-rgb), 0.1)',
                                            border: '1px solid var(--border-accent)',
                                            borderRadius: '8px',
                                            padding: '6px 10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: 'var(--accent)',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.2)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.1)'; }}
                                    >
                                        <RotateCcw size={12} />
                                        Unarchive
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* New Chat Modal Overlay */}
            {showNewChat && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    background: 'var(--surface-panel)',
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
                        borderBottom: '1px solid var(--border)'
                    }}>
                        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                            New Chat
                        </span>
                        <button
                            onClick={() => { setShowNewChat(false); setNewChatSearch(''); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-secondary)',
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
                            background: 'var(--surface-input)',
                            border: '1px solid var(--border)'
                        }}>
                            <Search size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
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
                                    color: 'var(--text-primary)',
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
                                    border: '2px solid var(--border-accent)',
                                    borderTopColor: 'var(--accent)',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : filteredNewChatContacts.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '30px 16px' }}>
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
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                                        background: contact.profilePic ? `url(${contact.profilePic}) center/cover` : 'linear-gradient(135deg, var(--shadow-glow), rgba(168,85,247,0.3))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid var(--border)',
                                        fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)'
                                    }}>
                                        {!contact.profilePic && getInitials(contact.fullName)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {contact.fullName}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
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
                            border: '2px solid var(--border-accent)',
                            borderTopColor: 'var(--accent)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : chatPartners.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', padding: '40px 16px', width: '100%' }}>
                        <UserPlus size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                        <p>No chats yet.</p>
                        <p style={{ marginTop: '4px' }}>Click <strong style={{ color: 'var(--accent)' }}>+</strong> above to start a conversation!</p>
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
                                {
                                    label: 'View Chat', icon: <Eye size={16} />, onClick: () => {
                                        const contact = chatPartners.find(c => c._id === contextMenu.itemId);
                                        if (contact) onSelectContact(contact);
                                    }
                                },
                                {
                                    label: 'Archive', icon: <Bookmark size={16} />, onClick: async () => {
                                        try {
                                            await toggleArchiveUser(contextMenu.itemId);
                                            fetchChatPartners();
                                        } catch (err) {
                                            console.error('Failed to archive user:', err);
                                        }
                                    }
                                },
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
