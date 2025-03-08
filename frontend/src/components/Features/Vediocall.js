import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useRef, useState } from 'react';
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

function VideoCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoOn) {
      startVideo();
    } else {
      stopVideo();
    }
    return () => stopVideo(); 
  }, [videoOn]);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setStream(mediaStream);
      setError(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (error) {
      setError(`Camera error: ${error.message}`);
      setVideoOn(false);
    }
  };

  const stopVideo = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
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
            <span className="badge bg-primary position-absolute top-0 start-0 m-3">Dr. Smith</span>
          ) : (
            <h5 className="text-white">Waiting for Doctor...</h5>
          )}
        </div>
        <div className="rounded-3 shadow bg-dark position-relative p-3 d-flex align-items-center justify-content-center" style={{ width: '300px' }}>
          <span className="badge bg-success position-absolute top-0 start-0 m-3">You</span>
          {videoOn && stream ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-100 rounded" />
          ) : (
            <div className="text-light">Camera Off</div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger text-center m-3">{error}</div>
      )}

      <div className="bg-white shadow p-3 d-flex flex-wrap justify-content-center gap-3">
        <button className={`btn btn-${micMuted ? 'danger' : 'outline-primary'} rounded-circle p-3`} onClick={() => setMicMuted(!micMuted)}>
          {micMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
        </button>
        <button className={`btn btn-${videoOn ? 'outline-primary' : 'danger'} rounded-circle p-3`} onClick={() => setVideoOn(!videoOn)}>
          {videoOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
        </button>
        <button className={`btn btn-${isCallActive ? 'danger' : 'success'} rounded-circle p-3`} onClick={() => setIsCallActive(!isCallActive)}>
          {isCallActive ? <FaPhoneSlash size={24} /> : <FaPhone size={24} />}
        </button>
        <button className={`btn btn-${isChatOpen ? 'primary' : 'outline-primary'} rounded-circle p-3`} onClick={() => setIsChatOpen(!isChatOpen)}>
          <FaComment size={24} />
        </button>
      </div>

      {isChatOpen && (
        <div className="position-fixed bottom-0 end-0 m-3 bg-white shadow rounded border p-3" style={{ width: '350px', height: '400px' }}>
          <div className="d-flex justify-content-between border-bottom pb-2">
            <h6>Chat with Doctor</h6>
            <button className="btn btn-sm btn-outline-danger" onClick={() => setIsChatOpen(false)}>
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
}

export default VideoCall;
