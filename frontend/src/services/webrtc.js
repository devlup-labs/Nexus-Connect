let pc = null;
let localStream = null;
let remoteStream = null;
let iceCandidateQueue = [];

export function getLocalStream() {
    return localStream;
}

export function getRemoteStream() {
    return remoteStream;
}

export async function createPeerConnection({ iceServers, onIceCandidate, onTrack, onConnectionStateChange }) {
    iceCandidateQueue = [];
    pc = new RTCPeerConnection({ iceServers });
    remoteStream = new MediaStream();

    pc.onicecandidate = (event) => {
        if (event.candidate) onIceCandidate(event.candidate);
    };

    pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
        if (onTrack) onTrack(remoteStream);
    };

    pc.onconnectionstatechange = () => {
        if (onConnectionStateChange) onConnectionStateChange(pc.connectionState);
    };

    return pc;
}

export async function startLocalMedia(callType) {
    if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
    }

    const constraints = callType === "video"
        ? { audio: true, video: true } // Removed strict width/height to avoid constrained devices failing
        : { audio: true, video: false };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return localStream;
}

export function addLocalTracks() {
    if (!pc || !localStream) return;
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
}

export async function createOffer() {
    if (!pc) return null;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
}

async function flushIceCandidateQueue() {
    if (!pc || !pc.remoteDescription) return;
    for (const candidate of iceCandidateQueue) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("Error adding queued ICE candidate", err);
        }
    }
    iceCandidateQueue = [];
}

export async function applyRemoteOffer(offer) {
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIceCandidateQueue();
}

export async function createAnswer() {
    if (!pc) return null;
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
}

export async function applyRemoteAnswer(answer) {
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    await flushIceCandidateQueue();
}

export async function addIceCandidate(candidate) {
    if (!pc) return;
    if (pc.remoteDescription) {
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error("Error adding ICE candidate", err);
        }
    } else {
        iceCandidateQueue.push(candidate);
    }
}

export function toggleAudio(enabled) {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
    });
}

export function toggleVideo(enabled) {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
    });
}

export function cleanupWebRTC() {
    if (pc) {
        pc.ontrack = null;
        pc.onicecandidate = null;
        pc.onconnectionstatechange = null;
        pc.close();
        pc = null;
    }

    iceCandidateQueue = [];

    if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        localStream = null;
    }

    if (remoteStream) {
        remoteStream.getTracks().forEach((t) => t.stop());
        remoteStream = null;
    }
}
