import React, { useState, useRef, useEffect, useContext } from 'react';
import { Phone, Video, MoreHorizontal, SendHorizontal, X, Mail, Phone as PhoneIcon, User, Info, ArrowLeft, CheckSquare, Trash2, Forward, Copy, Check, Search, ChevronUp, ChevronDown, Reply, MessageSquare, Paperclip, Mic, Image as ImageIcon, FileText as FileIcon, XCircle, Square as StopIcon, Download, Play, Pause, Maximize, Volume2, VolumeX, Minimize, Lock, Shield } from 'lucide-react';
import ContextMenu from './ContextMenu';
import { getMessages, sendMessage, deleteForMe, deleteForEveryone, editMessage, getContacts } from '../api';
import { getSocket, emitTyping, emitStoppedTyping, emitMarkAsRead, getActiveUsers } from '../services/socket';
import { ThemeContext } from '../contexts/ThemeContext';
import { encryptMessage, decryptMessage, decryptMessagesBatch, isCryptoReady, hasSession, getOrCreateSession, resetSession, isE2EESupported } from '../services/keyManager';
import { cacheDecryptedMessage } from '../services/sessionStore';

const CustomAudioPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleSpeed = () => {
        const speeds = [1, 1.5, 2];
        const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        if (!audioRef.current) return;
        if (audioRef.current.duration === Infinity || isNaN(audioRef.current.duration)) {
            audioRef.current.currentTime = 1e101;
            audioRef.current.ontimeupdate = () => {
                audioRef.current.ontimeupdate = onTimeUpdate;
                setDuration(audioRef.current.duration);
                audioRef.current.currentTime = 0;
            };
        } else {
            setDuration(audioRef.current.duration);
        }
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] p-2.5 px-4 rounded-2xl min-w-[320px] mt-2 group/audio backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-[var(--border-hover)]">
            <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[rgba(var(--accent-rgb),0.2)] flex items-center justify-center hover:bg-[rgba(var(--accent-rgb),0.3)] transition-all duration-300 shrink-0 border border-[rgba(var(--accent-rgb),0.3)] shadow-[0_0_15px_var(--shadow-glow)]"
            >
                {isPlaying ? (
                    <div className="flex gap-1 items-center">
                        <div className="w-0.5 h-3 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:0.6s]" />
                        <div className="w-0.5 h-3 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]" />
                        <div className="w-0.5 h-3 bg-[var(--accent)] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                    </div>
                ) : (
                    <Play size={18} className="text-[var(--accent)] fill-cyan-400 ml-0.5" />
                )}
            </button>
            <div className="flex-1 flex items-center gap-2.5">
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold tabular-nums min-w-[28px]">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-6 flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={duration > 0 ? duration : 0.001}
                        step="0.01"
                        value={currentTime}
                        onChange={handleSeek}
                        className="audio-slider w-full h-1 bg-[var(--surface-hover)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] z-10"
                    />
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-bold tabular-nums min-w-[28px] text-right">{formatTime(duration)}</span>
            </div>
            <button
                onClick={toggleSpeed}
                className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[11px] font-black text-[var(--accent)] hover:bg-[var(--surface-hover)] hover:text-[var(--accent)] transition-all shrink-0 hover:scale-105 active:scale-95"
            >
                {playbackRate}x
            </button>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                    if (audioRef.current) audioRef.current.currentTime = 0;
                }}
                className="hidden"
            />
        </div>
    );
};

const CustomVideoPlayer = ({ src }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const togglePlay = (e) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;
        if (isPlaying) videoRef.current.pause();
        else videoRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const toggleSpeed = (e) => {
        if (e) e.stopPropagation();
        const speeds = [1, 1.5, 2];
        const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    };

    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = (e) => {
        if (e) e.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    };

    // Listen for fullscreen change events (e.g. if user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const onTimeUpdate = () => {
        if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
    };

    const onLoadedMetadata = () => {
        if (videoRef.current) setDuration(videoRef.current.duration);
    };

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e) => {
        if (e) e.stopPropagation();
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative group mt-2 w-full max-w-[420px] aspect-video overflow-hidden rounded-2xl border border-[var(--border)] bg-black/20 shadow-2xl transition-all duration-300 hover:border-[var(--border-hover)]"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onClick={togglePlay}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Center Play/Pause Overlay */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer transition-opacity"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center animate-pulse shadow-[0_0_30px_var(--shadow-glow)]">
                        <Play size={32} className="text-[var(--text-on-accent)] fill-[var(--text-on-accent)] ml-1" />
                    </div>
                </div>
            )}

            {/* Bottom Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/80 via-black/40 to-transparent transition-all duration-300 ${showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Seek Bar */}
                <div className="relative h-1 mb-3 group/seek">
                    <input
                        type="range"
                        min="0"
                        max={duration > 0 ? duration : 0.001}
                        step="0.01"
                        value={currentTime}
                        onChange={handleSeek}
                        onClick={(e) => e.stopPropagation()}
                        className="audio-slider absolute inset-0 w-full h-full bg-[var(--surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--accent)] z-10"
                    />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={togglePlay} className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </button>
                        <div className="flex items-center gap-1.5 ml-2">
                            <button onClick={toggleMute} className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <input
                                type="range" min="0" max="1" step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    if (videoRef.current) videoRef.current.volume = v;
                                    setIsMuted(v === 0);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 h-1 bg-[var(--surface-hover)] rounded-full appearance-none cursor-pointer accent-[var(--text-primary)] hover:accent-[var(--accent)] hidden sm:block"
                            />
                        </div>
                        <span className="text-[10px] text-[var(--text-primary)] font-medium tabular-nums ml-1 shrink-0 bg-[var(--surface)] px-1.5 py-0.5 rounded-md border border-[var(--border)]">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={toggleSpeed}
                            className="px-1.5 py-0.5 rounded bg-[var(--surface-hover)] text-[9px] font-black text-[var(--accent)]/90 border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all"
                        >
                            {playbackRate}x
                        </button>
                        <button onClick={toggleFullscreen} className="text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors p-1 rounded-lg hover:bg-[var(--surface)]">
                            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                    </div>
                </div>
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); downloadAttachment(src); }}
                className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 border border-[var(--border-hover)] shadow-xl"
            >
                <Download size={16} className="text-[var(--text-primary)]" />
            </button>
        </div>
    );
};

const ChatContainer = ({ selectedContact, authUser, onLogout, onStartCall }) => {
    const { theme } = useContext(ThemeContext);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
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
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [sendingImage, setSendingImage] = useState(false);
    const [attachedFileName, setAttachedFileName] = useState('');
    const [attachedFileType, setAttachedFileType] = useState('image');
    const [attachedFileSize, setAttachedFileSize] = useState(0);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [forwardContacts, setForwardContacts] = useState([]);
    const [forwardSearch, setForwardSearch] = useState('');
    const [forwardSelectedUsers, setForwardSelectedUsers] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [editMessageText, setEditMessageText] = useState('');
    const attachMenuRef = useRef(null);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    // E2EE state
    const [isE2EEActive, setIsE2EEActive] = useState(false);
    const [e2eeStatus, setE2eeStatus] = useState('none'); // 'none', 'supported', 'active'

    // New states for Message Info
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedInfoMessage, setSelectedInfoMessage] = useState(null);

    // WebSocket states
    const [isContactTyping, setIsContactTyping] = useState(false);
    const [contactOnlineStatus, setContactOnlineStatus] = useState('offline');
    const typingTimeoutRef = useRef(null);
    const activeUsersRef = useRef(getActiveUsers());

    useEffect(() => {
        if (selectedContact?._id) {
            setContactOnlineStatus(
                getActiveUsers().includes(selectedContact._id) ? 'online' : 'offline'
            );
        } else {
            setContactOnlineStatus('offline');
        }
    }, [selectedContact?._id]);

    // Recording timer and click outside effects
    useEffect(() => {
        let timer;
        if (isRecording) {
            timer = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            startRecording();
        } else {
            setRecordingTime(0);
            stopRecording();
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    setSelectedImage(base64Audio); // Reusing media state
                    setAttachedFileType('audio');
                    setAttachedFileName('Voice Note');
                    setAttachedFileSize(audioBlob.size);
                    setImagePreview(null); // No preview for audio
                };
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsRecording(false);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

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

    // Fetch contacts for forwarding
    useEffect(() => {
        if (showForwardModal) {
            getContacts().then(res => setForwardContacts(res.data)).catch(console.error);
        } else {
            setForwardSearch('');
            setForwardSelectedUsers([]);
        }
    }, [showForwardModal]);

    // Fetch messages when a contact is selected (HTTP for history, no more polling)
    useEffect(() => {
        if (!selectedContact?._id) {
            setMessages([]);
            return;
        }

        // Reset per-chat state when switching contacts
        setIsContactTyping(false);
        setMessage('');
        setReplyingTo(null);
        setSearchMode(false);
        setSearchQuery('');
        setSelectMode(false);
        setSelectedMessages([]);
        setShowMenu(false);
        setShowProfile(false);
        let cancelled = false;

        const fetchMessages = async () => {
            setLoadingMsgs(true);
            try {
                const res = await getMessages(selectedContact._id);
                if (!cancelled) {
                    // Decrypt E2EE messages
                    let msgs = res.data;
                    if (isCryptoReady()) {
                        msgs = await decryptMessagesBatch(authUser._id, selectedContact._id, msgs);
                        // Check if E2EE is active for this conversation
                        const hasE2EE = msgs.some(m => m.encryptionVersion === 'e2ee-v1');
                        const supported = await isE2EESupported(selectedContact._id);
                        const active = await hasSession(selectedContact._id);
                        setE2eeStatus(active ? 'active' : (supported ? 'supported' : 'none'));
                        setIsE2EEActive(hasE2EE || active);
                    }
                    setMessages(msgs);
                    // Mark unread messages as read
                    const unreadMsgIds = msgs
                        .filter(m => String(m.receiverId) === String(authUser._id) && m.status !== 'read')
                        .map(m => m._id);
                    if (unreadMsgIds.length > 0) {
                        emitMarkAsRead(unreadMsgIds, selectedContact._id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            } finally {
                if (!cancelled) setLoadingMsgs(false);
            }
        };

        fetchMessages();

        return () => {
            cancelled = true;
        };
    }, [selectedContact?._id, refreshTrigger]);

    // ── Set initial online status when contact changes using cached active users ──
    useEffect(() => {
        if (selectedContact?._id) {
            setContactOnlineStatus(
                activeUsersRef.current.includes(selectedContact._id) ? 'online' : 'offline'
            );
        } else {
            setContactOnlineStatus('offline');
        }
    }, [selectedContact?._id]);

    // ── WebSocket listeners for real-time updates ──────────
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleMessageReceived = async (newMessage) => {
            // Only add if it's for the current conversation
            const isFromSelectedContact = newMessage.senderId === selectedContact?._id;
            const isToSelectedContact = newMessage.receiverId === selectedContact?._id;
            if (isFromSelectedContact || isToSelectedContact) {
                let processedMsg = newMessage;
                // Decrypt E2EE messages
                if (newMessage.encryptionVersion === 'e2ee-v1' && newMessage.ciphertext && isCryptoReady()) {
                    if (isFromSelectedContact) {
                        try {
                            const plaintext = await decryptMessage(authUser._id, selectedContact._id, newMessage);
                            processedMsg = { ...newMessage, _decryptedText: plaintext, _isEncrypted: true };
                            if (!isE2EEActive) setIsE2EEActive(true);
                        } catch (err) {
                            console.error('[E2EE] Failed to decrypt received message:', err);
                            processedMsg = { ...newMessage, _decryptedText: '[Decryption failed]', _isEncrypted: true };
                        }
                    } else {
                        // Echo of our own sent message or something else we can't decrypt
                        processedMsg = { ...newMessage, _decryptedText: '[Sent Encrypted Message]', _isEncrypted: true };
                    }
                }
                setMessages(prev => {
                    // Avoid duplicates (in case REST already added it)
                    if (prev.some(m => m._id === processedMsg._id)) return prev;
                    return [...prev, processedMsg];
                });
                // If incoming, mark as read immediately since we're viewing this chat
                if (isFromSelectedContact && newMessage.status !== 'read') {
                    emitMarkAsRead([newMessage._id], selectedContact._id);
                }
            }
        };

        const handleMessageEdited = async (data) => {
            const isFromSelectedContact = data.senderId === selectedContact?._id;
            if (data.encryptionVersion === 'e2ee-v1' && data.ciphertext && isCryptoReady()) {
                if (isFromSelectedContact) {
                    try {
                        const plaintext = await decryptMessage(authUser._id, selectedContact._id, data);
                        setMessages(prev =>
                            prev.map(m =>
                                m._id === data.messageId
                                    ? { ...m, _decryptedText: plaintext, isEdited: true, _isEncrypted: true }
                                    : m
                            )
                        );
                    } catch (err) {
                        console.error('[E2EE] Failed to decrypt edited message:', err);
                    }
                } else {
                    // It's our own edit echo
                    setMessages(prev =>
                        prev.map(m =>
                            m._id === data.messageId
                                ? { ...m, _decryptedText: '[Sent Encrypted Message]', isEdited: true, _isEncrypted: true }
                                : m
                        )
                    );
                }
            } else {
                setMessages(prev =>
                    prev.map(m =>
                        m._id === data.messageId
                            ? { ...m, text: data.newText, isEdited: true }
                            : m
                    )
                );
            }
        };

        const handleMessageDeleted = (data) => {
            setMessages(prev => prev.filter(m => m._id !== data.messageId));
        };

        const handleTypingIndicator = (data) => {
            if (data.userId === selectedContact?._id) {
                setIsContactTyping(data.isTyping);
            }
        };

        const handleUserStatus = (data) => {
            // Update the ref so it stays current
            if (data.status === 'online') {
                if (!activeUsersRef.current.includes(data.userId)) {
                    activeUsersRef.current = [...activeUsersRef.current, data.userId];
                }
            } else {
                activeUsersRef.current = activeUsersRef.current.filter(id => id !== data.userId);
            }
            if (data.userId === selectedContact?._id) {
                setContactOnlineStatus(data.status);
            }
        };

        const handleMessagesRead = (data) => {
            setMessages(prev =>
                prev.map(m =>
                    data.messageIds.includes(m._id)
                        ? { ...m, status: 'read', readAt: data.readAt }
                        : m
                )
            );
        };

        const handleActiveUsers = (activeUserIds) => {
            // Always update the ref with the latest list
            activeUsersRef.current = activeUserIds;
            if (selectedContact?._id) {
                setContactOnlineStatus(
                    activeUserIds.includes(selectedContact._id) ? 'online' : 'offline'
                );
            }
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('typing_indicator', handleTypingIndicator);
        socket.on('user_status_update', handleUserStatus);
        socket.on('messages_read', handleMessagesRead);
        socket.on('active_users', handleActiveUsers);

        return () => {
            socket.off('message_received', handleMessageReceived);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('typing_indicator', handleTypingIndicator);
            socket.off('user_status_update', handleUserStatus);
            socket.off('messages_read', handleMessagesRead);
            socket.off('active_users', handleActiveUsers);
        };
    }, [selectedContact?._id, authUser?._id]);

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
        const displayText = msg._decryptedText || msg.text;
        return displayText?.toLowerCase().includes(searchQuery.toLowerCase());
    };

    const isDocumentUrl = (url) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.pdf') || lowerUrl.endsWith('.doc') || lowerUrl.endsWith('.docx') ||
            lowerUrl.endsWith('.zip') || lowerUrl.endsWith('.rar') || lowerUrl.includes('/raw/upload/');
    };

    const downloadAttachment = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Extract filename from URL or header
            let filename = `attachment_${Date.now()}`;
            if (url.includes('cloudinary.com')) {
                const parts = url.split('/');
                filename = parts[parts.length - 1] || filename;
            }

            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error('Download failed:', err);
            // Fallback to opening in new tab
            window.open(url, '_blank');
        }
    };

    const handleEditSubmit = async () => {
        if (!editMessageText.trim() || !editingMessageId) return;

        try {
            // Check if the message being edited is E2EE
            const originalMsg = messages.find(m => m._id === editingMessageId);
            const isE2EE = originalMsg?.encryptionVersion === 'e2ee-v1' || originalMsg?._isEncrypted;

            if (isE2EE && isCryptoReady()) {
                const encrypted = await encryptMessage(authUser._id, selectedContact._id, editMessageText);
                if (encrypted) {
                    const updatedMessage = await editMessage(editingMessageId, null, encrypted);
                    cacheDecryptedMessage(editingMessageId, editMessageText).catch(() => { });
                    setMessages(prev => prev.map(m => m._id === editingMessageId
                        ? { ...m, _decryptedText: editMessageText, isEdited: true }
                        : m
                    ));
                } else {
                    // Fallback to plaintext edit
                    const updatedMessage = await editMessage(editingMessageId, editMessageText);
                    setMessages(prev => prev.map(m => m._id === editingMessageId ? { ...m, ...updatedMessage.data } : m));
                }
            } else {
                const updatedMessage = await editMessage(editingMessageId, editMessageText);
                setMessages(prev => prev.map(m => m._id === editingMessageId ? { ...m, ...updatedMessage.data } : m));
            }
            setShowEditModal(false);
            setEditingMessageId(null);
            setEditMessageText('');
        } catch (error) {
            console.error("Error editing message:", error);
        }
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
        if (selectedMessages.length === 0) return;
        setShowDeleteModal(true);
    };

    const executeDelete = async (type) => {
        if (selectedMessages.length === 0) return;

        if (type === 'me') {
            for (const msgId of selectedMessages) {
                try {
                    await deleteForMe(msgId);
                } catch (err) { console.error('Failed to delete message:', err); }
            }
        } else if (type === 'everyone') {
            for (const msgId of selectedMessages) {
                try {
                    await deleteForEveryone(msgId);
                } catch (err) { console.error('Failed to delete for everyone:', err); }
            }
        }

        setMessages(prev => prev.filter(m => !selectedMessages.includes(m._id)));
        setShowDeleteModal(false);
        exitSelectMode();
    };

    const handleForwardSelected = () => {
        if (selectedMessages.length > 0) {
            setShowForwardModal(true);
        }
    };

    const handleForwardSubmit = async () => {
        if (forwardSelectedUsers.length === 0 || selectedMessages.length === 0) return;

        // Get the actual message objects that are selected
        const msgsToForward = messages.filter(m => selectedMessages.includes(m._id));

        // For each selected user, send each selected message sequentially
        for (const userId of forwardSelectedUsers) {
            for (const msg of msgsToForward) {
                const payload = {};
                if (msg.text || msg._decryptedText) payload.text = msg._decryptedText || msg.text;
                if (msg.image) payload.image = msg.image;

                // Only send if there's text or image
                if (msg.video) payload.video = msg.video; // Added video support for forwarding

                // Only send if there's text, image, or video
                if (Object.keys(payload).length > 0) {
                    try {
                        await sendMessage(userId, payload);
                    } catch (err) {
                        console.error('Failed to forward to', userId, err);
                    }
                }
            }
        }
        setShowForwardModal(false);
        exitSelectMode();
        alert('Messages forwarded successfully');
    };

    const handleCopySelected = () => {
        const selectedMsgs = messages.filter(m => selectedMessages.includes(m._id));
        const text = selectedMsgs.map(m => m._decryptedText || m.text).join('\n');
        navigator.clipboard.writeText(text);
        exitSelectMode();
    };

    const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDocumentSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > MAX_DOC_SIZE) {
            alert(`File too large (${formatFileSize(file.size)}). Max size is 25MB.`);
            e.target.value = '';
            return;
        }

        // Use a state to show "Processing..." if needed
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setSelectedImage(reader.result);
            if (file.type.startsWith('image/')) {
                setImagePreview(URL.createObjectURL(file));
                setAttachedFileType('image');
            } else if (file.type.startsWith('video/')) {
                setImagePreview(URL.createObjectURL(file));
                setAttachedFileType('video');
            } else {
                setImagePreview(null);
                setAttachedFileType('document');
            }
            setAttachedFileName(file.name);
            setAttachedFileSize(file.size);
        };
        e.target.value = '';
    };

    const clearImagePreview = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setAttachedFileName('');
        setAttachedFileType('image');
        setAttachedFileSize(0);
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    };

    const handleSendMessage = async () => {
        if ((!message.trim() && !selectedImage) || !selectedContact?._id) return;

        const text = message.trim();
        const imageToSend = selectedImage;
        const typeToSend = attachedFileType;
        const currentReplyTo = replyingTo;

        setMessage('');
        clearImagePreview();
        setReplyingTo(null);

        // Optimistic update
        const optimisticMsg = {
            _id: 'temp-' + Date.now(),
            senderId: authUser._id,
            receiverId: selectedContact._id,
            text: text || undefined,
            _decryptedText: text || undefined,
            image: imagePreview || undefined,
            replyTo: currentReplyTo || undefined,
            createdAt: new Date().toISOString(),
            _optimistic: true,
            _isEncrypted: isCryptoReady(),
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setTimeout(scrollToBottom, 50);

        if (imageToSend) setSendingImage(true);

        try {
            let payload = {};

            // Try E2EE encryption for text messages (images stay plaintext in Phase 1)
            if (text && !imageToSend && isCryptoReady()) {
                console.log(`[E2EE] Attempting to encrypt message to ${selectedContact._id}`);
                const encrypted = await encryptMessage(authUser._id, selectedContact._id, text);
                if (encrypted) {
                    console.log(`[E2EE] Message encrypted successfully`);
                    payload = {
                        ...encrypted,
                        messageType: 'text',
                    };
                    if (currentReplyTo) payload.replyTo = currentReplyTo._id;
                    if (!isE2EEActive) setIsE2EEActive(true);
                } else {
                    // Fallback to plaintext if encryption fails (no keys)
                    console.warn(`[E2EE] Encryption failed for ${selectedContact._id}, falling back to plaintext`);
                    if (text) payload.text = text;
                    if (currentReplyTo) payload.replyTo = currentReplyTo._id;
                }
            } else {
                // Plaintext path (images, or crypto not ready)
                if (text) payload.text = text;
                if (imageToSend) payload.image = imageToSend;
                if (imageToSend && attachedFileType === 'audio') payload.text = 'Voice';
                if (currentReplyTo) payload.replyTo = currentReplyTo._id;
            }

            const res = await sendMessage(selectedContact._id, payload);
            // Replace optimistic message with real one, preserving decrypted text
            const realMsg = res.data;
            if (realMsg.encryptionVersion === 'e2ee-v1') {
                realMsg._decryptedText = text;
                realMsg._isEncrypted = true;
                // Cache sent message plaintext so it survives chat switching
                if (realMsg._id && text) {
                    cacheDecryptedMessage(realMsg._id, text).catch(() => { });
                }
            }
            setMessages(prev =>
                prev.map(m => m._id === optimisticMsg._id ? realMsg : m)
            );
        } catch (err) {
            console.error('Failed to send message:', err);
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            if (text) setMessage(text);
            setReplyingTo(currentReplyTo);
        } finally {
            setSendingImage(false);
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
            <div className="canvas-panel flex flex-col flex-1 h-full mr-12 min-w-[840px] mb-2">
                <div className="pt-[60px] pb-0 pl-2 flex justify-between items-end mb-[-30px] relative z-20">
                    <h2 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '0.5px', fontFamily: 'var(--font-main)', lineHeight: 1 }}>Canvas</h2>
                </div>
                <div className="relative flex-1 rounded-[14px] border border-[var(--border)] overflow-hidden backdrop-blur-3xl bg-[var(--surface-panel)] shadow-[0_8px_32px_var(--shadow)]">
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <MessageSquare size={64} className="text-[rgba(var(--accent-rgb),0.2)]" />
                        <h3 className="text-[20px] font-light text-[var(--text-secondary)] font-sans">
                            Select a contact to start chatting
                        </h3>
                        <p className="text-[13px] text-[var(--text-tertiary)] max-w-[300px] text-center">
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
        <div className="canvas-panel flex flex-col flex-1 h-full mr-12 min-w-[840px] mb-2">
            <div className="pt-[60px] pb-0 pl-2 flex justify-between items-end mb-[-30px] relative z-20">
                <h2 style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '0.5px', fontFamily: 'var(--font-main)', lineHeight: 1 }}>Canvas</h2>
            </div>

            {/* Main Glass Panel */}
            <div className="relative flex-1 rounded-[14px] border border-[var(--border)] overflow-hidden backdrop-blur-3xl bg-[var(--surface-panel)] shadow-[0_8px_32px_var(--shadow)]">

                {/* subtle noise */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay chat-noise-bg" />

                {/* inner padding to match StreamPanel */}
                <div className="flex flex-col h-full">


                    {/* Contact header / Selection header */}
                    {selectMode ? (
                        /* Selection Header - WhatsApp style */
                        <div className="flex items-center justify-between mt-3 mx-8 mb-4 px- py-3 rounded-[12px] bg-[var(--surface-input)] border border-[var(--border)]">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={exitSelectMode}
                                    className="p-2 rounded-lg bg-transparent text-[var(--text-secondary)] cursor-pointer flex items-center justify-center hover:bg-[var(--surface-hover)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <span className="text-[16px] font-medium text-[var(--accent)]">
                                    {selectedMessages.length} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopySelected}
                                    disabled={selectedMessages.length === 0}
                                    className={`p-2.5 rounded-lg border-0 bg-transparent flex items-center justify-center transition-colors ${selectedMessages.length > 0
                                        ? 'text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--surface-hover)]'
                                        : 'text-[var(--text-tertiary)] cursor-not-allowed'
                                        }`}
                                    title="Copy"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={handleForwardSelected}
                                    disabled={selectedMessages.length === 0}
                                    className={`p-2.5 rounded-lg border-0 bg-transparent flex items-center justify-center transition-colors ${selectedMessages.length > 0
                                        ? 'text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--surface-hover)]'
                                        : 'text-[var(--text-tertiary)] cursor-not-allowed'
                                        }`}
                                    title="Forward"
                                >
                                    <Forward size={18} />
                                </button>
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedMessages.length === 0}
                                    className={`p-2.5 rounded-lg border-0 bg-transparent flex items-center justify-center transition-colors ${selectedMessages.length > 0
                                        ? 'text-red-500 cursor-pointer hover:bg-red-500/10'
                                        : 'text-(--text-tertiary) cursor-not-allowed'
                                        }`}
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Normal Contact header */
                        <div className="mobile-canvas-header flex items-center justify-between mt-4 pt-0 px-8">
                            <div className="">
                                <div className="flex items-center gap-2">
                                    <h2 style={{ fontSize: '36px', lineHeight: 1, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.025em', marginTop: '8px', fontFamily: 'var(--font-main)' }}>
                                        {selectedContact.fullName}
                                    </h2>
                                    <div className="mt-2">
                                        {e2eeStatus === 'active' && <Shield size={20} className="text-(--accent)" title="End-to-End Encrypted" />}
                                        {e2eeStatus === 'supported' && <Shield size={20} className="text-(--text-tertiary) opacity-50" title="E2EE Supported" />}
                                        {e2eeStatus === 'none' && <Lock size={20} className="text-(--status-danger) opacity-30" title="Encryption Not Supported" />}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-1 mb-0">
                                    <div className={`w-2.5 h-2.5 rounded-full ${contactOnlineStatus === 'online' ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.45)]' : 'bg-gray-500'}`} />
                                    <span className="text-[12px] text-gray-400/80">{contactOnlineStatus === 'online' ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 relative mt-[-60px]" ref={menuRef}>
                                <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" onClick={() => onStartCall?.('voice')}>
                                    <Phone size={18} strokeWidth={1.5} />
                                </button>
                                <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" onClick={() => onStartCall?.('video')}>
                                    <Video size={18} strokeWidth={1.5} />
                                </button>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    <MoreHorizontal size={18} strokeWidth={1.5} />
                                </button>

                                {/* Dropdown Menu */}
                                {showMenu && (
                                    <div
                                        className="absolute right-0 top-10 z-50 w-[180px] rounded-[12px] overflow-hidden bg-[var(--bg-base)] backdrop-blur-2xl border border-[var(--border)] shadow-[0_10px_40px_var(--shadow)] animate-[fadeSlideIn_0.15s_ease-out]"
                                    >
                                        <div className="p-1.5">
                                            <button
                                                onClick={() => handleMenuOption('search')}
                                                className="menu-item w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] border-0 bg-transparent text-[13px] text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                                            >
                                                <Search size={15} className="text-[var(--accent)] shrink-0" />
                                                <span>Search Messages</span>
                                            </button>
                                            <button
                                                onClick={() => handleMenuOption('select')}
                                                className="menu-item w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] border-0 bg-transparent text-[13px] text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                                            >
                                                <CheckSquare size={15} className="text-[var(--accent)] shrink-0" />
                                                <span>{selectMode ? 'Cancel Selection' : 'Select Message'}</span>
                                            </button>
                                            <button
                                                onClick={() => handleMenuOption('profile')}
                                                className="menu-item w-full flex items-center gap-[10px] px-3 py-2.5 rounded-[8px] border-0 bg-transparent text-[13px] text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-[var(--surface-hover)]"
                                            >
                                                <User size={15} className="text-[var(--accent-secondary)] shrink-0" />
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
                        <div className="flex items-center gap-3 mx-8 mb-3 px-4 py-2.5 rounded-[12px] bg-[var(--surface-input)] border border-[var(--border-accent)] shadow-[0_0_20px_var(--shadow-glow)] animate-[fadeSlideIn_0.2s_ease-out]">
                            <Search size={16} className="text-[var(--accent)] shrink-0" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search messages..."
                                className="flex-1 bg-transparent border-0 outline-none text-[var(--text-primary)] text-[14px] caret-[var(--accent)] font-sans"
                            />
                            {searchQuery && (
                                <div className="flex items-center gap-2 border-l border-[var(--border)] pl-2 pr-1">
                                    <span className="text-[12px] text-[var(--text-secondary)] whitespace-nowrap min-w-[40px] text-center">
                                        {matchingMessageIds.length > 0
                                            ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
                                            : '0 found'}
                                    </span>
                                    <div className="flex flex-col gap-0.5">
                                        <button
                                            onClick={prevMatch}
                                            disabled={matchingMessageIds.length === 0}
                                            className="p-0.5 rounded bg-[var(--surface)] border-0 text-[var(--text-primary)] cursor-pointer leading-none hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <ChevronUp size={12} />
                                        </button>
                                        <button
                                            onClick={nextMatch}
                                            disabled={matchingMessageIds.length === 0}
                                            className="p-0.5 rounded bg-[var(--surface)] border-0 text-[var(--text-primary)] cursor-pointer leading-none hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <ChevronDown size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={closeSearch}
                                className="p-1 rounded-md border-0 bg-transparent text-[var(--text-secondary)] cursor-pointer flex items-center justify-center shrink-0 hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Messages scroll area */}
                    <div
                        ref={messagesContainerRef}
                        className="relative flex-1 max-h-[calc(100%_-_200px)] overflow-y-auto overflow-x-hidden pr-6 scrollbar-thin scrollbar-thumb-transparent"
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
                            <div className="flex justify-center py-[20px]">
                                <div className="w-8 h-8 rounded-full border-[3px] border-[var(--border-accent)] border-t-[var(--accent)] animate-[chatSpin_0.8s_linear_infinite]" />
                            </div>
                        ) : processedMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-[20px] gap-2">
                                <MessageSquare size={32} className="text-[var(--text-tertiary)]" />
                                <span className="text-[var(--text-tertiary)] text-[14px]">No messages yet. Say hello!</span>
                            </div>
                        ) : (
                            <div className="relative z-10 pb-4 px-8 mt-1">
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

                                    const marginTop = isFirstInGroup ? 'mt-2' : 'mt-0';

                                    const isSelected = selectedMessages.includes(msg._id);
                                    const prevSelected = prevMsg && selectedMessages.includes(prevMsg._id);
                                    const nextSelected = nextMsg && selectedMessages.includes(nextMsg._id);

                                    const getSelectionRadiusClass = () => {
                                        if (!isSelected) return '';
                                        if (prevSelected && nextSelected) return 'rounded-none';
                                        if (prevSelected && !nextSelected) return 'rounded-[0_0_8px_8px]';
                                        if (!prevSelected && nextSelected) return 'rounded-[8px_8px_0_0]';
                                        return 'rounded-[8px]';
                                    };

                                    const isSearchMatch = matchingMessageIds.includes(msg._id);
                                    const isCurrentMatch = isSearchMatch && matchingMessageIds[currentMatchIndex] === msg._id;

                                    if (msg.type === 'received') {
                                        return (
                                            <div
                                                key={msg._id}
                                                id={`msg-${msg._id}`}
                                                className={[
                                                    'flex items-center gap-3 transition-all duration-150 ease-out',
                                                    marginTop,
                                                    selectMode ? 'cursor-pointer' : '',
                                                    '-mx-4 px-4',
                                                    isSelected ? 'bg-[var(--surface-selected)]' : 'bg-transparent',
                                                    isSelected ? (prevSelected ? 'pt-1' : 'pt-2') : 'pt-0',
                                                    isSelected ? (nextSelected ? 'pb-1' : 'pb-2') : 'pb-0',
                                                    getSelectionRadiusClass(),
                                                ].filter(Boolean).join(' ')}
                                                onClick={() => toggleMessageSelection(msg._id)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setContextMenu({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        type: 'message',
                                                        msgId: msg._id,
                                                        msgText: msg._decryptedText || msg.text,
                                                        msgSenderId: msg.senderId,
                                                        fullMsg: msg
                                                    });
                                                }}
                                            >
                                                {/* Selection checkbox */}
                                                {selectMode && (
                                                    <div className={[
                                                        'w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ease-out',
                                                        isSelected ? 'bg-[var(--accent)] border-0' : 'bg-transparent border-2 border-[var(--border-hover)]',
                                                    ].join(' ')}>
                                                        {isSelected && <Check size={14} className="text-black" />}
                                                    </div>
                                                )}
                                                <div className={[
                                                    'flex items-stretch gap-6 max-w-[70%] rounded-[12px] transition-all duration-300',
                                                    'ease-[cubic-bezier(0.4,0,0.2,1)] origin-left',
                                                    searchMode && searchQuery && !isSearchMatch ? 'opacity-30' : 'opacity-100',
                                                    isCurrentMatch ? 'scale-[1.02] shadow-[0_0_20px_var(--shadow-glow)]' : 'scale-100 shadow-none',
                                                ].filter(Boolean).join(' ')}>
                                                    <div className={`w-[4px] ${barRounding} bg-[var(--accent-secondary)] shadow-[0_0_12px_rgba(var(--accent-secondary-rgb),0.18)]`} />
                                                    <div className="flex flex-col gap-0.5 py-[2px]">
                                                        {showTimestamp && <div className="text-[12px] text-[var(--text-secondary)] mb-0.5">{formatTime(msg.createdAt)}</div>}
                                                        {msg.replyTo && (
                                                            <div
                                                                className="flex items-stretch gap-2 mb-1.5 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors max-w-[400px]"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const replyId = msg.replyTo._id || msg.replyTo;
                                                                    const el = document.getElementById(`msg-${replyId}`);
                                                                    const container = messagesContainerRef.current;
                                                                    if (el && container) {
                                                                        const elementTop = el.offsetTop - container.offsetTop;
                                                                        const containerHeight = container.clientHeight;
                                                                        container.scrollTo({ top: elementTop - containerHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
                                                                        el.style.transition = 'background 0.3s';
                                                                        el.style.background = 'var(--surface-selected)';
                                                                        setTimeout(() => { el.style.background = 'transparent'; }, 1500);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="w-[3px] rounded-full bg-purple-400/60 shrink-0" />
                                                                <div className="flex flex-col gap-0.5 min-w-0">
                                                                    <span className="text-[11px] font-semibold text-[var(--accent-secondary)]/80">
                                                                        {msg.replyTo.senderId === authUser._id ? 'You' : selectedContact?.fullName}
                                                                    </span>
                                                                    <span className="text-[12px] text-[var(--text-tertiary)] truncate">
                                                                        {msg.replyTo.text || (msg.replyTo.image ? '📎 Media' : 'Message')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(msg._decryptedText || msg.text)?.toLowerCase() !== 'voice' && (
                                                            <div className="text-[15px] leading-snug text-white/85 max-w-[720px]">{msg._decryptedText || msg.text}</div>
                                                        )}
                                                        {msg.image && (
                                                            isDocumentUrl(msg.image) ? (
                                                                <div
                                                                    className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors w-[260px] cursor-pointer group"
                                                                    onClick={() => downloadAttachment(msg.image)}
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex shrink-0 items-center justify-center">
                                                                        <FileIcon size={20} className="text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 flex items-center">
                                                                        <div className="text-[14px] font-medium text-[var(--text-primary)] truncate">Document</div>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex shrink-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Download size={14} className="text-[var(--text-secondary)]" />
                                                                    </div>
                                                                </div>
                                                            ) : (msg.image.toLowerCase().includes('.mp3') || msg.image.toLowerCase().includes('.wav') || msg.image.toLowerCase().includes('.ogg') || msg.image.toLowerCase().includes('.m4a') || msg.image.toLowerCase().includes('audio/') || (msg.image.toLowerCase().includes('base64') && msg.image.toLowerCase().startsWith('data:audio')) || (msg._decryptedText || msg.text)?.toLowerCase().includes('voice')) ? (
                                                                <CustomAudioPlayer src={msg.image} />
                                                            ) : (msg.image.toLowerCase().includes('.mp4') || msg.image.toLowerCase().includes('.mov') || msg.image.toLowerCase().includes('.webm') || msg.image.toLowerCase().includes('/video/upload/')) ? (
                                                                <CustomVideoPlayer src={msg.image} />
                                                            ) : (
                                                                <div className="relative group cursor-pointer mt-2 max-w-[300px]">
                                                                    <img
                                                                        src={msg.image}
                                                                        alt="attachment"
                                                                        onClick={() => setLightboxImage(msg.image)}
                                                                        className="w-full max-h-[280px] rounded-[10px] object-cover border border-[var(--border)] transition-transform duration-200 hover:scale-[1.02]"
                                                                    />
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); downloadAttachment(msg.image); }}
                                                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 border border-[var(--border-hover)]"
                                                                    >
                                                                        <Download size={14} className="text-[var(--text-primary)]" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                        {msg.isEdited && <span className="text-[10px] text-[var(--text-tertiary)] italic">edited</span>}
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
                                                className={[
                                                    'flex items-center justify-end gap-3 transition-all duration-150 ease-out',
                                                    marginTop,
                                                    selectMode ? 'cursor-pointer' : '',
                                                    '-mx-4 px-4',
                                                    isSelected ? 'bg-[var(--surface-selected)]' : 'bg-transparent',
                                                    isSelected ? (prevSelected ? 'pt-1' : 'pt-2') : 'pt-0',
                                                    isSelected ? (nextSelected ? 'pb-1' : 'pb-2') : 'pb-0',
                                                    getSelectionRadiusClass(),
                                                    msg._optimistic ? 'opacity-60' : 'opacity-100',
                                                ].filter(Boolean).join(' ')}
                                                onClick={() => toggleMessageSelection(msg._id)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setContextMenu({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        type: 'message',
                                                        msgId: msg._id,
                                                        msgText: msg._decryptedText || msg.text,
                                                        msgSenderId: msg.senderId,
                                                        fullMsg: msg
                                                    });
                                                }}
                                            >
                                                <div className={[
                                                    'flex items-stretch gap-6 max-w-[70%] rounded-[12px] transition-all duration-300',
                                                    'ease-[cubic-bezier(0.4,0,0.2,1)] origin-right',
                                                    searchMode && searchQuery && !isSearchMatch ? 'opacity-30' : 'opacity-100',
                                                    isCurrentMatch ? 'scale-[1.02] shadow-[0_0_20px_var(--shadow-glow)]' : 'scale-100 shadow-none',
                                                ].filter(Boolean).join(' ')}>
                                                    <div className="flex flex-col gap-0.5 items-end py-[2px]">
                                                        {showTimestamp && <div className="text-[12px] text-[var(--text-secondary)] mb-0.5">{formatTime(msg.createdAt)}</div>}
                                                        {msg.replyTo && (
                                                            <div
                                                                className="flex items-stretch gap-2 mb-1.5 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors max-w-[400px] self-end"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const replyId = msg.replyTo._id || msg.replyTo;
                                                                    const el = document.getElementById(`msg-${replyId}`);
                                                                    const container = messagesContainerRef.current;
                                                                    if (el && container) {
                                                                        const elementTop = el.offsetTop - container.offsetTop;
                                                                        const containerHeight = container.clientHeight;
                                                                        container.scrollTo({ top: elementTop - containerHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
                                                                        el.style.transition = 'background 0.3s';
                                                                        el.style.background = 'var(--surface-selected)';
                                                                        setTimeout(() => { el.style.background = 'transparent'; }, 1500);
                                                                    }
                                                                }}
                                                            >
                                                                <div className="w-[3px] rounded-full bg-[var(--accent)]/60 shrink-0" />
                                                                <div className="flex flex-col gap-0.5 min-w-0 items-end">
                                                                    <span className="text-[11px] font-semibold text-[var(--accent)]">
                                                                        {msg.replyTo.senderId === authUser._id ? 'You' : selectedContact?.fullName}
                                                                    </span>
                                                                    <span className="text-[12px] text-[var(--text-tertiary)] truncate max-w-[300px]">
                                                                        {msg.replyTo.text || (msg.replyTo.image ? '📎 Media' : 'Message')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(msg._decryptedText || msg.text)?.toLowerCase() !== 'voice' && (
                                                            <div className="text-[15px] leading-snug text-white/85 text-right">{msg._decryptedText || msg.text}</div>
                                                        )}
                                                        {msg.image && (
                                                            isDocumentUrl(msg.image) ? (
                                                                <div
                                                                    className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors w-[260px] cursor-pointer group"
                                                                    onClick={() => downloadAttachment(msg.image)}
                                                                >
                                                                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex shrink-0 items-center justify-center">
                                                                        <FileIcon size={20} className="text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 flex items-center">
                                                                        <div className="text-[14px] font-medium text-[var(--text-primary)] truncate">Document</div>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex shrink-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Download size={14} className="text-[var(--text-secondary)]" />
                                                                    </div>
                                                                </div>
                                                            ) : (msg.image.toLowerCase().includes('.mp3') || msg.image.toLowerCase().includes('.wav') || msg.image.toLowerCase().includes('.ogg') || msg.image.toLowerCase().includes('.m4a') || msg.image.toLowerCase().includes('audio/') || (msg.image.toLowerCase().includes('base64') && msg.image.toLowerCase().startsWith('data:audio')) || (msg._decryptedText || msg.text) === 'Voice') ? (
                                                                <CustomAudioPlayer src={msg.image} />
                                                            ) : (msg.image.toLowerCase().includes('/video/upload/') || msg.image.toLowerCase().includes('.mp4') || msg.image.toLowerCase().includes('.mov') || msg.image.toLowerCase().includes('.webm')) ? (
                                                                <CustomVideoPlayer src={msg.image} />
                                                            ) : (
                                                                <div className="relative group cursor-pointer mt-2 max-w-[300px]">
                                                                    <img
                                                                        src={msg.image}
                                                                        alt="attachment"
                                                                        onClick={() => setLightboxImage(msg.image)}
                                                                        className="w-full max-h-[280px] rounded-[10px] object-cover border border-[var(--border)] transition-transform duration-200 hover:scale-[1.02]"
                                                                    />
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); downloadAttachment(msg.image); }}
                                                                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 border border-[var(--border-hover)]"
                                                                    >
                                                                        <Download size={14} className="text-[var(--text-primary)]" />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                        {msg.isEdited && <span className="text-[10px] text-[var(--text-tertiary)] italic">edited</span>}
                                                    </div>
                                                    <div className={`w-[4px] ${barRounding} ${msg.status === 'read' ? 'bg-[var(--accent)] shadow-[0_0_12px_var(--shadow-glow)]' : 'bg-[var(--text-tertiary)] shadow-none'}`} />
                                                </div>
                                                {/* Selection checkbox */}
                                                {selectMode && (
                                                    <div className={[
                                                        'w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ease-out',
                                                        isSelected ? 'bg-[var(--accent)] border-0' : 'bg-transparent border-2 border-[var(--border-hover)]',
                                                    ].join(' ')}>
                                                        {isSelected && <Check size={14} className="text-black" />}
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

                    {/* Typing indicator */}
                    {isContactTyping && (
                        <div className="flex items-center gap-2 px-8 py-2">
                            <div className="flex gap-1 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0s] [animation-duration:0.6s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.15s] [animation-duration:0.6s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0.3s] [animation-duration:0.6s]" />
                            </div>
                            <span className="text-[12px] text-[var(--accent)] italic">{selectedContact.fullName} is typing...</span>
                        </div>
                    )}

                    {/* Bottom centered input */}
                    {/* Hidden file input */}
                    <input
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleDocumentSelect}
                    />

                    <div className="flex flex-col justify-center mt-auto pt-4 pb-5 w-[86%] max-w-[820px] self-center">
                        {/* Reply preview banner */}
                        {replyingTo && (
                            <div className="flex items-stretch gap-3 px-[18px] py-3 mb-2.5 rounded-[14px] bg-[var(--surface-input)] border border-[var(--border)] backdrop-blur-2xl shadow-[0_8px_32px_var(--shadow)] animate-[slideUp_0.15s_ease-out]">
                                <div className={`w-[4px] rounded-full shrink-0 ${replyingTo.senderId === authUser._id ? 'bg-[var(--accent)]' : 'bg-[var(--accent-secondary)]'}`} />
                                <div className="flex-1 min-w-0">
                                    <div className={`text-[12px] font-semibold mb-0.5 ${replyingTo.senderId === authUser._id ? 'text-[var(--accent)]' : 'text-[var(--accent-secondary)]'}`}>
                                        {replyingTo.senderId === authUser._id ? 'You' : selectedContact?.fullName}
                                    </div>
                                    <div className="text-[13px] text-[var(--text-secondary)] truncate">
                                        {replyingTo.text || (replyingTo.image ? '📎 Media' : 'Message')}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setReplyingTo(null)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] text-[var(--text-tertiary)] hover:bg-red-500/20 hover:text-red-400 transition-all self-center"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        {/* Attachment preview bar */}
                        {selectedImage && (
                            <div className="flex items-center gap-3 px-[18px] py-3 mb-2.5 rounded-[14px] bg-[var(--surface-input)] border border-[var(--border)] backdrop-blur-2xl shadow-[0_8px_32px_var(--shadow)]">
                                {attachedFileType === 'image' && imagePreview ? (
                                    <img src={imagePreview} alt="preview" className="w-[44px] h-[44px] rounded-lg object-cover border border-[var(--border-hover)]" />
                                ) : attachedFileType === 'video' && imagePreview ? (
                                    <div className="relative">
                                        <video src={imagePreview} className="w-[44px] h-[44px] rounded-lg object-cover border border-[var(--border-hover)]" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                                            <Video size={14} className="text-[var(--text-primary)]" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-[44px] h-[44px] rounded-lg bg-blue-400/15 border border-blue-400/30 flex items-center justify-center">
                                        <FileIcon size={20} className="text-blue-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-[13px] text-[var(--text-primary)] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        {attachedFileType === 'image' ? 'Image attached' : attachedFileType === 'video' ? 'Video attached' : attachedFileName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {sendingImage && (
                                            <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                        )}
                                        <span className="text-[11px] text-[var(--text-tertiary)]">
                                            {sendingImage ? 'Processing & Uploading...' : `${formatFileSize(attachedFileSize)} • Ready to send`}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={clearImagePreview}
                                    className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] text-[var(--text-tertiary)] hover:bg-red-500/20 hover:text-red-400 transition-all"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        <div
                            className="w-full h-[60px] bg-[var(--surface-input)] backdrop-blur-2xl border border-[var(--border)] shadow-2xl flex items-center relative rounded-[16px] pl-2 pr-[10px]"
                        >
                            {isRecording ? (
                                /* Recording UI */
                                <div className="flex-1 flex items-center justify-between px-4 h-full">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setIsRecording(false)}
                                            className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                                            title="Cancel Recording"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[chatPulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                                            <span className="text-red-400 text-[15px] font-medium tracking-wide">
                                                {formatRecordingTime ? formatRecordingTime(recordingTime) : `${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsRecording(false)}
                                            className="w-[40px] h-[40px] rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center shrink-0 border border-red-500/20"
                                        >
                                            <StopIcon size={18} fill="currentColor" />
                                        </button>
                                        {/* Send button removed here because stopRecording sets the selectedImage and we send from there */}
                                    </div>
                                </div>
                            ) : (
                                /* Normal Input UI */
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-[44px] h-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent)] hover:bg-[rgba(var(--accent-rgb),0.1)] rounded-xl transition-all shrink-0 ml-1"
                                        title="Attach file"
                                    >
                                        <Paperclip size={22} strokeWidth={1.5} />
                                    </button>

                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => {
                                            setMessage(e.target.value);
                                            // Emit typing indicator
                                            if (e.target.value.length > 0 && selectedContact) {
                                                emitTyping(selectedContact._id);
                                                clearTimeout(typingTimeoutRef.current);
                                                typingTimeoutRef.current = setTimeout(() => {
                                                    emitStoppedTyping(selectedContact._id);
                                                }, 900);
                                            } else if (selectedContact) {
                                                emitStoppedTyping(selectedContact._id);
                                            }
                                        }}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent text-[var(--text-primary)] text-[15px] placeholder-[var(--text-tertiary)] outline-none px-3 h-full"
                                    />

                                    <div className="flex items-center gap-2">
                                        {!message.trim() && !selectedImage && (
                                            <button
                                                onClick={() => setIsRecording(true)}
                                                className="w-[44px] h-[44px] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] rounded-xl transition-all shrink-0"
                                            >
                                                <Mic size={22} strokeWidth={1.5} />
                                            </button>
                                        )}
                                        {(message.trim() || selectedImage) && (
                                            <button
                                                onClick={handleSendMessage}
                                                className={`w-[44px] h-[44px] rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)] text-[var(--text-on-accent)] transition-all flex items-center justify-center shrink-0 shadow-[0_0_15px_var(--shadow-glow)] transform hover:scale-105 active:scale-95`}
                                                aria-label="Send"
                                            >
                                                <SendHorizontal size={20} strokeWidth={2} />
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
            {
                showProfile && (
                    <>
                        {/* Backdrop */}
                        <div
                            onClick={() => setShowProfile(false)}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[4px] animate-[fadeIn_0.2s_ease-out]"
                        />

                        {/* Profile Panel */}
                        <div
                            className="fixed right-0 top-0 h-full z-50 w-[360px] bg-[var(--bg-base)] backdrop-blur-2xl border-l border-[var(--border)] shadow-[-10px_0_50px_var(--shadow)] animate-[slideInRight_0.25s_ease-out]"
                        >
                            <div className="h-full flex flex-col px-6 py-5">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <button
                                        onClick={() => setShowProfile(false)}
                                        className="p-2 rounded-lg border-0 bg-transparent text-[var(--text-secondary)] cursor-pointer flex items-center justify-center hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <span className="text-[16px] font-medium text-[var(--text-primary)]">
                                        Profile
                                    </span>
                                    <button
                                        onClick={() => setShowProfile(false)}
                                        className="p-2 rounded-lg border-0 bg-transparent text-[var(--text-secondary)] cursor-pointer flex items-center justify-center hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Avatar Section */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative mb-4">
                                        <div
                                            className="w-[90px] h-[90px] rounded-full p-[3px] cursor-pointer transition-transform hover:scale-105"
                                            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-secondary))', boxShadow: '0 0 25px var(--shadow-glow)' }}
                                            onClick={() => selectedContact.profilePic && setLightboxImage(selectedContact.profilePic)}
                                        >
                                            <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--surface-input)' }}>
                                                {selectedContact.profilePic ? (
                                                    <img src={selectedContact.profilePic} alt={selectedContact.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={36} className="text-[var(--text-secondary)]" />
                                                )}
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-[2px] right-[2px] w-[18px] h-[18px] rounded-full border-[3px] border-[var(--bg-base)] ${contactOnlineStatus === 'online' ? 'bg-[var(--status-online)] shadow-[0_0_8px_var(--status-online-shadow)]' : 'bg-[var(--text-tertiary)]'}`} />
                                    </div>
                                    <h2 className="text-[22px] font-normal mb-1.5 text-center" style={{ color: 'var(--text-primary)' }}>
                                        {selectedContact.fullName}
                                    </h2>
                                    <div className={`flex items-center gap-1.5 text-[12px] ${contactOnlineStatus === 'online' ? 'text-[var(--status-online)]' : 'text-[var(--text-tertiary)]'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${contactOnlineStatus === 'online' ? 'bg-[var(--status-online)]' : 'bg-[var(--text-tertiary)]'}`} />
                                        {contactOnlineStatus === 'online' ? 'Online' : 'Offline'}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[linear-gradient(to_right,transparent,var(--border),transparent)] mb-5" />

                                {/* Profile Details */}
                                <div className="flex flex-col gap-3 flex-1 overflow-auto">
                                    {/* About / Bio */}
                                    <div
                                        className="px-4 py-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] transition-all"
                                    >
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <Info size={14} className="text-[var(--accent-secondary)]" />
                                            <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">About</span>
                                        </div>
                                        <p className="text-[13px] text-[var(--text-primary)] ml-6 leading-relaxed">{selectedContact.about || 'No bio available'}</p>
                                    </div>

                                    {/* Email */}
                                    <div
                                        className="px-4 py-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] cursor-pointer transition-all hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]"
                                    >
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <Mail size={14} className="text-[var(--accent)]" />
                                            <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">Email</span>
                                        </div>
                                        <p className="text-[13px] text-[var(--text-primary)] ml-6">{selectedContact.email}</p>
                                    </div>

                                    {/* Member Since */}
                                    <div
                                        className="px-4 py-3.5 rounded-[12px] bg-[var(--surface)] border border-[var(--border)] cursor-pointer transition-all hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)]"
                                    >
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <User size={14} className="text-[var(--accent-secondary)]" />
                                            <span className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-secondary)]">Member Since</span>
                                        </div>
                                        <p className="text-[13px] text-[var(--text-primary)] ml-6">
                                            {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
                                        </p>
                                    </div>
                                </div>

                                {/* Bottom Actions */}
                                <div className="flex flex-col gap-2.5 mt-5">
                                    <button
                                        onClick={() => setShowProfile(false)}
                                        className="w-full py-3 rounded-[10px] border border-[var(--border-accent-strong)] bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent)] text-[13px] font-medium cursor-pointer transition-colors hover:bg-[rgba(var(--accent-rgb),0.2)]"
                                    >
                                        Send Message
                                    </button>
                                    <button
                                        className="w-full py-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] text-[13px] cursor-pointer transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]/80"
                                    >
                                        Block User
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Context Menu */}
            {
                contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        items={
                            contextMenu.type === 'message'
                                ? [
                                    { label: 'Reply', icon: <Reply size={16} />, onClick: () => { setReplyingTo(contextMenu.fullMsg); } },
                                    { label: 'Copy', icon: <Copy size={16} />, onClick: () => navigator.clipboard.writeText(contextMenu.msgText) },
                                    {
                                        label: 'Forward', icon: <Forward size={16} />, onClick: () => {
                                            setSelectedMessages([contextMenu.msgId]);
                                            setShowForwardModal(true);
                                        }
                                    },
                                    {
                                        label: 'Select', icon: <CheckSquare size={16} />, onClick: () => {
                                            setSelectMode(true);
                                            setSelectedMessages(prev => prev.includes(contextMenu.msgId) ? prev : [...prev, contextMenu.msgId]);
                                        }
                                    },
                                    {
                                        label: 'View Info', icon: <Info size={16} />, onClick: () => {
                                            setSelectedInfoMessage(contextMenu.fullMsg);
                                            setShowInfoModal(true);
                                        }
                                    },
                                    ...(contextMenu.msgSenderId === authUser._id ? [{
                                        label: 'Edit', icon: <MessageSquare size={16} />, onClick: () => {
                                            setEditingMessageId(contextMenu.msgId);
                                            setEditMessageText(contextMenu.msgText);
                                            setShowEditModal(true);
                                        }
                                    }] : []),
                                    { divider: true },
                                    {
                                        label: 'Delete for Me', icon: <Trash2 size={16} />, color: 'var(--status-danger)', onClick: async () => {
                                            try {
                                                await deleteForMe(contextMenu.msgId);
                                                setMessages(prev => prev.filter(m => m._id !== contextMenu.msgId));
                                            } catch (err) { console.error(err); }
                                        }
                                    },
                                    ...(contextMenu.msgSenderId === authUser._id ? [{
                                        label: 'Delete for Everyone', icon: <Trash2 size={16} />, color: 'var(--status-danger)', onClick: async () => {
                                            try {
                                                await deleteForEveryone(contextMenu.msgId);
                                                setMessages(prev => prev.filter(m => m._id !== contextMenu.msgId));
                                            } catch (err) { console.error(err); }
                                        }
                                    }] : []),
                                ]
                                : [
                                    { label: 'Search Messages', icon: <Search size={16} />, onClick: () => { setSearchMode(true); } },
                                    { divider: true },
                                    {
                                        label: 'Select Messages', icon: <CheckSquare size={16} />, onClick: () => {
                                            setSelectMode(true);
                                            setSelectedMessages([]);
                                        }
                                    },
                                    { divider: true },
                                    { label: 'Clear Chat', icon: <Trash2 size={16} />, color: 'var(--status-danger)', onClick: () => { } },
                                    { divider: true },
                                    {
                                        label: 'Reset E2EE Session',
                                        icon: <Shield size={16} />,
                                        color: 'var(--accent-secondary)',
                                        onClick: () => {
                                            if (window.confirm("Reset E2EE session for this contact? This can help fix decryption issues by forcing a fresh key agreement.")) {
                                                isE2EESupported(selectedContact._id).then(supported => {
                                                    if (!supported) {
                                                        alert("Cannot reset E2EE: This partner hasn't registered security keys yet. They need to log in to enable encryption.");
                                                        return;
                                                    }
                                                    resetSession(selectedContact._id).then(() => {
                                                        setRefreshTrigger(prev => prev + 1);
                                                    });
                                                });
                                            }
                                        }
                                    },
                                ]
                        }
                    />
                )
            }

            {/* Message Info Modal */}
            {showInfoModal && selectedInfoMessage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setShowInfoModal(false)}
                >
                    <div
                        className="w-full max-w-[400px] bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center border border-[rgba(var(--accent-rgb),0.2)]">
                                    <Info size={20} className="text-[var(--accent)]" />
                                </div>
                                <h3 className="text-[18px] font-bold text-[var(--text-primary)]">Message Info</h3>
                            </div>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Sent At */}
                            <div>
                                <label className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] font-semibold mb-2 block">Sent At</label>
                                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                    <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                                        <Phone size={14} className="text-blue-400 rotate-90" /> {/* Just a clock-like icon if Clock is not imported */}
                                    </div>
                                    <span className="text-[14px]">
                                        {new Date(selectedInfoMessage.createdAt).toLocaleString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Seen At */}
                            <div>
                                <label className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] font-semibold mb-2 block">Seen At</label>
                                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                    <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                                        <Check size={14} className="text-[var(--status-online)]" />
                                    </div>
                                    <span className="text-[14px]">
                                        {selectedInfoMessage.status === 'read' && selectedInfoMessage.readAt ? new Date(selectedInfoMessage.readAt).toLocaleString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        }) : 'Not seen yet'}
                                    </span>
                                </div>
                            </div>

                            {/* Message Type */}
                            <div>
                                <label className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] font-semibold mb-2 block">Message Type</label>
                                <div className="flex items-center gap-3 text-[var(--text-primary)]">
                                    <div className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                                        <MessageSquare size={14} className="text-[var(--accent-secondary)]" />
                                    </div>
                                    <span className="text-[14px] capitalize">
                                        {selectedInfoMessage.image ? (
                                            isDocumentUrl(selectedInfoMessage.image) ? 'Document' :
                                                (selectedInfoMessage.image.toLowerCase().includes('.mp3') || selectedInfoMessage.image.toLowerCase().includes('audio') || selectedInfoMessage.text === 'Voice') ? 'Voice Note' :
                                                    (selectedInfoMessage.image.toLowerCase().includes('.mp4') || selectedInfoMessage.image.toLowerCase().includes('video')) ? 'Video' : 'Image'
                                        ) : 'Text Message'}
                                    </span>
                                </div>
                            </div>

                            {/* Additional Details for Attachments */}
                            {selectedInfoMessage.image && (
                                <div className="pt-4 border-t border-[var(--border)]">
                                    <label className="text-[11px] uppercase tracking-[0.05em] text-[var(--text-tertiary)] font-semibold mb-2 block">Attachment Details</label>
                                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
                                        <div className="flex justify-between text-[13px]">
                                            <span className="text-[var(--text-tertiary)]">Source</span>
                                            <span className="text-[var(--accent)] font-mono truncate max-w-[200px]">Cloudinary</span>
                                        </div>
                                        <div className="flex justify-between text-[13px]">
                                            <span className="text-[var(--text-tertiary)]">Status</span>
                                            <span className="text-[var(--status-online)] flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-online)]" />
                                                Uploaded
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-[var(--surface)] border-t border-[var(--border)] flex justify-end">
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="px-5 py-2 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-[13px] font-semibold rounded-lg transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Large Modals Cleanup */}
            {
                showForwardModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowForwardModal(false)}
                    >
                        <div
                            className="w-full max-w-[440px] max-h-[85vh] flex flex-col bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="shrink-0 px-6 py-5 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center">
                                        <Forward size={24} className="text-[var(--accent)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-[17px] font-semibold text-[var(--text-primary)]">Forward Message</h3>
                                        <p className="text-[12px] text-[var(--text-tertiary)]">{selectedMessages.length} item{selectedMessages.length > 1 ? 's' : ''} selected</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowForwardModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search Box */}
                            <div className="shrink-0 px-6 py-5 bg-[var(--surface)]">
                                <div className="relative group">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent)] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search contacts..."
                                        value={forwardSearch}
                                        onChange={(e) => setForwardSearch(e.target.value)}
                                        className="w-full h-11 bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-12 pr-4 text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-accent)] focus:bg-[var(--surface-hover)] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Contacts List */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0 space-y-1">
                                {forwardContacts
                                    .filter(c => c.fullName.toLowerCase().includes(forwardSearch.toLowerCase()))
                                    .map(contact => {
                                        const isSelected = forwardSelectedUsers.includes(contact._id);
                                        return (
                                            <div
                                                key={contact._id}
                                                onClick={() => {
                                                    setForwardSelectedUsers(prev =>
                                                        isSelected ? prev.filter(id => id !== contact._id) : [...prev, contact._id]
                                                    );
                                                }}
                                                className={`group flex items-center gap-4 py-2.5 px-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.2)]' : 'hover:bg-[var(--surface)] border border-transparent'}`}
                                            >
                                                <div className="relative">
                                                    {contact.profilePic ? (
                                                        <img src={contact.profilePic} alt="" className="w-11 h-11 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-11 h-11 rounded-lg bg-[var(--surface)] flex items-center justify-center text-[var(--text-tertiary)] font-medium">
                                                            {getInitials(contact.fullName)}
                                                        </div>
                                                    )}
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-base)] flex items-center justify-center shadow-lg">
                                                            <Check size={12} className="text-[var(--text-on-accent)] stroke-[3]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-[14px] font-medium truncate ${isSelected ? 'text-[var(--text-on-accent)]' : 'text-[var(--text-primary)]'}`}>{contact.fullName}</h4>
                                                    <p className="text-[12px] text-[var(--text-tertiary)] truncate">{contact.email}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>

                            {/* Multi-Forward Footer */}
                            <div className="shrink-0 px-6 py-5 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between">
                                <span className="text-[14px] text-[var(--text-tertiary)] font-medium whitespace-nowrap">
                                    {forwardSelectedUsers.length} selected
                                </span>
                                <button
                                    onClick={handleForwardSubmit}
                                    disabled={forwardSelectedUsers.length === 0}
                                    className="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent)] disabled:bg-[var(--surface)] disabled:text-[var(--text-tertiary)] text-[var(--text-on-accent)] font-semibold rounded-xl text-[14px] transition-all flex items-center gap-2 shadow-lg shadow-[var(--shadow-glow)] active:scale-95 whitespace-nowrap"
                                >
                                    <Forward size={18} />
                                    Forward Now
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Modal */}
            {
                showDeleteModal && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <div
                            className="w-full max-w-[400px] bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">Delete Messages?</h3>
                            <p className="text-[14px] text-[var(--text-tertiary)] mb-8 max-w-[280px]">
                                This action cannot be undone. Are you sure you want to delete {selectedMessages.length} message{selectedMessages.length > 1 ? 's' : ''}?
                            </p>

                            <div className="w-full space-y-3">
                                {selectedMessages.every(id => messages.find(m => m._id === id)?.senderId === authUser._id) && (
                                    <button
                                        onClick={() => executeDelete('everyone')}
                                        className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-[var(--text-primary)] font-semibold rounded-xl text-[14px] transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Delete for Everyone
                                    </button>
                                )}
                                <button
                                    onClick={() => executeDelete('me')}
                                    className="w-full py-3.5 bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-semibold rounded-xl text-[14px] border border-[var(--border)] transition-all active:scale-95"
                                >
                                    Delete for Me
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-2 text-[14px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]/60 transition-all mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit Modal */}
            {
                showEditModal && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowEditModal(false)}
                    >
                        <div
                            className="w-full max-w-[500px] bg-[var(--bg-base)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-8 py-6 border-b border-[var(--border)] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center border border-[rgba(var(--accent-rgb),0.2)]">
                                        <MessageSquare size={20} className="text-[var(--accent)]" />
                                    </div>
                                    <h3 className="text-[18px] font-bold text-[var(--text-primary)]">Edit Message</h3>
                                </div>
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8">
                                <textarea
                                    value={editMessageText}
                                    onChange={(e) => setEditMessageText(e.target.value)}
                                    className="w-full min-h-[160px] bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:border-[var(--border-accent)] focus:bg-[var(--surface-hover)] transition-all resize-none shadow-inner"
                                    placeholder="Type your message..."
                                    autoFocus
                                />
                                <div className="flex items-center justify-end gap-3 mt-8">
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="px-6 py-2.5 text-[14px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)]/80 transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button
                                        onClick={handleEditSubmit}
                                        disabled={!editMessageText.trim() || editMessageText === messages.find(m => m._id === editingMessageId)?.text}
                                        className="px-8 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-white/20 text-slate-900 font-bold rounded-xl text-[14px] transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Image Lightbox */}
            {
                lightboxImage && (
                    <div
                        onClick={() => setLightboxImage(null)}
                        onKeyDown={(e) => e.key === 'Escape' && setLightboxImage(null)}
                        tabIndex={0}
                        className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center cursor-zoom-out animate-[fadeIn_0.2s_ease-out]"
                        ref={(el) => el && el.focus()}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
                            className="absolute top-5 right-6 z-[101] w-10 h-10 rounded-full bg-[var(--surface-hover)] border border-[var(--border-hover)] flex items-center justify-center cursor-pointer text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
                        >
                            <X size={20} />
                        </button>
                        <img
                            src={lightboxImage}
                            alt="Full size"
                            onClick={(e) => e.stopPropagation()}
                            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-[0_20px_60px_var(--shadow)] cursor-default animate-[fadeSlideIn_0.25s_ease-out]"
                        />
                    </div>
                )
            }
        </div >
    );
};

export default ChatContainer;
