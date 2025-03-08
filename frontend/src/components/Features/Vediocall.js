import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useRef, useState } from 'react';
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPhone,
  FaPhoneSlash,
  FaVideo,
  FaVideoSlash,
} from 'react-icons/fa';

// Generate a simple room code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase(); // e.g., "X7K9P2"
};

function VideoCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [targetRoomCode, setTargetRoomCode] = useState(''); // Room code to join
  const [connectionString, setConnectionString] = useState('');
  const [remoteConnectionString, setRemoteConnectionString] = useState('');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);

  // Generate room code on load or use URL param if provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('room');
    const code = codeFromUrl || generateRoomCode();
    setRoomCode(code);
    setTargetRoomCode(code); // Default to own room code
  }, []);

  useEffect(() => {
    if (videoOn) {
      startVideo();
    } else {
      stopVideo();
    }
  }, [videoOn]);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setError(null);
      console.log('Local stream initialized:', mediaStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
        localVideoRef.current.onloadedmetadata = () => localVideoRef.current.play();
      }

      if (peerConnection.current) {
        mediaStream.getTracks().forEach((track) =>
          peerConnection.current.addTrack(track, mediaStream)
        );
      }

      mediaStream.getAudioTracks().forEach((track) => (track.enabled = !micMuted));
    } catch (err) {
      setError(`Failed to access camera/microphone: ${err.message}`);
      setVideoOn(false);
      console.error('startVideo error:', err);
      throw err;
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      console.log('Local stream stopped');
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    let iceCandidates = [];
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
        console.log('New ICE candidate:', event.candidate);
      } else {
        const connData = {
          sdp: pc.localDescription,
          candidates: iceCandidates,
          room: roomCode, // Include room code in connection string
        };
        console.log('Connection string generated:', connData);
        setConnectionString(JSON.stringify(connData));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.onloadedmetadata = () => remoteVideoRef.current.play();
      }
      console.log('Remote stream received:', event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setIsCallActive(false);
        setRemoteStream(null);
      }
    };

    peerConnection.current = pc;
    return pc;
  };

  const startCall = async () => {
    try {
      if (!stream) await startVideo();
      if (!stream) throw new Error('Local stream not initialized');
      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setIsCallActive(true);
      console.log('Offer created and set:', offer);
    } catch (err) {
      setError(`Failed to start call: ${err.message}`);
      console.error('startCall error:', err);
    }
  };

  const joinCall = async () => {
    try {
      if (!remoteConnectionString) {
        setError('Please paste a valid connection string');
        console.log('No remote connection string provided');
        return;
      }
      const trimmedString = remoteConnectionString.trim();
      console.log('Remote connection string input (trimmed):', trimmedString);

      if (!stream) await startVideo();
      if (!stream) {
        setError('Local stream not initialized. Enable camera/microphone.');
        console.log('Stream not initialized');
        return;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      let remoteData;
      try {
        remoteData = JSON.parse(trimmedString);
        console.log('Parsed remote data:', remoteData);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        throw new Error('Invalid connection string format: ' + parseErr.message);
      }

      if (!remoteData.sdp || !remoteData.candidates || !remoteData.room) {
        throw new Error('Connection string missing sdp, candidates, or room');
      }

      if (remoteData.room !== targetRoomCode) {
        setError(`Room code mismatch: expected ${targetRoomCode}, got ${remoteData.room}`);
        console.log('Room code mismatch:', remoteData.room, 'vs', targetRoomCode);
        return;
      }

      await pc.setRemoteDescription(new RTCSessionDescription(remoteData.sdp));
      console.log('Remote SDP set:', remoteData.sdp);

      for (const candidate of remoteData.candidates) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('Added ICE candidate:', candidate);
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('Answer created and set:', answer);
      setConnectionString(JSON.stringify({ sdp: answer, candidates: [], room: roomCode }));
      setIsCallActive(true);
    } catch (err) {
      setError(`Failed to join call: ${err.message}`);
      console.error('joinCall error:', err);
    }
  };

  const toggleCall = () => {
    if (isCallActive) {
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      setRemoteStream(null);
      stopVideo();
      setConnectionString('');
      setRemoteConnectionString('');
      setIsCallActive(false);
      console.log('Call ended');
    } else {
      startCall();
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => (track.enabled = micMuted));
      console.log('Mic toggled:', !micMuted ? 'muted' : 'unmuted');
    }
    setMicMuted(!micMuted);
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
      <div className="bg-white shadow-sm p-3 d-flex align-items-center justify-content-between">
        <h4 className="mb-0 text-primary">Video Call - Room: {roomCode}</h4>
        {isCallActive && <span className="badge bg-success">Connected</span>}
      </div>

      <div className="flex-grow-1 d-flex flex-column flex-md-row p-3 gap-3">
        <div className="flex-grow-1 rounded-3 shadow bg-dark position-relative overflow-hidden p-3 d-flex align-items-center justify-content-center">
          {remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-100 rounded" />
          ) : (
            <h5 className="text-white">Waiting for Peer...</h5>
          )}
        </div>
        <div
          className="rounded-3 shadow bg-dark position-relative p-3 d-flex align-items-center justify-content-center"
          style={{ width: '300px' }}
        >
          <span className="badge bg-success position-absolute top-0 start-0 m-3">You</span>
          {videoOn && stream ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-100 rounded" />
          ) : (
            <div className="text-light">Camera Off</div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger text-center m-3">{error}</div>}

      <div className="bg-white shadow p-3 d-flex flex-wrap justify-content-center gap-3">
        <button
          className={`btn btn-${micMuted ? 'danger' : 'outline-primary'} rounded-circle p-3`}
          onClick={toggleMic}
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
          onClick={toggleCall}
        >
          {isCallActive ? <FaPhoneSlash size={24} /> : <FaPhone size={24} />}
        </button>
      </div>

      <div className="bg-white shadow p-3 m-3 rounded">
        <h5>Your Room Code: {roomCode}</h5>
        <div className="mb-3">
          <label>Join Room Code (enter the room code from your peer):</label>
          <input
            type="text"
            className="form-control"
            value={targetRoomCode}
            onChange={(e) => setTargetRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter peer's room code"
          />
        </div>
        <p>
          Share your room code ({roomCode}) with your peer. Then exchange connection strings to connect:
        </p>
        {connectionString ? (
          <div className="mb-3">
            <label>Your Connection String (copy this and send to your peer):</label>
            <textarea
              className="form-control"
              value={connectionString}
              readOnly
              onClick={(e) => e.target.select()}
              rows={4}
            />
          </div>
        ) : (
          <p>Click the phone button to start the call and generate your connection string.</p>
        )}

        <div className="mb-3">
          <label>Paste Your Peer’s Connection String:</label>
          <textarea
            className="form-control"
            value={remoteConnectionString}
            onChange={(e) => setRemoteConnectionString(e.target.value)}
            placeholder="Paste the JSON connection string from your peer here"
            rows={4}
          />
          <button className="btn btn-primary mt-2" onClick={joinCall}>
            Join Call
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;