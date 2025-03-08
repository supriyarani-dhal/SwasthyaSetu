import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
    FaComment,
    FaMicrophone,
    FaMicrophoneSlash,
    FaPhone,
    FaPhoneSlash,
    FaTimes,
    FaVideo,
    FaVideoSlash
} from 'react-icons/fa';

const VideoCall = () => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [isCallActive, setIsCallActive] = useState(false);
    const [micMuted, setMicMuted] = useState(false);
    const [videoOn, setVideoOn] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const pcRef = useRef(null);
    const droneRef = useRef(null);

    if (!window.location.hash) {
        window.location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
    }
    const roomHash = window.location.hash.substring(1);

    useEffect(() => {
        if (!window.ScaleDrone) {
            setError('ScaleDrone library not loaded');
            return;
        }

        const drone = new window.ScaleDrone('yiS12Ts5RdNhebyM'); // Replace with your valid channel ID
        droneRef.current = drone;
        const roomName = 'observable-' + roomHash;
        const configuration = {
            iceServers: [{
                urls: 'stun:stun.l.google.com:19302'
            }]
        };

        const onError = (error) => {
            console.error('WebRTC Error:', error);
            const errorMessage = error?.message || error?.toString() || 'Unknown error';
            setError(`Error: ${errorMessage}`);
        };

        drone.on('open', (error) => {
            if (error) {
                onError(error);
                return;
            }
            console.log('ScaleDrone connection established');
            const room = drone.subscribe(roomName);
            room.on('open', (error) => {
                if (error) onError(error);
                else console.log('Subscribed to room:', roomName);
            });
            
            room.on('members', members => {
                console.log('Members in room:', members.length);
                const isOfferer = members.length === 2;
                startWebRTC(isOfferer);
            });

            room.on('data', (message, client) => {
                if (!pcRef.current || client.id === drone.clientId) return;
                console.log('Received data:', message);

                if (message.sdp) {
                    console.log('Processing SDP:', message.sdp.type);
                    pcRef.current.setRemoteDescription(new RTCSessionDescription(message.sdp))
                        .then(() => {
                            if (message.sdp.type === 'offer') {
                                console.log('Creating answer');
                                pcRef.current.createAnswer()
                                    .then(localDescCreated)
                                    .catch(onError);
                            }
                        })
                        .catch(onError);
                } else if (message.candidate) {
                    console.log('Adding ICE candidate');
                    pcRef.current.addIceCandidate(new RTCIceCandidate(message.candidate))
                        .catch(onError);
                }
            });
        });

        drone.on('error', (error) => onError(error));
        drone.on('close', () => {
            console.log('ScaleDrone connection closed');
            setIsCallActive(false);
            setError('Connection to server closed');
        });

        const sendMessage = (message) => {
            if (droneRef.current && droneRef.current.state === 'open') {
                console.log('Sending message:', message);
                droneRef.current.publish({
                    room: roomName,
                    message
                });
            } else {
                console.warn('Cannot send message: Drone connection not open');
            }
        };

        const startWebRTC = (isOfferer) => {
            console.log('Starting WebRTC, isOfferer:', isOfferer);
            pcRef.current = new RTCPeerConnection(configuration);
            setIsCallActive(true);

            pcRef.current.onicecandidate = event => {
                if (event.candidate) {
                    sendMessage({'candidate': event.candidate});
                }
            };

            pcRef.current.ontrack = event => {
                console.log('Remote track received:', event.streams);
                const remoteStream = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                    remoteVideoRef.current.play().catch(e => console.error('Remote video play error:', e));
                }
            };

            pcRef.current.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', pcRef.current.iceConnectionState);
                if (pcRef.current.iceConnectionState === 'disconnected') {
                    setIsCallActive(false);
                }
            };

            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            }).then(mediaStream => {
                console.log('Local stream obtained');
                setStream(mediaStream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = mediaStream;
                    localVideoRef.current.play().catch(e => console.error('Local video play error:', e));
                }
                mediaStream.getTracks().forEach(track => {
                    if (pcRef.current) {
                        console.log('Adding track:', track.kind);
                        pcRef.current.addTrack(track, mediaStream);
                    }
                });

                if (isOfferer) {
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
                    .then(() => sendMessage({'sdp': pcRef.current.localDescription}))
                    .catch(onError);
            }
        };

        return () => {
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
            droneRef.current = null;
        };
    }, [roomHash]);

    useEffect(() => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !micMuted;
            });
            stream.getVideoTracks().forEach(track => {
                track.enabled = videoOn;
            });
        }
    }, [micMuted, videoOn, stream]);

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
                    {videoOn && stream ? (
                        <video ref={localVideoRef} autoPlay playsInline muted className="w-100 rounded" />
                    ) : (
                        <div className="text-light">Camera Off</div>
                    )}
                </div>
            </div>

            {error && (
                <div className="alert alert-danger text-center m-3">{error}</div>
            )}

            <div className="bg-white shadow p-3 d-flex flex-wrap justify-content-center gap-3">
                <button 
                    className={`btn btn-${micMuted ? 'danger' : 'outline-primary'} rounded-circle p-3`}
                    onClick={() => setMicMuted(!micMuted)}
                >
                    {micMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
                </button>
                <button 
                    className={`btn btn-${videoOn ? 'outline-primary' : 'danger'} rounded-circle p-3`}
                    onClick={() => setVideoOn(!videoOn)}
                >
                    {videoOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
                </button>
                <button 
                    className={`btn btn-${isCallActive ? 'danger' : 'success'} rounded-circle p-3`}
                    onClick={handleCallToggle}
                >
                    {isCallActive ? <FaPhoneSlash size={24} /> : <FaPhone size={24} />}
                </button>
                <button 
                    className={`btn btn-${isChatOpen ? 'primary' : 'outline-primary'} rounded-circle p-3`}
                    onClick={() => setIsChatOpen(!isChatOpen)}
                >
                    <FaComment size={24} />
                </button>
            </div>

            {isChatOpen && (
                <div className="position-fixed bottom-0 end-0 m-3 bg-white shadow rounded border p-3" style={{ width: '350px', height: '400px' }}>
                    <div className="d-flex justify-content-between border-bottom pb-2">
                        <h6>Chat</h6>
                        <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setIsChatOpen(false)}
                        >
                            <FaTimes />
                        </button>
                    </div>
                    <div className="p-3 overflow-auto flex-grow-1">No messages yet</div>
                    <div className="p-2 border-top d-flex">
                        <input type="text" className="form-control" placeholder="Type a message..." />
                        <button className="btn btn-primary ms-2">Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCall;