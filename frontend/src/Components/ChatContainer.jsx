import React, { useState } from 'react';
import { Phone, Video, MoreHorizontal, SendHorizontal } from 'lucide-react';

const ChatContainer = () => {
    const [message, setMessage] = useState('');

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

                    {/* Contact header */}
                    <div className="flex items-center justify-between" style={{ marginTop: '12px', paddingLeft: '32px', paddingRight: '32px' }}>
                        <div className="">
                            <h2 className="text-[36px] leading-tight font-extralight text-white/95 tracking-tight">Stephen Hawking</h2>
                            <div className="flex items-center gap-3 mt-2" style={{ marginBottom: '16px' }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.45)]" />
                                <span className="text-[12px] text-gray-400/80" >You messaged Stephen Hawking</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4" style={{ marginTop: '-30px' }}>
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors">
                                <Phone size={18} strokeWidth={1.5} />
                            </button>
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors">
                                <Video size={18} strokeWidth={1.5} />
                            </button>
                            <button className="text-gray-300/70 hover:text-white/95 transition-colors">
                                <MoreHorizontal size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    {/* Messages scroll area */}
                    <div className="overflow-y-auto overflow-x-hidden pr-6 scrollbar-thin scrollbar-thumb-transparent" style={{ flex: 1, maxHeight: 'calc(100% - 200px)' }}>

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

                                if (msg.type === 'received') {
                                    return (
                                        <div key={msg.id} className={`flex items-stretch gap-6 max-w-[70%] ${marginTop}`}>
                                            {/* vertical accent at left - connects with adjacent same-type messages */}
                                            <div className={`w-[4px] ${barRounding} bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.18)]`} />

                                            <div className="flex flex-col gap-1 py-1">
                                                {showTimestamp && <div className="text-[12px] text-gray-400/75">Received • {msg.timestamp}</div>}
                                                <div className="text-[15px] leading-relaxed text-white/85 max-w-[720px]">{msg.text}</div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (msg.type === 'sent') {
                                    return (
                                        <div key={msg.id} className={`flex justify-end ${marginTop}`}>
                                            <div className="flex items-stretch gap-6 max-w-[70%]">
                                                <div className="flex flex-col gap-1 items-end py-1">
                                                    {showTimestamp && <div className="text-[12px] text-gray-400/70">{msg.timestamp}</div>}
                                                    <div className="text-[15px] leading-relaxed text-white/85 text-right">{msg.text}</div>
                                                </div>

                                                <div className={`w-[4px] ${barRounding} bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.14)]`} />
                                            </div>
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
        </div>
    );
};

export default ChatContainer;
