import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreHorizontal, SendHorizontal, X, Mail, Phone as PhoneIcon, User, Info, ArrowLeft, CheckSquare, Trash2, Forward, Copy, Check, Search, ChevronUp, ChevronDown, Reply, MessageSquare } from 'lucide-react';
import ContextMenu from './ContextMenu';

const ChatContainer = () => {
    const [message, setMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [searchMode, setSearchMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
    const [matchingMessageIds, setMatchingMessageIds] = useState([]);
    const menuRef = useRef(null);
    const searchInputRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [contextMenu, setContextMenu] = useState(null);

    // Sample user profile data
    const userProfile = {
        name: 'Stephen Hawking',
        about: 'Theoretical physicist and cosmologist. Author of "A Brief History of Time".',
        email: 'stephen.hawking@cambridge.edu',
        phone: '+44 1223 337733',
        status: 'online',
        joinedDate: 'March 2024'
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMenuOption = (option) => {
        setShowMenu(false);
        if (option === 'profile') {
            setShowProfile(true);
        } else if (option === 'select') {
            setSelectMode(true);
            setSelectedMessages([]);
        } else if (option === 'search') {
            setSearchMode(true);
            setSearchQuery('');
            setMatchingMessageIds([]);
            setCurrentMatchIndex(-1);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    };

    const closeSearch = () => {
        setSearchMode(false);
        setSearchQuery('');
        setMatchingMessageIds([]);
        setCurrentMatchIndex(-1);
    };

    const doesMessageMatch = (msg) => {
        if (!searchQuery.trim()) return false;
        return msg.text?.toLowerCase().includes(searchQuery.toLowerCase());
    };

    // Update matches when query changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            setMatchingMessageIds([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const matches = messages
            .filter(m => m.type !== 'status' && doesMessageMatch(m))
            .map(m => m.id);

        setMatchingMessageIds(matches);
        // If we have matches, select the first one (or keep current if valid?)
        // Simple behavior: reset to first match on query change
        setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    }, [searchQuery]);

    // Scroll to current match within the messages container only
    useEffect(() => {
        if (currentMatchIndex >= 0 && matchingMessageIds.length > 0) {
            const matchId = matchingMessageIds[currentMatchIndex];
            const element = document.getElementById(`msg-${matchId}`);
            const container = messagesContainerRef.current;
            if (element && container) {
                const elementTop = element.offsetTop - container.offsetTop;
                const elementHeight = element.offsetHeight;
                const containerHeight = container.clientHeight;
                const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
                container.scrollTo({ top: scrollTo, behavior: 'smooth' });
            }
        }
    }, [currentMatchIndex, matchingMessageIds]);

    const nextMatch = () => {
        if (matchingMessageIds.length === 0) return;
        setCurrentMatchIndex(prev => (prev + 1) % matchingMessageIds.length);
    };

    const prevMatch = () => {
        if (matchingMessageIds.length === 0) return;
        setCurrentMatchIndex(prev => (prev - 1 + matchingMessageIds.length) % matchingMessageIds.length);
    };

    const toggleMessageSelection = (msgId) => {
        if (!selectMode) return;
        setSelectedMessages(prev => {
            const newSelection = prev.includes(msgId)
                ? prev.filter(id => id !== msgId)
                : [...prev, msgId];
            // If no messages selected, exit select mode
            if (newSelection.length === 0) {
                setSelectMode(false);
            }
            return newSelection;
        });
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedMessages([]);
    };

    const handleDeleteSelected = () => {
        // In real app, delete the selected messages
        console.log('Delete messages:', selectedMessages);
        exitSelectMode();
    };

    const handleForwardSelected = () => {
        // In real app, forward the selected messages
        console.log('Forward messages:', selectedMessages);
        exitSelectMode();
    };

    const handleCopySelected = () => {
        const selectedMsgs = messages.filter(m => selectedMessages.includes(m.id));
        const text = selectedMsgs.map(m => m.text).join('\n');
        navigator.clipboard.writeText(text);
        exitSelectMode();
    };

    const messages = [
        {
            id: 1,
            type: 'received',
            text: 'Hello this is chat testing.........................  ',
            timestamp: '7:23 AM',
            barColor: 'from-purple-500 to-pink-500'
        },
        {
            id: 2,
            type: 'received',
            text: 'Chatmsg should show here pls work.....',
            timestamp: '7:23 AM',
            barColor: 'from-purple-500 to-pink-500'
        },
        {
            id: 3,
            type: 'sent',
            text: "Ig it is workin",
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 4,
            type: 'sent',
            text: 'Well, did you know!',
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 5,
            type: 'received',
            text: "yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            timestamp: '8:24 PM',
            barColor: 'from-cyan-400 to-blue-500'
        },
        {
            id: 6,
            type: 'sent',
            text: 'msg recieved',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 7,
            type: 'sent',
            text: 'So how was the island....',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 8,
            type: 'received',
            text: "not bad...",
            timestamp: '9:06 PM',
            barColor: 'from-yellow-400 to-orange-500'
        },
        {
            id: 9,
            type: 'received',
            text: 'Chatmsg should show here pls work.....',
            timestamp: '7:23 AM',
            barColor: 'from-purple-500 to-pink-500'
        },
        {
            id: 10,
            type: 'sent',
            text: "Ig it is workin",
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 11,
            type: 'sent',
            text: 'Well, did you know!',
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 12,
            type: 'received',
            text: "yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            timestamp: '8:24 PM',
            barColor: 'from-cyan-400 to-blue-500'
        },
        {
            id: 13,
            type: 'sent',
            text: 'msg recieved',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 14,
            type: 'sent',
            text: 'So how was the island....',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 15,
            type: 'received',
            text: "not bad...",
            timestamp: '9:06 PM',
            barColor: 'from-yellow-400 to-orange-500'
        },
        {
            id: 16,
            type: 'received',
            text: 'Chatmsg should show here pls work.....',
            timestamp: '7:23 AM',
            barColor: 'from-purple-500 to-pink-500'
        },
        {
            id: 17,
            type: 'sent',
            text: "Ig it is workin",
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 18,
            type: 'sent',
            text: 'Well, did you know!',
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 19,
            type: 'received',
            text: "yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            timestamp: '8:24 PM',
            barColor: 'from-cyan-400 to-blue-500'
        },
        {
            id: 20,
            type: 'sent',
            text: 'msg recieved',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 21,
            type: 'sent',
            text: 'So how was the island....',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 22,
            type: 'received',
            text: "not bad...",
            timestamp: '9:06 PM',
            barColor: 'from-yellow-400 to-orange-500'
        },
        {
            id: 23,
            type: 'received',
            text: 'Chatmsg should show here pls work.....',
            timestamp: '7:23 AM',
            barColor: 'from-purple-500 to-pink-500'
        },
        {
            id: 24,
            type: 'sent',
            text: "Ig it is workin",
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 25,
            type: 'sent',
            text: 'Well, did you know!',
            timestamp: '7:42 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 26,
            type: 'received',
            text: "yaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            timestamp: '8:24 PM',
            barColor: 'from-cyan-400 to-blue-500'
        },
        {
            id: 27,
            type: 'sent',
            text: 'msg recieved',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 28,
            type: 'sent',
            text: 'So how was the island....',
            timestamp: '8:52 PM',
            barColor: 'from-cyan-400 to-purple-500'
        },
        {
            id: 29,
            type: 'received',
            text: "not bad...",
            timestamp: '9:06 PM',
            barColor: 'from-yellow-400 to-orange-500'
        },
        {
            id: 30,
            type: 'status',
            text: 'Stephen Hawking is online',
            timestamp: '9:06 PM'
        }
    ];

    const handleSendMessage = () => {
        if (message.trim()) {
            // append or handle send here if needed
            setMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col w-[820px] flex-shrink-0" style={{ height: '100%', marginTop: '4px', paddingBottom: '20px' }}>
            {/* Small external label - matches Stream title */}
            <div style={{ padding: '10px 10px 25px 10px' }}>
                <h2 className="text-[24px] font-medium text-white/90 tracking-[0.5px]" style={{ fontFamily: "'Inter', sans-serif" }}>Canvas</h2>
            </div>

            {/* Main Glass Panel */}
            <div className="relative flex-1 rounded-[14px] border border-white/8 overflow-hidden backdrop-blur-3xl bg-gradient-to-br from-[#0b1220]/40 via-[#2b1b3a]/20 to-[#091021]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

                {/* subtle noise */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                    }} />

                {/* left-heavy inner padding to match reference */}
                <div className="px-8" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>


                    {/* Contact header / Selection header */}
                    {selectMode ? (
                        /* Selection Header - WhatsApp style */
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '12px',
                                marginLeft: '32px',
                                marginRight: '32px',
                                marginBottom: '16px',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button
                                    onClick={exitSelectMode}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <X size={20} />
                                </button>
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: '#30FBE6'
                                }}>
                                    {selectedMessages.length} selected
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                    onClick={handleCopySelected}
                                    disabled={selectedMessages.length === 0}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: selectedMessages.length > 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                                        cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => selectedMessages.length > 0 && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    title="Copy"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={handleForwardSelected}
                                    disabled={selectedMessages.length === 0}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: selectedMessages.length > 0 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
                                        cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => selectedMessages.length > 0 && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    title="Forward"
                                >
                                    <Forward size={18} />
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedMessages.length === 0}
                                    style={{
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: selectedMessages.length > 0 ? '#ef4444' : 'rgba(255, 255, 255, 0.3)',
                                        cursor: selectedMessages.length > 0 ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => selectedMessages.length > 0 && (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Normal Contact header */
                        <div className="flex items-center justify-between" style={{ marginTop: '12px', paddingLeft: '32px', paddingRight: '32px' }}>
                            <div className="">
                                <h2 className="text-[36px] leading-tight font-extralight text-white/95 tracking-tight">{userProfile.name}</h2>
                                <div className="flex items-center gap-3 mt-2" style={{ marginBottom: '16px' }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.45)]" />
                                    <span className="text-[12px] text-gray-400/80" >You messaged {userProfile.name}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative" style={{ marginTop: '-30px' }} ref={menuRef}>
                                <button className="text-gray-300/70 hover:text-white/95 transition-colors">
                                    <Phone size={18} strokeWidth={1.5} />
                                </button>
                                <button className="text-gray-300/70 hover:text-white/95 transition-colors">
                                    <Video size={18} strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="text-gray-300/70 hover:text-white/95 transition-colors"
                                >
                                    <MoreHorizontal size={18} strokeWidth={1.5} />
                                </button>

                                {/* Dropdown Menu */}
                                {showMenu && (
                                    <div
                                        className="absolute right-0 top-10 z-50 w-[180px] rounded-[12px] overflow-hidden"
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                                            animation: 'fadeSlideIn 0.15s ease-out'
                                        }}
                                    >
                                        <div style={{ padding: '6px' }}>
                                            <button
                                                onClick={() => handleMenuOption('search')}
                                                className="menu-item"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'rgba(255, 255, 255, 0.85)',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Search size={15} style={{ color: '#30FBE6', flexShrink: 0 }} />
                                                <span>Search Messages</span>
                                            </button>
                                            <button
                                                onClick={() => handleMenuOption('select')}
                                                className="menu-item"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'rgba(255, 255, 255, 0.85)',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <CheckSquare size={15} style={{ color: '#30FBE6', flexShrink: 0 }} />
                                                <span>{selectMode ? 'Cancel Selection' : 'Select Message'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleMenuOption('profile')}
                                                className="menu-item"
                                                style={{
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'rgba(255, 255, 255, 0.85)',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <User size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
                                                <span>View Profile</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    {searchMode && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginLeft: '32px',
                                marginRight: '32px',
                                marginBottom: '12px',
                                padding: '10px 16px',
                                borderRadius: '12px',
                                background: 'rgba(15, 23, 42, 0.8)',
                                border: '1px solid rgba(48, 251, 230, 0.2)',
                                boxShadow: '0 0 20px rgba(48, 251, 230, 0.05)',
                                animation: 'fadeSlideIn 0.2s ease-out'
                            }}
                        >
                            <Search size={16} style={{ color: '#30FBE6', flexShrink: 0 }} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '14px',
                                    fontFamily: "'Inter', sans-serif",
                                    caretColor: '#30FBE6'
                                }}
                            />
                            {searchQuery && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px', paddingRight: '4px' }}>
                                    <span style={{
                                        fontSize: '12px',
                                        color: 'rgba(255, 255, 255, 0.5)',
                                        whiteSpace: 'nowrap',
                                        minWidth: '40px',
                                        textAlign: 'center'
                                    }}>
                                        {matchingMessageIds.length > 0
                                            ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
                                            : '0 found'}
                                    </span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <button
                                            onClick={prevMatch}
                                            disabled={matchingMessageIds.length === 0}
                                            style={{
                                                padding: '2px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: 'none',
                                                color: 'rgba(255,255,255,0.8)',
                                                cursor: 'pointer',
                                                lineHeight: 0
                                            }}
                                            className="hover:bg-white/10"
                                        >
                                            <ChevronUp size={12} />
                                        </button>
                                        <button
                                            onClick={nextMatch}
                                            disabled={matchingMessageIds.length === 0}
                                            style={{
                                                padding: '2px',
                                                borderRadius: '4px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: 'none',
                                                color: 'rgba(255,255,255,0.8)',
                                                cursor: 'pointer',
                                                lineHeight: 0
                                            }}
                                            className="hover:bg-white/10"
                                        >
                                            <ChevronDown size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={closeSearch}
                                style={{
                                    padding: '4px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Messages scroll area */}
                    <div ref={messagesContainerRef} className="overflow-y-auto overflow-x-hidden pr-6 scrollbar-thin scrollbar-thumb-transparent" style={{ flex: 1, maxHeight: 'calc(100% - 200px)' }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, type: 'panel' });
                        }}
                    >

                        {/* large faint watermark behind messages - centered */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
                            <span className="text-[120px] font-bold text-white/[0.03] blur-[1px] whitespace-nowrap">Stephen Hawking</span>
                        </div>

                        <div className="relative z-10 pb-10" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                            {messages.map((msg, index) => {
                                // Check if previous/next messages are same type for connected bars
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                                const isFirstInGroup = !prevMsg || prevMsg.type !== msg.type;
                                const isLastInGroup = !nextMsg || nextMsg.type !== msg.type;
                                const showTimestamp = isFirstInGroup;

                                // Bar rounding based on position in group
                                const barRounding = isFirstInGroup && isLastInGroup ? 'rounded-full'
                                    : isFirstInGroup ? 'rounded-t-full'
                                        : isLastInGroup ? 'rounded-b-full'
                                            : '';

                                // Margin based on group position
                                const marginTop = isFirstInGroup ? 'mt-4' : 'mt-0';

                                if (msg.type === 'status') {
                                    return (
                                        <div key={msg.id} className="flex justify-center mt-4">
                                            <span className="text-[12px] text-gray-500/60 italic">{msg.text}</span>
                                        </div>
                                    );
                                }

                                const isSelected = selectedMessages.includes(msg.id);

                                // Check if adjacent messages are also selected for connected selection styling
                                const prevSelected = prevMsg && selectedMessages.includes(prevMsg.id);
                                const nextSelected = nextMsg && selectedMessages.includes(nextMsg.id);

                                // Calculate border-radius based on selection neighbors
                                const getSelectionRadius = () => {
                                    if (!isSelected) return '0';
                                    if (prevSelected && nextSelected) return '0'; // middle of selection
                                    if (prevSelected && !nextSelected) return '0 0 8px 8px'; // last in selection
                                    if (!prevSelected && nextSelected) return '8px 8px 0 0'; // first in selection
                                    return '8px'; // single selected message
                                };

                                const isSearchMatch = matchingMessageIds.includes(msg.id);
                                const isCurrentMatch = isSearchMatch && matchingMessageIds[currentMatchIndex] === msg.id;

                                if (msg.type === 'received') {
                                    return (
                                        <div
                                            key={msg.id}
                                            id={`msg-${msg.id}`}
                                            className={`flex items-center gap-3 ${marginTop} ${selectMode ? 'cursor-pointer' : ''}`}
                                            onClick={() => toggleMessageSelection(msg.id)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setContextMenu({ x: e.clientX, y: e.clientY, type: 'message', msgId: msg.id, msgText: msg.text });
                                            }}
                                            style={{
                                                marginLeft: '-16px',
                                                marginRight: '-16px',
                                                paddingLeft: '16px',
                                                paddingRight: '16px',
                                                paddingTop: isSelected && !prevSelected ? '8px' : isSelected ? '4px' : '0',
                                                paddingBottom: isSelected && !nextSelected ? '8px' : isSelected ? '4px' : '0',
                                                background: isSelected ? 'rgba(48, 251, 230, 0.08)' : 'transparent',
                                                borderRadius: getSelectionRadius(),
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {/* Selection checkbox */}
                                            {selectMode && (
                                                <div
                                                    style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '50%',
                                                        border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                                                        background: isSelected ? '#30FBE6' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {isSelected && <Check size={14} style={{ color: '#000' }} />}
                                                </div>
                                            )}
                                            <div className="flex items-stretch gap-6 max-w-[70%]" style={{
                                                opacity: searchMode && searchQuery && !isSearchMatch ? 0.3 : 1,
                                                transform: isCurrentMatch ? 'scale(1.02)' : 'scale(1)',
                                                transformOrigin: msg.type === 'received' ? 'left center' : 'right center',
                                                boxShadow: isCurrentMatch ? '0 0 20px rgba(48, 251, 230, 0.15)' : 'none',
                                                borderRadius: '12px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}>
                                                <div className={`w-[4px] ${barRounding} bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.18)]`} />
                                                <div className="flex flex-col gap-1 py-1">
                                                    {showTimestamp && <div className="text-[12px] text-gray-400/75">Received • {msg.timestamp}</div>}
                                                    <div className="text-[15px] leading-relaxed text-white/85 max-w-[720px]">{msg.text}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (msg.type === 'sent') {
                                    return (
                                        <div
                                            key={msg.id}
                                            id={`msg-${msg.id}`}
                                            className={`flex items-center justify-end gap-3 ${marginTop} ${selectMode ? 'cursor-pointer' : ''}`}
                                            onClick={() => toggleMessageSelection(msg.id)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setContextMenu({ x: e.clientX, y: e.clientY, type: 'message', msgId: msg.id, msgText: msg.text });
                                            }}
                                            style={{
                                                marginLeft: '-16px',
                                                marginRight: '-16px',
                                                paddingLeft: '16px',
                                                paddingRight: '16px',
                                                paddingTop: isSelected && !prevSelected ? '8px' : isSelected ? '4px' : '0',
                                                paddingBottom: isSelected && !nextSelected ? '8px' : isSelected ? '4px' : '0',
                                                background: isSelected ? 'rgba(48, 251, 230, 0.08)' : 'transparent',
                                                borderRadius: getSelectionRadius(),
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div className="flex items-stretch gap-6 max-w-[70%]" style={{
                                                opacity: searchMode && searchQuery && !isSearchMatch ? 0.3 : 1,
                                                transform: isCurrentMatch ? 'scale(1.02)' : 'scale(1)',
                                                transformOrigin: msg.type === 'received' ? 'left center' : 'right center',
                                                boxShadow: isCurrentMatch ? '0 0 20px rgba(48, 251, 230, 0.15)' : 'none',
                                                borderRadius: '12px',
                                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}>
                                                <div className="flex flex-col gap-1 items-end py-1">
                                                    {showTimestamp && <div className="text-[12px] text-gray-400/70">{msg.timestamp}</div>}
                                                    <div className="text-[15px] leading-relaxed text-white/85 text-right">{msg.text}</div>
                                                </div>
                                                <div className={`w-[4px] ${barRounding} bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.14)]`} />
                                            </div>
                                            {/* Selection checkbox */}
                                            {selectMode && (
                                                <div
                                                    style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '50%',
                                                        border: isSelected ? 'none' : '2px solid rgba(255, 255, 255, 0.3)',
                                                        background: isSelected ? '#30FBE6' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                >
                                                    {isSelected && <Check size={14} style={{ color: '#000' }} />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>

                    {/* Bottom centered input like the second image */}
                    <div className="flex justify-center" style={{ marginTop: 'auto', paddingTop: '16px', paddingBottom: '20px' }}>
                        <div className="w-[86%] max-w-[820px] h-[56px] bg-black/20 backdrop-blur-xl border border-white/8 shadow-[0_8px_30px_rgba(2,6,23,0.6)] flex items-center gap-3" style={{ borderRadius: '28px', paddingLeft: '24px', paddingRight: '4px' }}>

                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message"
                                className="flex-1 bg-transparent text-white/90 text-[15px] placeholder-white/30 outline-none"
                            />

                            <button
                                onClick={handleSendMessage}
                                className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0"
                                style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)' }}
                                aria-label="Send"
                            >
                                <SendHorizontal size={18} className="text-white" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Profile Panel Overlay */}
            {showProfile && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfile(false)}
                        style={{
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(4px)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    />

                    {/* Profile Panel */}
                    <div
                        className="fixed right-0 top-0 h-full z-50"
                        style={{
                            width: '360px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.5)',
                            animation: 'slideInRight 0.25s ease-out'
                        }}
                    >
                        <div style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '20px 24px'
                        }}>
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '24px'
                            }}>
                                <button
                                    onClick={() => setShowProfile(false)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                    }}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    color: 'rgba(255, 255, 255, 0.9)'
                                }}>
                                    Profile
                                </span>
                                <button
                                    onClick={() => setShowProfile(false)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Avatar Section */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                marginBottom: '24px'
                            }}>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '90px',
                                        height: '90px',
                                        borderRadius: '50%',
                                        padding: '3px',
                                        background: 'linear-gradient(135deg, #30FBE6, #a855f7)',
                                        boxShadow: '0 0 25px rgba(48, 251, 230, 0.3)'
                                    }}>
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <User size={36} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                        </div>
                                    </div>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        background: '#22c55e',
                                        border: '3px solid rgba(15, 23, 42, 0.95)',
                                        boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                                    }} />
                                </div>
                                <h2 style={{
                                    fontSize: '22px',
                                    fontWeight: 400,
                                    color: 'rgba(255, 255, 255, 0.95)',
                                    marginBottom: '6px',
                                    textAlign: 'center'
                                }}>
                                    {userProfile.name}
                                </h2>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    color: '#22c55e'
                                }}>
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#22c55e'
                                    }} />
                                    Online
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{
                                height: '1px',
                                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                marginBottom: '20px'
                            }} />

                            {/* Profile Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflow: 'auto' }}>
                                {/* About */}
                                <div style={{
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <Info size={14} style={{ color: '#a855f7' }} />
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.5)' }}>About</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: 1.5, marginLeft: '24px' }}>{userProfile.about}</p>
                                </div>

                                {/* Email */}
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <Mail size={14} style={{ color: '#30FBE6' }} />
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.5)' }}>Email</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginLeft: '24px' }}>{userProfile.email}</p>
                                </div>

                                {/* Phone */}
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <PhoneIcon size={14} style={{ color: '#22c55e' }} />
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.5)' }}>Phone</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginLeft: '24px' }}>{userProfile.phone}</p>
                                </div>

                                {/* Member Since */}
                                <div
                                    style={{
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <User size={14} style={{ color: '#a855f7' }} />
                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.5)' }}>Member Since</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginLeft: '24px' }}>{userProfile.joinedDate}</p>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(48, 251, 230, 0.3)',
                                        background: 'rgba(48, 251, 230, 0.1)',
                                        color: '#30FBE6',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(48, 251, 230, 0.18)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(48, 251, 230, 0.1)';
                                    }}
                                >
                                    Send Message
                                </button>
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                    }}
                                >
                                    Block User
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
            `}</style>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={
                        contextMenu.type === 'message'
                            ? [
                                { label: 'Reply', icon: <Reply size={16} />, onClick: () => { } },
                                { label: 'Copy', icon: <Copy size={16} />, onClick: () => navigator.clipboard.writeText(contextMenu.msgText) },
                                { label: 'Forward', icon: <Forward size={16} />, onClick: () => { } },
                                { divider: true },
                                { label: 'Select', icon: <CheckSquare size={16} />, onClick: () => { setSelectMode(true); toggleMessageSelection(contextMenu.msgId); } },
                                { label: 'Delete', icon: <Trash2 size={16} />, color: '#ef4444', onClick: () => { } },
                            ]
                            : [
                                { label: 'Search Messages', icon: <Search size={16} />, onClick: () => { setSearchMode(true); } },
                                { label: 'Select Messages', icon: <CheckSquare size={16} />, onClick: () => setSelectMode(true) },
                                { divider: true },
                                { label: 'Clear Chat', icon: <Trash2 size={16} />, color: '#ef4444', onClick: () => { } },
                            ]
                    }
                />
            )}
        </div>
    );
};

export default ChatContainer;
