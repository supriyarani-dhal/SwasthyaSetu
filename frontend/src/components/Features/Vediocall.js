import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaPhoneSlash } from 'react-icons/fa';

const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const pcRef = useRef(null);
    const droneRef = useRef(null);
    const [isDroneConnected, setIsDroneConnected] = useState(false);
    const pendingMembersRef = useRef(null);
    const hasStartedWebRTC = useRef(false);

    if (!window.location.hash) {
        window.location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    }
    const roomHash = window.location.hash.substring(1);

    const onError = (error) => {
        console.error('Error:', error);
        setError(`Error: ${error.message || error.toString() || 'Unknown error'}`);
    };

    const sendMessage = (message) => {
        if (droneRef.current && droneRef.current.state === 'open') {
            console.log('Sending message:', message);
            droneRef.current.publish({
                room: 'observable-' + roomHash,
                message
            });
        } else {
            console.warn('Cannot send message: Drone connection not open');
            setError('Failed to send signaling data: ScaleDrone connection not available');
        }
    };

    const startWebRTC = (isOfferer) => {
        if (hasStartedWebRTC.current) {
            console.log('WebRTC already started, skipping');
            return;
        }
        if (pcRef.current) {
            console.log('Peer connection already exists, skipping WebRTC start');
            return;
        }

        console.log('Starting WebRTC, isOfferer:', isOfferer);
        pcRef.current = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        });
        hasStartedWebRTC.current = true;
        setIsCallActive(true);

        pcRef.current.onicecandidate = event => {
            if (event.candidate) {
                console.log('ICE candidate generated:', event.candidate);
                sendMessage({ candidate: event.candidate });
            }
        };

        pcRef.current.ontrack = event => {
            console.log('Remote track received:', event.streams);
            const remoteStream = event.streams[0];
            if (remoteVideoRef.current && (!remoteVideoRef.current.srcObject || remoteVideoRef.current.srcObject.id !== remoteStream.id)) {
                remoteVideoRef.current.srcObject = remoteStream;
                remoteVideoRef.current.play()
                    .then(() => console.log('Remote video playing'))
                    .catch(e => console.error('Error playing remote video:', e));
            }
        };

        pcRef.current.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', pcRef.current.iceConnectionState);
            if (pcRef.current.iceConnectionState === 'disconnected') {
                setIsCallActive(false);
                setError('Peer disconnected');
            } else if (pcRef.current.iceConnectionState === 'failed') {
                setError('ICE connection failed');
            } else if (pcRef.current.iceConnectionState === 'connected' || pcRef.current.iceConnectionState === 'completed') {
                console.log('Peers successfully connected');
            }
        };

        navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        }).then(mediaStream => {
            console.log('Local stream obtained:', mediaStream);
            setStream(mediaStream);
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = mediaStream;
                localVideoRef.current.play()
                    .then(() => console.log('Local video playing'))
                    .catch(e => console.error('Error playing local video:', e));
            }
            mediaStream.getTracks().forEach(track => {
                if (pcRef.current) {
                    console.log('Adding track to peer connection:', track.kind);
                    pcRef.current.addTrack(track, mediaStream);
                }
            });

            if (isOfferer && pcRef.current) {
                console.log('Creating offer');
                pcRef.current.createOffer()
                    .then(localDescCreated)
                    .catch(onError);
            }
        }).catch(onError);
    };

    const localDescCreated = (desc) => {
        if (pcRef.current) {
            console.log('Setting local description:', desc.type);
            pcRef.current.setLocalDescription(desc)
                .then(() => {
                    console.log('Local description set, sending SDP');
                    sendMessage({ sdp: pcRef.current.localDescription });
                })
                .catch(onError);
        } else {
            console.error('Cannot set local description: Peer connection is null');
            setError('Failed to create offer: Peer connection unavailable');
        }
    };

    useEffect(() => {
        if (!window.ScaleDrone) {
            setError('ScaleDrone library not loaded. Please include <script src="https://cdn.scaledrone.com/scaledrone.min.js"></script> in your HTML.');
            return;
        }

        const drone = new window.ScaleDrone('QUjOzOu5cuV97r5H');
        droneRef.current = drone;
        const roomName = 'observable-' + roomHash;

        drone.on('open', (error) => {
            if (error) {
                onError(error);
                return;
            }
            console.log('Successfully connected to ScaleDrone');
            setIsDroneConnected(true);
            const room = drone.subscribe(roomName);
            room.on('open', (error) => {
                if (error) onError(error);
                else console.log('Subscribed to room:', roomName);
            });

            room.on('members', members => {
                console.log('Members in room:', members);
                if (members.length > 2 && !hasStartedWebRTC.current) {
                    console.warn('Room has more than 2 members, rejecting new connection');
                    setError('Room is full; only two participants allowed');
                    if (droneRef.current && droneRef.current.state === 'open') {
                        droneRef.current.close(); // Close connection for excess members
                    }
                    return;
                }

                if (!isDroneConnected) {
                    console.log('Drone not yet connected, queuing members');
                    pendingMembersRef.current = members.slice(0, 2);
                } else {
                    const limitedMembers = members.slice(0, 2);
                    const isOfferer = limitedMembers.length === 2;
                    startWebRTC(isOfferer);
                }
            });

            room.on('data', (message, client) => {
                if (!pcRef.current || client.id === drone.clientId) return;
                console.log('Received signaling data:', message);

                if (message.sdp) {
                    pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp))
                        .then(() => {
                            console.log('Set remote description:', message.sdp.type);
                            if (message.sdp.type === 'offer') {
                                console.log('Creating answer');
                                pcRef.current.createAnswer()
                                    .then(localDescCreated)
                                    .catch(onError);
                            }
                        })
                        .catch(onError);
                } else if (message.candidate) {
                    console.log('Adding ICE candidate:', message.candidate);
                    pcRef.current.addIceCandidate(new RTCIceCandidate(message.candidate))
                        .catch(e => console.error('Error adding ICE candidate:', e));
                }
            });
        });

        drone.on('error', (error) => {
            onError(error);
            setIsDroneConnected(false);
        });

        drone.on('close', (event) => {
            console.log('ScaleDrone connection closed:', event);
            setIsDroneConnected(false);
            setIsCallActive(false);
            setError('ScaleDrone connection closed unexpectedly');
        });

        if (isDroneConnected && pendingMembersRef.current) {
            const members = pendingMembersRef.current;
            const isOfferer = members.length === 2;
            startWebRTC(isOfferer);
            pendingMembersRef.current = null;
        }

        // Cleanup on unmount or window close
        const handleBeforeUnload = () => {
            if (droneRef.current && droneRef.current.state === 'open') {
                droneRef.current.close();
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (droneRef.current && droneRef.current.state === 'open') {
                droneRef.current.close();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            setIsDroneConnected(false);
            hasStartedWebRTC.current = false;
            droneRef.current = null;
        };
    }, [roomHash, isDroneConnected]);

    const handleCallToggle = () => {
        if (isCallActive) {
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
            if (droneRef.current && droneRef.current.state === 'open') {
                droneRef.current.close();
            }
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = null;
            }
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }
            setIsCallActive(false);
            setIsDroneConnected(false);
            hasStartedWebRTC.current = false;
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
            <div className="bg-white shadow-sm p-3 d-flex align-items-center justify-content-between">
                <h4 className="mb-0 text-primary">Telemedicine Consultation</h4>
                {isCallActive && <span className="badge bg-success">Connected</span>}
            </div>

            <div className="flex-grow-1 d-flex flex-column flex-md-row p-3 gap-3">
                <div className="flex-grow-1 rounded-3 shadow bg-dark position-relative overflow-hidden p-3 d-flex align-items-center justify-content-center">
                    {isCallActive ? (
                        <>
                            <span className="badge bg-primary position-absolute top-0 start-0 m-3">Remote</span>
                            <video ref={remoteVideoRef} autoPlay playsInline className="w-100 rounded" />
                        </>
                    ) : (
                        <h5 className="text-white">Waiting for connection...</h5>
                    )}
                </div>
                <div className="rounded-3 shadow bg-dark position-relative p-3 d-flex align-items-center justify-content-center" style={{ width: '300px' }}>
                    <span className="badge bg-success position-absolute top-0 start-0 m-3">You</span>
                    {stream ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-100 rounded" />
                    ) : (
                        <div className="text-light">Camera Loading...</div>
                    )}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger text-center m-3">{error}</div>
            )}

            <div className="bg-white shadow p-3 d-flex justify-content-center">
                {isCallActive && (
                    <button 
                        className="btn btn-danger rounded-circle p-3"
                        onClick={handleCallToggle}
                    >
                        <FaPhoneSlash size={24} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default VideoCall;