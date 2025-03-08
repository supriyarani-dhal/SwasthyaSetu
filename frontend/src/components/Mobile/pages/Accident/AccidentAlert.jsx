import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./AccidentAlert.module.css";
import {
  AlertTriangle as WarningIcon,
  MapPin as LocationIcon,
  Phone as PhoneIcon,
  Droplet as BloodIcon,
  Clock as ClockIcon,
  Bell as NotificationIcon,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for Leaflet's default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: null,
  iconUrl: null,
  shadowUrl: null,
});

// Custom marker with alert type styling
const CustomMarker = ({ position, alertType, children }) => {
  const alertColors = {
    Critical: "#F44336", // Red
    Urgent: "#FF9800", // Orange
    Normal: "#4CAF50", // Green
  };

  const dotIcon = L.divIcon({
    html: `<div style="width: 12px; height: 12px; background-color: ${
      alertColors[alertType] || "#000"
    }; border-radius: 50%; border: 2px solid white;"></div>`,
    className: "custom-dot-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });

  return (
    <Marker position={position} icon={dotIcon}>
      {children}
    </Marker>
  );
};

// Enhanced PortalSelect component
const PortalSelect = ({ options, value, onChange, placeholder, className }) => {
  return (
    <Select
      options={options}
      value={options.find((opt) => opt.value === value) || null}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      menuPosition="fixed"
      menuPortalTarget={document.body}
      styles={{
        menu: (base) => ({
          ...base,
          zIndex: 9999,
          position: "fixed",
          width: "100%",
          maxWidth: "480px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          background: "#fff",
          border: "1px solid #d4a017",
        }),
        control: (base) => ({
          ...base,
          border: "none",
          boxShadow: "none",
          background: "transparent",
          minHeight: "40px",
        }),
        option: (base) => ({ ...base, color: "#5c4033" }),
        singleValue: (base) => ({ ...base, color: "#5c4033" }),
      }}
    />
  );
};

// Location picker for pinning accident location
const LocationPicker = ({ onLocationSelect, initialLocation }) => {
  const [position, setPosition] = useState(initialLocation || null);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });
  return position ? (
    <Marker position={position}>
      <Popup>
        Pinned: Lat {position.lat.toFixed(4)}, Lng {position.lng.toFixed(4)}
      </Popup>
    </Marker>
  ) : null;
};

// Create hexagon overlay for 5 km radius
const createHexagon = (center, radiusKm) => {
  const latlng = L.latLng(center);
  const points = [];
  const earthRadius = 6371;
  const radiusDeg = (radiusKm / earthRadius) * (180 / Math.PI);

  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 * Math.PI) / 180;
    const lat = latlng.lat + radiusDeg * Math.cos(angle);
    const lng =
      latlng.lng +
      (radiusDeg * Math.sin(angle)) / Math.cos((latlng.lat * Math.PI) / 180);
    points.push([lat, lng]);
  }
  return points;
};

// Fetch location details using Nominatim API
const fetchLocationDetails = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    return {
      displayName: data.display_name || `Lat: ${lat}, Lng: ${lng}`,
      lat,
      lng,
      city: data.address?.city || data.address?.town || '',
      state: data.address?.state || '',
      district: data.address?.county || '',
    };
  } catch (error) {
    console.error("Error fetching location details:", error);
    return { displayName: `Lat: ${lat}, Lng: ${lng}`, lat, lng, city: '', state: '', district: '' };
  }
};

// Calculate distance between two coordinates
const calculateDistance = (loc1, loc2) => {
  const R = 6371;
  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Convert timestamp to IST
const convertToIST = (time) => {
  const date = new Date(time);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const AccidentAlert = () => {
  const user = {
    name: "Alekha Kumar Swain",
    emergencyContacts: ["+91 1234567890", "+91 9876543210"],
    bloodGroup: "A+",
    defaultLocation: { lat: 20.296071, lng: 85.824539 }, // Bhubaneswar
  };

  const [liveLocation, setLiveLocation] = useState(user.defaultLocation);
  const [accidents, setAccidents] = useState([]);
  const [newAccident, setNewAccident] = useState({
    location: "",
    district: "",
    state: "Odisha",
    description: "",
    pinnedLocation: null,
    manualDistrict: "",
    manualCity: "",
    alertType: "Normal",
    city: "",
  });
  const [isReporting, setIsReporting] = useState(false);
  const [bloodRequired, setBloodRequired] = useState(false);
  const [nearestDoctors, setNearestDoctors] = useState([]);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  const [pinnedLocationDetails, setPinnedLocationDetails] = useState({
    displayName: "",
    lat: null,
    lng: null,
    city: "",
    state: "",
    district: "",
  });
  const [manualCityVisible, setManualCityVisible] = useState(false);
  const [manualDistrictVisible, setManualDistrictVisible] = useState(false);
  const [isEmergencyAlertEnabled, setIsEmergencyAlertEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Odisha districts
  const odishaDistricts = [
    { value: "Angul", label: "Angul" },
    { value: "Cuttack", label: "Cuttack" },
    { value: "Khordha", label: "Khordha" },
    { value: "Puri", label: "Puri" },
    { value: "Other", label: "Other (Enter Manually)" },
  ];

  const districtCities = {
    Angul: ["Angul", "Talcher"],
    Cuttack: ["Cuttack", "Choudwar"],
    Khordha: ["Bhubaneswar", "Jatani"],
    Puri: ["Puri", "Konark"],
  };

  const alertOptions = [
    { value: "Critical", label: "Critical" },
    { value: "Urgent", label: "Urgent" },
    { value: "Normal", label: "Normal" },
  ];

  // Fetch live location
  useEffect(() => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLiveLocation({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to fetch your location. Using default.");
        setIsLoading(false);
      }
    );
  }, []);

  // Fetch accidents using fetch API
  useEffect(() => {
    const fetchAccidents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:2000/api/accident/accidents');
        if (response.ok) {
          const data = await response.json();
          const accidentData = data.accidents || [];
          setAccidents(
            accidentData.map((accident) => ({
              ...accident,
              coordinates: accident.coordinates || user.defaultLocation,
              distance: calculateDistance(
                liveLocation,
                accident.coordinates || user.defaultLocation
              ),
            }))
          );
        } else {
          throw new Error('Failed to fetch accidents');
        }
      } catch (error) {
        console.error("Error fetching accidents:", error);
        toast.error("Failed to fetch accidents.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccidents();
  }, [liveLocation]);

  // Fetch nearest doctors
  const fetchNearestDoctors = async (accidentLocation) => {
    try {
      const response = await fetch('http://localhost:2000/api/doctors');
      if (response.ok) {
        const doctors = await response.json();
        const nearbyDoctors = doctors
          .map((doctor) => {
            const doctorLocation =
              doctor.clinicDetails?.[0]?.coordinates || user.defaultLocation;
            const distance = calculateDistance(accidentLocation, doctorLocation);
            return { ...doctor, distance };
          })
          .filter((doctor) => doctor.distance < 5)
          .sort((a, b) => a.distance - b.distance);
        setNearestDoctors(nearbyDoctors);
        if (nearbyDoctors.length > 0) {
          notifyDoctors(nearbyDoctors, accidentLocation);
        }
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to fetch nearby doctors.");
    }
  };

  const notifyDoctors = (doctors, accidentLocation) => {
    doctors.forEach((doctor) =>
      console.log(
        `Notifying Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}) at ${doctor.distance.toFixed(2)} km`
      )
    );
    toast.success(`Notified ${doctors.length} nearby doctor(s)!`);
  };

  const handleReportAccident = async (e) => {
    e.preventDefault();

    if (!newAccident.location || !newAccident.description || !newAccident.city || !newAccident.state) {
      toast.error('Location, description, city, and state are required!');
      return;
    }

    const accidentData = {
      location: pinnedLocationDetails.displayName || newAccident.location,
      description: newAccident.description,
      city: newAccident.city === "Other" ? newAccident.manualCity : newAccident.city,
      state: newAccident.state,
      status: 'Pending', // Default status as per AccidentDetection
      coordinates: newAccident.pinnedLocation || liveLocation, // Optional for frontend map
    };

    try {
      const response = await fetch('http://localhost:2000/api/accident/accidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accidentData),
      });

      if (response.ok) {
        const newAccidentData = await response.json();
        setAccidents([
          ...accidents,
          { ...newAccidentData, distance: calculateDistance(liveLocation, newAccidentData.coordinates || user.defaultLocation) },
        ]);
        setNewAccident({
          location: "",
          district: "",
          state: "Odisha",
          description: "",
          pinnedLocation: null,
          manualDistrict: "",
          manualCity: "",
          alertType: "Normal",
          city: "",
        });
        setIsReporting(true);
        fetchNearestDoctors(accidentData.coordinates);
        toast.success("Accident reported successfully!");
        setIsLocationPickerOpen(false);
        setPinnedLocation(null);
      } else {
        const errorText = await response.text();
        toast.error(`Error: ${errorText}`);
      }
    } catch (error) {
      console.error("Error reporting accident:", error);
      toast.error("Error reporting accident. Please try again.");
    }
  };

  const toggleBloodRequest = () => {
    setBloodRequired(!bloodRequired);
    if (!bloodRequired) {
      toast.success(`Blood request for ${user.bloodGroup} sent!`);
    } else {
      toast.info("Blood request canceled.");
    }
  };

  const handleLocationPin = async (latlng) => {
    const details = await fetchLocationDetails(latlng.lat, latlng.lng);
    setPinnedLocation(latlng);
    setPinnedLocationDetails(details);
    setNewAccident({
      ...newAccident,
      pinnedLocation: latlng,
      location: details.displayName,
      city: details.city || newAccident.city,
      state: details.state || newAccident.state,
      district: details.district || newAccident.district,
    });
  };

  const handleDistrictChange = (selectedOption) => {
    setNewAccident({
      ...newAccident,
      district: selectedOption ? selectedOption.value : "",
      manualDistrict: "",
      city: "",
      manualCity: "",
    });
    setManualDistrictVisible(selectedOption?.value === "Other");
    setManualCityVisible(false);
  };

  const handleCityChange = (selectedOption) => {
    setNewAccident({
      ...newAccident,
      city: selectedOption ? selectedOption.value : "",
      manualCity: "",
    });
    setManualCityVisible(selectedOption?.value === "Other");
  };

  const districtCityOptions =
    newAccident.district && newAccident.district !== "Other"
      ? districtCities[newAccident.district]?.map((city) => ({
          value: city,
          label: city,
        })) || []
      : [{ value: "Other", label: "Other (Enter Manually)" }];

  const handleEmergencyAlertToggle = () => {
    setIsEmergencyAlertEnabled(!isEmergencyAlertEnabled);
    if (!isEmergencyAlertEnabled) {
      toast.success("Emergency Alert Enabled!");
    } else {
      toast.info("Emergency Alert Disabled.");
    }
  };

  const hexagonCenter = liveLocation;
  const hexagonPoints = createHexagon(hexagonCenter, 5);

  return (
    <div className={styles.stylishContainer}>
      <div className={styles.stylishContent}>
        <h2 className={styles.sectionTitle}>Accident Overview</h2>

        {/* Map Display */}
        <div className={styles.mapContainer}>
          <MapContainer
            center={liveLocation}
            zoom={13}
            zoomControl={false}
            style={{ height: "400px", width: "100%", borderRadius: "10px" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polygon
              positions={hexagonPoints}
              pathOptions={{ color: "red", fillColor: "rgba(255, 0, 0, 0.2)", fillOpacity: 0.2, weight: 2 }}
            />
            <CustomMarker position={liveLocation} alertType="Normal">
              <Popup>
                Your Location: Lat {liveLocation.lat.toFixed(4)}, Lng {liveLocation.lng.toFixed(4)}
              </Popup>
            </CustomMarker>
            {accidents.map((accident) => (
              <CustomMarker
                key={accident._id}
                position={accident.coordinates || user.defaultLocation}
                alertType={accident.alertType || "Normal"}
              >
                <Popup>
                  <strong>
                    {accident.location}, {accident.city}, {accident.state}
                  </strong>
                  <br />
                  Time: {convertToIST(accident.time)}
                  <br />
                  Status: {accident.status || "Pending"}
                  <br />
                  Distance: {accident.distance.toFixed(2)} km
                  <br />
                  {accident.description}
                </Popup>
              </CustomMarker>
            ))}
          </MapContainer>
        </div>

        {/* Accident List */}
        <h2 className={styles.sectionTitle}>Recent Accidents (Within 10km)</h2>
        {isLoading ? (
          <div className={styles.loading}>Loading accidents...</div>
        ) : (
          <div className={styles.accidentList}>
            {accidents
              .filter((accident) => accident.distance < 10)
              .sort((a, b) => a.distance - b.distance)
              .map((accident) => (
                <div key={accident._id} className={styles.accidentItem}>
                  <p>
                    <ClockIcon className={styles.icon} /> {convertToIST(accident.time)}
                  </p>
                  <p>
                    <LocationIcon className={styles.icon} /> {accident.location}, {accident.city}, {accident.state}
                  </p>
                  <p>
                    <WarningIcon className={styles.icon} /> {accident.status || "Pending"} - {accident.distance.toFixed(2)} km away
                  </p>
                  {accident.description && (
                    <p className={styles.accidentDescription}>{accident.description}</p>
                  )}
                </div>
              ))}
            {accidents.filter((accident) => accident.distance < 10).length === 0 && (
              <p>No accidents within 10km.</p>
            )}
          </div>
        )}

        {/* Emergency Actions */}
        {isReporting && (
          <div className={styles.emergencyNotification}>
            <h3 className={styles.notificationTitle}>
              <WarningIcon className={styles.warningIcon} /> Accident Reported - Emergency Actions
            </h3>
            <p>
              <PhoneIcon className={styles.icon} /> Emergency Call Options:
              {["999", "Police", "Ambulance", ...user.emergencyContacts].map((option, index) => (
                <button
                  key={index}
                  className={styles.emergencyCallButton}
                  onClick={() => console.log(`Calling ${option}...`)}
                >
                  {option.includes("+91") ? `Family #${index - 2}` : option}
                </button>
              ))}
            </p>
            {nearestDoctors.length > 0 && (
              <div>
                <p>
                  <WarningIcon className={styles.icon} /> Nearest Doctors Notified:
                </p>
                {nearestDoctors.map((doctor) => (
                  <p key={doctor._id}>
                    Dr. {doctor.firstName} {doctor.lastName} ({doctor.specialization}) - {doctor.distance.toFixed(2)} km
                  </p>
                ))}
              </div>
            )}
            <div className={styles.bloodRequest}>
              <p>
                <BloodIcon className={styles.icon} /> Blood Required?
              </p>
              <button
                className={`${styles.actionButton} ${bloodRequired ? styles.active : ""}`}
                onClick={toggleBloodRequest}
              >
                {bloodRequired ? "Yes (Request Sent)" : "No"}
              </button>
              {bloodRequired && (
                <p className={styles.bloodMessage}>
                  URGENT! Needs {user.bloodGroup} at nearest hospital.
                </p>
              )}
            </div>
            <button className={styles.actionButton} onClick={() => setIsReporting(false)}>
              Close Emergency Actions
            </button>
          </div>
        )}

        {/* Report New Accident */}
        <h2 className={styles.sectionTitle}>Report New Accident</h2>
        <form className={styles.accidentForm} onSubmit={handleReportAccident}>
          <div className={styles.locationField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <input
              type="text"
              placeholder="Pin accident location on map"
              value={pinnedLocationDetails.displayName || newAccident.location}
              onChange={(e) => setNewAccident({ ...newAccident, location: e.target.value })}
              className={styles.input}
              required
            />
            <button
              className={styles.pinButton}
              onClick={() => setIsLocationPickerOpen(true)}
              type="button"
            >
              Pin Location
            </button>
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={[{ value: "Odisha", label: "Odisha" }]}
              value={newAccident.state}
              onChange={(selectedOption) =>
                setNewAccident({ ...newAccident, state: selectedOption ? selectedOption.value : "" })
              }
              placeholder="State"
              className={styles.input}
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={odishaDistricts}
              value={newAccident.district}
              onChange={handleDistrictChange}
              placeholder="Select District"
              className={styles.input}
            />
          </div>
          {manualDistrictVisible && (
            <div className={styles.inputField}>
              <input
                type="text"
                placeholder="Enter district manually"
                value={newAccident.manualDistrict}
                onChange={(e) =>
                  setNewAccident({ ...newAccident, manualDistrict: e.target.value, district: "Other" })
                }
                className={styles.input}
              />
            </div>
          )}
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <LocationIcon />
            </div>
            <PortalSelect
              options={districtCityOptions}
              value={newAccident.city}
              onChange={handleCityChange}
              placeholder="Select City"
              className={styles.input}
            />
          </div>
          {manualCityVisible && (
            <div className={styles.inputField}>
              <input
                type="text"
                placeholder="Enter city manually"
                value={newAccident.manualCity}
                onChange={(e) =>
                  setNewAccident({ ...newAccident, manualCity: e.target.value, city: "Other" })
                }
                className={styles.input}
              />
            </div>
          )}
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <WarningIcon />
            </div>
            <PortalSelect
              options={alertOptions}
              value={newAccident.alertType}
              onChange={(selected) =>
                setNewAccident({ ...newAccident, alertType: selected ? selected.value : "Normal" })
              }
              placeholder="Select Alert Type"
              className={styles.input}
            />
          </div>
          <div className={styles.inputField}>
            <div className={styles.inputIcon}>
              <WarningIcon />
            </div>
            <textarea
              value={newAccident.description}
              onChange={(e) => setNewAccident({ ...newAccident, description: e.target.value })}
              placeholder="Describe the accident"
              className={styles.input}
              rows="3"
              required
            />
          </div>
          <button type="submit" className={styles.actionButton}>
            Report Accident
          </button>
        </form>

        {/* Emergency Settings */}
        <h2 className={styles.sectionTitle}>Emergency Settings</h2>
        <button className={styles.actionButton} onClick={handleEmergencyAlertToggle}>
          <NotificationIcon className={styles.buttonIcon} />
          {isEmergencyAlertEnabled ? "Disable Emergency Alert" : "Enable Emergency Alert"}
        </button>

        {/* Location Picker Modal */}
        {isLocationPickerOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.stylishModalContent}>
              <h3 className={styles.modalTitle}>Pin Accident Location</h3>
              <MapContainer
                center={liveLocation}
                zoom={13}
                zoomControl={false}
                style={{ height: "300px", width: "100%", borderRadius: "15px" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationPicker onLocationSelect={handleLocationPin} initialLocation={liveLocation} />
              </MapContainer>
              <div className={styles.modalButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() => setIsLocationPickerOpen(false)}
                >
                  OK
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setIsLocationPickerOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default AccidentAlert;