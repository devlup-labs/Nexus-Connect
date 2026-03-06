import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, MoreHorizontal, SendHorizontal, X, Mail, Phone as PhoneIcon, User, Info, ArrowLeft, CheckSquare, Trash2, Forward, Copy, Check, Search, ChevronUp, ChevronDown, Reply, MessageSquare, Paperclip, Mic, Image as ImageIcon, FileText as FileIcon, XCircle, Square as StopIcon } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { getMessages, sendMessage, deleteForMe, deleteForEveryone, editMessage } from '../api';

const ChatContainer = ({ selectedContact, authUser, onLogout }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
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
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const attachMenuRef = useRef(null);

    // Recording timer and click outside effects
    useEffect(() => {
        let timer;
        if (isRecording) {
            timer = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(timer);
    }, [isRecording]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatRecordingTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Fetch messages when a contact is selected
    useEffect(() => {
        if (!selectedContact?._id) {
            setMessages([]);
            return;
        }
        let cancelled = false;

        const fetchMessages = async () => {
            setLoadingMsgs(true);
            try {
                const res = await getMessages(selectedContact._id);
                if (!cancelled) {
                    setMessages(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            } finally {
                if (!cancelled) setLoadingMsgs(false);
            }
        };

        fetchMessages();

        // Poll for new messages every 3 seconds
        const interval = setInterval(async () => {
            try {
                const res = await getMessages(selectedContact._id);
                if (!cancelled) setMessages(res.data);
            } catch (err) { /* silently fail */ }
        }, 3000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [selectedContact?._id]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

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
            .filter(m => doesMessageMatch(m))
            .map(m => m._id);

        setMatchingMessageIds(matches);
        setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    }, [searchQuery, messages]);

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

    const handleDeleteSelected = async () => {
        for (const msgId of selectedMessages) {
            try {
                await deleteForMe(msgId);
            } catch (err) {
                console.error('Failed to delete message:', err);
            }
        }
        setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
        exitSelectMode();
    };

    const handleForwardSelected = () => {
        console.log('Forward messages:', selectedMessages);
        exitSelectMode();
    };

    const handleCopySelected = () => {
        const selectedMsgs = messages.filter(m => selectedMessages.includes(m._id));
        const text = selectedMsgs.map(m => m.text).join('\n');
        navigator.clipboard.writeText(text);
        exitSelectMode();
    };

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedContact?._id) return;

        const text = message.trim();
        setMessage('');

        // Optimistic update
        const optimisticMsg = {
            _id: 'temp-' + Date.now(),
            senderId: authUser._id,
            receiverId: selectedContact._id,
            text,
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await sendMessage(selectedContact._id, { text });
            // Replace optimistic message with real one
            setMessages(prev =>
                prev.map(m => m._id === optimisticMsg._id ? res.data : m)
            );
        } catch (err) {
            console.error('Failed to send message:', err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            setMessage(text); // restore the text
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    // No contact selected placeholder
    if (!selectedContact) {
        return (
            <div className="flex flex-col w-[820px] flex-shrink-0" style={{ height: '100%', marginTop: '4px', paddingBottom: '20px' }}>
                <div style={{ padding: '0px', marginTop: '30px', marginBottom: '-25px' }}>
                    <h2 className="text-[24px] font-medium text-white/90 tracking-[0.5px]" style={{ fontFamily: "'Inter', sans-serif" }}>Canvas</h2>
                </div>
                <div className="relative flex-1 rounded-[14px] border border-white/8 overflow-hidden backdrop-blur-3xl bg-gradient-to-br from-[#0b1220]/40 via-[#2b1b3a]/20 to-[#091021]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
                        <MessageSquare size={64} style={{ color: 'rgba(48, 251, 230, 0.2)' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif" }}>
                            Select a contact to start chatting
                        </h3>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', maxWidth: '300px', textAlign: 'center' }}>
                            Choose a person from the panel on the left to begin your conversation
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Derive message type from senderId
    const processedMessages = messages.map(msg => ({
        ...msg,
        type: msg.senderId === authUser._id ? 'sent' : 'received',
    }));

    return (
        <div className="flex flex-col w-[820px] flex-shrink-0" style={{ height: '100%', marginTop: '4px', paddingBottom: '20px' }}>
            <div style={{ padding: '0px', marginTop: '30px', marginBottom: '-25px' }}>
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
                        <div className="flex items-center justify-between" style={{ marginTop: '4px', paddingLeft: '32px', paddingRight: '32px' }}>
                            <div className="">
                                <h2 className="text-[36px] leading-tight font-extralight text-white/95 tracking-tight" style={{ marginTop: '15px' }}>{selectedContact.fullName}</h2>
                                <div className="flex items-center gap-3 mt-1" style={{ marginBottom: '6px' }}>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.45)]" />
                                    <span className="text-[12px] text-gray-400/80" >You messaged {selectedContact.fullName}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative" style={{ marginTop: '-60px' }} ref={menuRef}>
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
                            <span className="text-[120px] font-bold text-white/[0.03] blur-[1px] whitespace-nowrap">{selectedContact.fullName}</span>
                        </div>

                        {loadingMsgs ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    border: '3px solid rgba(48, 251, 230, 0.15)',
                                    borderTopColor: '#30FBE6',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        ) : processedMessages.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '8px' }}>
                                <MessageSquare size={32} style={{ color: 'rgba(255,255,255,0.15)' }} />
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No messages yet. Say hello!</span>
                            </div>
                        ) : (
                            <div className="relative z-10 pb-10" style={{ paddingLeft: '32px', paddingRight: '32px' }}>
                                {processedMessages.map((msg, index) => {
                                    const prevMsg = index > 0 ? processedMessages[index - 1] : null;
                                    const nextMsg = index < processedMessages.length - 1 ? processedMessages[index + 1] : null;
                                    const isFirstInGroup = !prevMsg || prevMsg.type !== msg.type;
                                    const isLastInGroup = !nextMsg || nextMsg.type !== msg.type;
                                    const showTimestamp = isFirstInGroup;

                                    const barRounding = isFirstInGroup && isLastInGroup ? 'rounded-full'
                                        : isFirstInGroup ? 'rounded-t-full'
                                            : isLastInGroup ? 'rounded-b-full'
                                                : '';

                                    const marginTop = isFirstInGroup ? 'mt-4' : 'mt-0';

                                    const isSelected = selectedMessages.includes(msg._id);
                                    const prevSelected = prevMsg && selectedMessages.includes(prevMsg._id);
                                    const nextSelected = nextMsg && selectedMessages.includes(nextMsg._id);

                                    const getSelectionRadius = () => {
                                        if (!isSelected) return '0';
                                        if (prevSelected && nextSelected) return '0';
                                        if (prevSelected && !nextSelected) return '0 0 8px 8px';
                                        if (!prevSelected && nextSelected) return '8px 8px 0 0';
                                        return '8px';
                                    };

                                    const isSearchMatch = matchingMessageIds.includes(msg._id);
                                    const isCurrentMatch = isSearchMatch && matchingMessageIds[currentMatchIndex] === msg._id;

                                    if (msg.type === 'received') {
                                        return (
                                            <div
                                                key={msg._id}
                                                id={`msg-${msg._id}`}
                                                className={`flex items-center gap-3 ${marginTop} ${selectMode ? 'cursor-pointer' : ''}`}
                                                onClick={() => toggleMessageSelection(msg._id)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'message', msgId: msg._id, msgText: msg.text, msgSenderId: msg.senderId });
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
                                                    transformOrigin: 'left center',
                                                    boxShadow: isCurrentMatch ? '0 0 20px rgba(48, 251, 230, 0.15)' : 'none',
                                                    borderRadius: '12px',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}>
                                                    <div className={`w-[4px] ${barRounding} bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.18)]`} />
                                                    <div className="flex flex-col gap-1 py-1">
                                                        {showTimestamp && <div className="text-[12px] text-gray-400/75">Received • {formatTime(msg.createdAt)}</div>}
                                                        <div className="text-[15px] leading-relaxed text-white/85 max-w-[720px]">{msg.text}</div>
                                                        {msg.image && (
                                                            <img src={msg.image} alt="attachment" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '4px' }} />
                                                        )}
                                                        {msg.isEdited && <span className="text-[10px] text-gray-500 italic">edited</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (msg.type === 'sent') {
                                        return (
                                            <div
                                                key={msg._id}
                                                id={`msg-${msg._id}`}
                                                className={`flex items-center justify-end gap-3 ${marginTop} ${selectMode ? 'cursor-pointer' : ''}`}
                                                onClick={() => toggleMessageSelection(msg._id)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'message', msgId: msg._id, msgText: msg.text, msgSenderId: msg.senderId });
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
                                                    transition: 'all 0.15s ease',
                                                    opacity: msg._optimistic ? 0.6 : 1
                                                }}
                                            >
                                                <div className="flex items-stretch gap-6 max-w-[70%]" style={{
                                                    opacity: searchMode && searchQuery && !isSearchMatch ? 0.3 : 1,
                                                    transform: isCurrentMatch ? 'scale(1.02)' : 'scale(1)',
                                                    transformOrigin: 'right center',
                                                    boxShadow: isCurrentMatch ? '0 0 20px rgba(48, 251, 230, 0.15)' : 'none',
                                                    borderRadius: '12px',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}>
                                                    <div className="flex flex-col gap-1 items-end py-1">
                                                        {showTimestamp && <div className="text-[12px] text-gray-400/70">{formatTime(msg.createdAt)}</div>}
                                                        <div className="text-[15px] leading-relaxed text-white/85 text-right">{msg.text}</div>
                                                        {msg.image && (
                                                            <img src={msg.image} alt="attachment" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '4px' }} />
                                                        )}
                                                        {msg.isEdited && <span className="text-[10px] text-gray-500 italic">edited</span>}
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
                        )}
                    </div>

                    {/* Bottom centered input */}
                    <div className="flex justify-center" style={{ marginTop: 'auto', paddingTop: '16px', paddingBottom: '20px' }}>
                        <div
                            className="w-[86%] max-w-[820px] h-[56px] bg-black/20 backdrop-blur-xl border border-white/8 shadow-[0_8px_30px_rgba(2,6,23,0.6)] flex items-center relative"
                            style={{ borderRadius: '28px', paddingLeft: '8px', paddingRight: '8px' }}
                        >
                            {/* Attachment Menu */}
                            {showAttachMenu && (
                                <div
                                    ref={attachMenuRef}
                                    style={{
                                        position: 'absolute',
                                        bottom: '70px',
                                        left: '20px',
                                        background: 'rgba(15, 23, 42, 0.95)',
                                        backdropFilter: 'blur(16px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '16px',
                                        padding: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                        zIndex: 50,
                                        width: '180px'
                                    }}
                                >
                                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white" onClick={() => setShowAttachMenu(false)}>
                                        <FileIcon size={18} className="text-blue-400" />
                                        <span className="text-[14px] font-medium">Document</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white" onClick={() => setShowAttachMenu(false)}>
                                        <ImageIcon size={18} className="text-purple-400" />
                                        <span className="text-[14px] font-medium">Image</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white" onClick={() => setShowAttachMenu(false)}>
                                        <Video size={18} className="text-pink-400" />
                                        <span className="text-[14px] font-medium">Video</span>
                                    </button>
                                </div>
                            )}

                            {isRecording ? (
                                /* Recording UI */
                                <div className="flex-1 flex items-center justify-between px-4 h-full">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setIsRecording(false)}
                                            className="text-gray-400 hover:text-red-400 transition-colors"
                                            title="Cancel Recording"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div style={{
                                                width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444',
                                                boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
                                                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                            }} />
                                            <span className="text-red-400 text-[15px] font-medium tracking-wide">
                                                {formatRecordingTime ? formatRecordingTime(recordingTime) : `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsRecording(false)}
                                            className="w-[40px] h-[40px] rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors flex items-center justify-center flex-shrink-0"
                                        >
                                            <StopIcon size={18} fill="currentColor" />
                                        </button>
                                        <button
                                            onClick={() => { setIsRecording(false); /* send logic */ }}
                                            className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0"
                                            style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.6)' }}
                                        >
                                            <SendHorizontal size={18} className="text-white" />
                                        </button>
                                    </div>
                                    <style>{`
                                        @keyframes pulse {
                                            0%, 100% { opacity: 1; transform: scale(1); }
                                            50% { opacity: 0.5; transform: scale(1.2); }
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                /* Normal Input UI */
                                <>
                                    <button
                                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                                        className="w-[40px] h-[40px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 ml-1"
                                    >
                                        <Paperclip size={20} />
                                    </button>

                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent text-white/90 text-[15px] placeholder-white/40 outline-none px-3 h-full"
                                    />

                                    <div className="flex items-center gap-2 mr-1">
                                        {!message.trim() && (
                                            <button
                                                onClick={() => setIsRecording(true)}
                                                className="w-[40px] h-[40px] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                                            >
                                                <Mic size={20} />
                                            </button>
                                        )}
                                        {(message.trim() || true) && (
                                            <button
                                                onClick={handleSendMessage}
                                                className={`w-[40px] h-[40px] rounded-full ${message.trim() ? 'bg-gradient-to-br from-cyan-400 to-teal-500 hover:scale-105' : 'bg-white/10 text-white/50'} transition-all flex items-center justify-center flex-shrink-0`}
                                                style={message.trim() ? { boxShadow: '0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3)' } : {}}
                                                aria-label="Send"
                                                disabled={!message.trim()}
                                            >
                                                <SendHorizontal size={18} className={message.trim() ? 'text-white' : 'currentColor'} />
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
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
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            {selectedContact.profilePic ? (
                                                <img src={selectedContact.profilePic} alt={selectedContact.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={36} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                            )}
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
                                    {selectedContact.fullName}
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
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginLeft: '24px' }}>{selectedContact.email}</p>
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
                                    <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginLeft: '24px' }}>
                                        {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            {/* Bottom Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowProfile(false)}
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
                                {
                                    label: 'Delete for Me', icon: <Trash2 size={16} />, color: '#ef4444', onClick: async () => {
                                        try {
                                            await deleteForMe(contextMenu.msgId);
                                            setMessages(prev => prev.filter(m => m._id !== contextMenu.msgId));
                                        } catch (err) { console.error(err); }
                                    }
                                },
                                ...(contextMenu.msgSenderId === authUser._id ? [{
                                    label: 'Delete for Everyone', icon: <Trash2 size={16} />, color: '#ef4444', onClick: async () => {
                                        try {
                                            await deleteForEveryone(contextMenu.msgId);
                                            setMessages(prev => prev.filter(m => m._id !== contextMenu.msgId));
                                        } catch (err) { console.error(err); }
                                    }
                                }] : []),
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
