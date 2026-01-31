import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, MoreHorizontal, SendHorizontal } from 'lucide-react';
import { axiosInstance } from "../lib/axios"; 

const ChatContainer = ({ selectedUser }) => {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    // 1. Fetch Messages when selectedUser changes
    useEffect(() => {
        const getMessages = async () => {
            if (!selectedUser?._id) return;
            try {
                setLoading(true);
                const res = await axiosInstance.get(`/messages/${selectedUser._id}`);
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to load chat history:", error);
            } finally {
                setLoading(false);
            }
        };
        getMessages();
    }, [selectedUser?._id]);

    // 2. Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // 3. Send Message logic
    const handleSendMessage = async () => {
    if (message.trim()) {
        const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, {
            text: message 
        });
        setMessages((prev) => [...prev, res.data]);
        setMessage('');
    }
};
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Placeholder if no user is selected
    if (!selectedUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-white/50">
                <p className="text-xl">Select a contact to start chatting</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-[820px] flex-shrink-0" style={{ height: '100%', marginTop: '4px', paddingBottom: '20px' }}>
            {/* Canvas Header */}
            <div style={{ padding: '10px 10px 25px 10px' }}>
                <h2 className="text-[24px] font-medium text-white/90 tracking-[0.5px]" style={{ fontFamily: "'Inter', sans-serif" }}>Canvas</h2>
            </div>

            {/* Main Glass Panel */}
            <div className="relative flex-1 rounded-[14px] border border-white/8 overflow-hidden backdrop-blur-3xl bg-gradient-to-br from-[#0b1220]/40 via-[#2b1b3a]/20 to-[#091021]/40 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                
                {/* Visual Noise Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
                    }} />

                <div className="px-8 flex flex-col h-full">
                    
                    {/* Header: Contact Info */}
                    <div className="flex items-center justify-between mt-[12px] px-[32px]">
                        <div>
                            <h2 className="text-[36px] leading-tight font-extralight text-white/95 tracking-tight">
                                {selectedUser?.fullName}
                            </h2>
                            <div className="flex items-center gap-3 mt-2 mb-[16px]">
                                <div className={`w-2.5 h-2.5 rounded-full ${selectedUser?.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                                <span className="text-[12px] text-gray-400/80">
                                    {selectedUser?.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 -mt-[30px]">
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors"><Phone size={18} strokeWidth={1.5} /></button>
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors"><Video size={18} strokeWidth={1.5} /></button>
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors"><MoreHorizontal size={18} strokeWidth={1.5} /></button>
                        </div>
                    </div>

                    {/* Chat Area: Messages Mapping */}
                    <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar">
                        <div className="relative z-10 pb-10 px-[32px]">
                            {loading ? (
                                <div className="text-white/50 text-center mt-10">Loading messages...</div>
                            ) : (
                                messages.map((msg) => (
                                    <div 
                                        key={msg._id} 
                                        className={`flex ${msg.senderId === selectedUser._id ? 'justify-start' : 'justify-end'} mt-4`}
                                    >
                                        <div className="flex items-stretch gap-6 max-w-[70%]">
                                            {/* Accent Bar for Received */}
                                            {msg.senderId === selectedUser._id && (
                                                <div className="w-[4px] rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.18)]" />
                                            )}

                                            <div className={`flex flex-col gap-1 py-1 ${msg.senderId !== selectedUser._id ? 'items-end' : ''}`}>
                                                <div className="text-[15px] leading-relaxed text-white/85">
                                                    {msg.text}
                                                </div>
                                            </div>

                                            {/* Accent Bar for Sent */}
                                            {msg.senderId !== selectedUser._id && (
                                                <div className="w-[4px] rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.14)]" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {/* Auto-scroll target */}
                            <div ref={scrollRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="flex justify-center mt-auto pt-[16px] pb-[20px]">
                        <div className="w-[86%] max-w-[820px] h-[56px] bg-black/20 backdrop-blur-xl border border-white/8 rounded-[28px] shadow-[0_8px_30px_rgba(2,6,23,0.6)] flex items-center gap-3 px-[24px]">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent text-white/90 text-[15px] placeholder-white/30 outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                className="w-[40px] h-[40px] rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 hover:scale-105 transition-transform flex items-center justify-center flex-shrink-0"
                                style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}
                            >
                                <SendHorizontal size={18} className="text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatContainer;