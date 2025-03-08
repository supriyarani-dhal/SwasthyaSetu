import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useRef, useState } from 'react';
import {
    FaComment,
    FaDesktop,
    FaMicrophone,
    FaMicrophoneSlash,
    FaPhone,
    FaPhoneSlash,
    FaShareSquare,
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
    return () => stopVideo(); // Cleanup on unmount
  }, [videoOn]);

  const startVideo = async () => {
    try {
      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false // Start with audio off for simplicity
      });
      console.log('Camera access granted, stream obtained:', mediaStream);
      
      setStream(mediaStream);
      setError(null);

      if (videoRef.current) {
        console.log('Video Ref:', videoRef.current);
        videoRef.current.srcObject = mediaStream;
        console.log('Video srcObject:', videoRef.current.srcObject);

        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting to play...');
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
            setError('Error playing video: ' + err.message);
          });
        };

        // Explicitly play the video
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setError('Error playing video: ' + err.message);
        });
      }
    } catch (error) {
      console.error('Camera access error:', error.name, error.message);
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${error.message}`);
      }
      setVideoOn(false); // Reset video state on failure
    }
  };

  const stopVideo = () => {
    if (stream) {
      console.log('Stopping video stream...');
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const handleStartCall = () => setIsCallActive(true);
  const handleEndCall = () => {
    setIsCallActive(false);
    setVideoOn(false);
    stopVideo();
  };

  const toggleMic = () => {
    setMicMuted(!micMuted);
    if (stream) {
      stream.getAudioTracks().forEach(track => track.enabled = !micMuted);
    }
  };

  const toggleVideo = async () => {
    console.log('Video button clicked, current state:', videoOn);
    setVideoOn(!videoOn);
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const handleShareLink = () => alert('Share link functionality would be implemented here');

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0" style={{ background: '#f0f2f5' }}>
      {/* Header */}
      <div className="bg-white shadow-sm p-3 d-flex align-items-center justify-content-between">
        <h4 className="mb-0">Telemedicine Consultation</h4>
        {isCallActive && <span className="badge bg-success">Connected</span>}
      </div>

      {/* Video Section */}
      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Doctor's Video (Left Side) */}
        <div className="w-75 p-3">
          <div className="h-100 position-relative bg-dark rounded-3 shadow overflow-hidden">
            {isCallActive ? (
              <>
                <span className="badge bg-primary position-absolute top-0 start-0 m-3">
                  Dr. Smith
                </span>
                <div className="w-100 h-100 bg-secondary d-flex align-items-center justify-content-center text-light">
                  Doctor's Video
                </div>
              </>
            ) : (
              <div className="w-100 h-100 d-flex align-items-center justify-content-center text-light bg-dark">
                <div className="text-center">
                  <h5>Waiting for Doctor</h5>
                  <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User's Video (Right Side) */}
        <div className="w-25 p-3 d-flex flex-column">
          <div className="bg-dark rounded-3 shadow position-relative flex-grow-1 overflow-hidden">
            <span className="badge bg-success position-absolute top-0 start-0 m-3">
              You
            </span>
            <div className="w-100 h-100 d-flex align-items-center justify-content-center">
              {videoOn && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <div className="bg-secondary w-100 h-100 d-flex align-items-center justify-content-center text-light">
                  {error ? error : 'Camera Off'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger text-center m-3" role="alert">
          {error}
          <br />
          <small>Check browser permissions or try refreshing the page.</small>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white shadow p-4 d-flex justify-content-center align-items-center gap-4">
        <button
          className={`btn btn-${micMuted ? 'danger' : 'outline-primary'} rounded-circle p-3`}
          onClick={toggleMic}
          title="Toggle Microphone"
          disabled={!stream}
        >
          {micMuted ? <FaMicrophoneSlash size={24} /> : <FaMicrophone size={24} />}
        </button>

        <button
          className={`btn btn-${videoOn ? 'outline-primary' : 'danger'} rounded-circle p-3`}
          onClick={toggleVideo}
          title="Toggle Video"
        >
          {videoOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
        </button>

        <button
          className={`btn btn-${isCallActive ? 'danger' : 'success'} rounded-circle p-3`}
          onClick={isCallActive ? handleEndCall : handleStartCall}
          title={isCallActive ? "End Call" : "Start Call"}
        >
          {isCallActive ? <FaPhoneSlash size={24} /> : <FaPhone size={24} />}
        </button>

        <button
          className={`btn btn-${isScreenSharing ? 'primary' : 'outline-primary'} rounded-circle p-3`}
          onClick={toggleScreenShare}
          title="Share Screen"
          disabled={!isCallActive}
        >
          <FaDesktop size={24} />
        </button>

        <button
          className={`btn btn-${isChatOpen ? 'primary' : 'outline-primary'} rounded-circle p-3`}
          onClick={toggleChat}
          title="Toggle Chat"
          disabled={!isCallActive}
        >
          <FaComment size={24} />
        </button>

        <button
          className="btn btn-outline-primary rounded-circle p-3"
          onClick={handleShareLink}
          title="Share Call Link"
          disabled={!isCallActive}
        >
          <FaShareSquare size={24} />
        </button>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div 
          className="position-fixed bottom-0 end-0 m-4 bg-white shadow rounded-3 border"
          style={{ width: '350px', height: '400px' }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Chat with Doctor</h6>
            <button className="btn btn-sm btn-outline-danger p-1" onClick={toggleChat}>
              <FaTimes />
            </button>
          </div>
          <div className="p-3 overflow-auto" style={{ height: 'calc(100% - 100px)' }}>
            <div className="text-muted text-center">No messages yet</div>
          </div>
          <div className="p-3 border-top">
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type a message..." 
              />
              <button className="btn btn-primary">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCall;