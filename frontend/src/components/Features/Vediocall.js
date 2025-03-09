import React, { useState } from 'react';

function AppointmentPage() {
  // Base URL from the external site
  const baseUrl = "https://alekhakumarswain.github.io/OnlineAppointment-/";
  
  // State to manage the iframe URL
  const [iframeUrl, setIframeUrl] = useState(baseUrl);

  // Function to generate a new URL with a random hash
  const handleBookAppointment = () => {
    // Generate a random 6-character hash (e.g., #a1b2c3)
    const randomHash = '#' + Math.random().toString(36).substring(2, 8);
    const newUrl = `${baseUrl}${randomHash}`;
    setIframeUrl(newUrl); // Update the iframe URL
    alert(`Your appointment link: ${newUrl}`); // Show the generated link to the user
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Doctor Appointment Video Call</h1>
      
      {/* Button to book the appointment */}
      <button 
        onClick={handleBookAppointment} 
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          marginBottom: '20px', 
          cursor: 'pointer' 
        }}
      >
        Book the Appointment
      </button>

      {/* Iframe to display the external page */}
      <div>
        <iframe
          src={iframeUrl}
          title="Appointment Video Call"
          width="100%"
          height="600px"
          style={{ border: 'none' }}
          allow="camera; microphone" // Enable camera and microphone for video calls
        />
      </div>
    </div>
  );
}

export default AppointmentPage;