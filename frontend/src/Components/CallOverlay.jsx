import React, { useEffect, useRef, useState } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, User } from 'lucide-react';
import { getLocalStream, getRemoteStream, toggleAudio, toggleVideo } from '../services/webrtc';

const CallOverlay = ({ callState, onAccept, onReject, onEnd }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Update streams whenever call state indicates connection / streams are active
    useEffect(() => {
        if (callState.status === 'connected') {
            const localStream = getLocalStream();
            const remoteStream = getRemoteStream();

            if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
            }
            if (remoteVideoRef.current && remoteStream) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
        }
    }, [callState.status, callState.remoteStreamUpdated]);

    // Ringtone logic using Web Audio API
    useEffect(() => {
        let audioCtx;
        let interval;

        if (callState.status === 'incoming' || callState.status === 'dialing' || callState.status === 'ringing') {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                try {
                    audioCtx = new AudioContext();

                    const playRing = () => {
                        if (audioCtx.state === 'suspended') audioCtx.resume();

                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();

                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);

                        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
                        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);

                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);

                        oscillator.start(audioCtx.currentTime);
                        oscillator.stop(audioCtx.currentTime + 1.5);
                    };

                    playRing();
                    interval = setInterval(playRing, 3000);
                } catch (e) {
                    console.error('Ringtone autoplay blocked or failed', e);
                }
            }
        }

        return () => {
            if (interval) clearInterval(interval);
            if (audioCtx) {
                audioCtx.close().catch(() => { });
            }
        };
    }, [callState.status]);

    if (callState.status === 'idle') return null;

    const handleToggleMute = () => {
        const newState = !isMuted;
        setIsMuted(newState);
        toggleAudio(!newState);
    };

    const handleToggleVideo = () => {
        const newState = !isVideoOff;
        setIsVideoOff(newState);
        toggleVideo(!newState);
    };

    const isVideoCall = callState.callType === 'video';

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="relative w-full max-w-[800px] h-[600px] bg-[var(--surface-panel)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col items-center justify-center p-8">

                {/* Caller / Receiver Display */}
                {callState.status !== 'connected' && (
                    <div className="flex flex-col items-center gap-6 mb-12">
                        <div className="w-32 h-32 rounded-full bg-[rgba(var(--accent-rgb),0.2)] flex items-center justify-center border-4 border-[rgba(var(--accent-rgb),0.3)]">
                            {callState.otherUserPic ? (
                                <img src={callState.otherUserPic} alt="participant" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={48} className="text-[var(--accent)]" />
                            )}
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{callState.otherUserName || 'Unknown'}</h2>
                            <p className={`text-lg capitalize ${callState.status === 'failed' ? 'text-[var(--status-danger)]' : 'text-[var(--text-secondary)]'}`}>
                                {callState.status === 'incoming' ? 'Incoming ' + callState.callType + ' call...' : ''}
                                {callState.status === 'ringing' ? 'Calling...' : ''}
                                {callState.status === 'connecting' ? 'Connecting...' : ''}
                                {callState.status === 'failed' ? (callState.errorMessage || 'Call failed') : ''}
                            </p>
                        </div>
                    </div>
                )}

                {/* Video Streams */}
                {callState.status === 'connected' && (
                    <div className="absolute inset-0 w-full h-full bg-black">
                        {isVideoCall ? (
                            <>
                                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain" />
                                <div className="absolute bottom-24 right-8 w-48 h-64 bg-[var(--bg-base)] border border-[var(--border-hover)] rounded-xl overflow-hidden shadow-xl z-10">
                                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full bg-[linear-gradient(to_bottom,var(--surface-panel),var(--bg-base))]">
                                <div className="w-48 h-48 rounded-full bg-[rgba(var(--accent-rgb),0.1)] flex items-center justify-center border-2 border-[var(--border-accent)] mb-8 animate-pulse">
                                    <User size={80} className="text-[rgba(var(--accent-rgb),0.5)]" />
                                </div>
                                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{callState.otherUserName || 'Unknown'}</h2>
                                <p className="text-[var(--status-online)] font-medium">00:00</p>
                                <audio ref={remoteVideoRef} autoPlay />
                            </div>
                        )}
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/50 backdrop-blur-xl rounded-full border border-[var(--border)] z-20">
                    {callState.status === 'incoming' ? (
                        <>
                            <button onClick={onReject} className="w-14 h-14 bg-[var(--status-danger)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:opacity-80 transition-opacity shadow-lg">
                                <PhoneOff size={24} />
                            </button>
                            <button onClick={onAccept} className="w-14 h-14 bg-[var(--status-online)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:opacity-80 transition-opacity shadow-lg">
                                {isVideoCall ? <Video size={24} /> : <Phone size={24} />}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={handleToggleMute} className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-colors ${isMuted ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}>
                                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            </button>

                            {isVideoCall && (
                                <button onClick={handleToggleVideo} className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-colors ${isVideoOff ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : 'bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}>
                                    {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                                </button>
                            )}

                            <button onClick={onEnd} className="w-14 h-14 bg-[var(--status-danger)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:opacity-80 transition-opacity shadow-lg ml-4">
                                <PhoneOff size={24} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallOverlay;
