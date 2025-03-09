import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Stethoscope, ChevronRight, Star } from "lucide-react";
import styles from "../BloodTest/BloodTest.module.css";
import html2pdf from "html2pdf.js";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";
import logo from "../../../assets/SwasthyaSetuLogo.png";

// Simulated doctor data
const mockDoctors = [
  { id: 1, name: "Dr. R K Sharma", specialty: "Cardiologist", experience: "10 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 2, name: "Dr. P K Mishra", specialty: "Dermatologist", experience: "8 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.5, availableNow: false, nextSlot: "Tomorrow, 10 AM", lat: 20.354, lng: 85.822 },
  { id: 3, name: "Dr. A R Ray", specialty: "Neurologist", experience: "15 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.334, lng: 85.810 },
  { id: 4, name: "Dr. S Jena", specialty: "Orthopedist", experience: "12 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.7, availableNow: false, nextSlot: "Tomorrow, 2 PM", lat: 20.291, lng: 85.845 },
  { id: 5, name: "Dr. M Das", specialty: "Pediatrician", experience: "7 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.324, lng: 85.817 },
  { id: 6, name: "Dr. N Sahoo", specialty: "Gastroenterologist", experience: "20 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.260, lng: 85.839 },
  { id: 7, name: "Dr. K Behera", specialty: "ENT Specialist", experience: "9 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.4, availableNow: false, nextSlot: "Tomorrow, 11 AM", lat: 20.299, lng: 85.824 },
  { id: 8, name: "Dr. T Mohanty", specialty: "Oncologist", experience: "14 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 9, name: "Dr. L Panda", specialty: "Gynecologist", experience: "11 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.7, availableNow: false, nextSlot: "Tomorrow, 3 PM", lat: 20.354, lng: 85.822 },
  { id: 10, name: "Dr. B Swain", specialty: "Urologist", experience: "13 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.334, lng: 85.810 },
  { id: 11, name: "Dr. G Patra", specialty: "Psychiatrist", experience: "6 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.5, availableNow: true, lat: 20.291, lng: 85.845 },
  { id: 12, name: "Dr. H Nayak", specialty: "Endocrinologist", experience: "18 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.8, availableNow: false, nextSlot: "Tomorrow, 9 AM", lat: 20.324, lng: 85.817 },
  { id: 13, name: "Dr. J Rout", specialty: "Pulmonologist", experience: "16 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.260, lng: 85.839 },
  { id: 14, name: "Dr. D Sahu", specialty: "Nephrologist", experience: "10 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.6, availableNow: false, nextSlot: "Tomorrow, 1 PM", lat: 20.299, lng: 85.824 },
  { id: 15, name: "Dr. R Tripathy", specialty: "Rheumatologist", experience: "12 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.7, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 16, name: "Dr. S Mohapatra", specialty: "Cardiologist", experience: "9 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.5, availableNow: true, lat: 20.354, lng: 85.822 },
  { id: 17, name: "Dr. A Das", specialty: "Dermatologist", experience: "14 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.8, availableNow: false, nextSlot: "Tomorrow, 12 PM", lat: 20.334, lng: 85.810 },
  { id: 18, name: "Dr. P Senapati", specialty: "Neurologist", experience: "11 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.291, lng: 85.845 },
  { id: 19, name: "Dr. K Padhi", specialty: "Orthopedist", experience: "17 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 4 PM", lat: 20.324, lng: 85.817 },
  { id: 20, name: "Dr. M Panda", specialty: "Pediatrician", experience: "8 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.260, lng: 85.839 },
  { id: 21, name: "Dr. N Mohanty", specialty: "ENT Specialist", experience: "13 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.8, availableNow: true, lat: 20.299, lng: 85.824 },
  { id: 22, name: "Dr. T Sahoo", specialty: "Oncologist", experience: "15 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 10 AM", lat: 20.333, lng: 85.821 },
  { id: 23, name: "Dr. L Behera", specialty: "Gynecologist", experience: "10 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.354, lng: 85.822 },
  { id: 24, name: "Dr. B Ray", specialty: "Urologist", experience: "12 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.8, availableNow: false, nextSlot: "Tomorrow, 2 PM", lat: 20.334, lng: 85.810 },
  { id: 25, name: "Dr. G Mishra", specialty: "Psychiatrist", experience: "9 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.291, lng: 85.845 },
  { id: 26, name: "Dr. H Das", specialty: "Endocrinologist", experience: "14 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.324, lng: 85.817 },
  { id: 27, name: "Dr. J Sahu", specialty: "Pulmonologist", experience: "11 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.7, availableNow: false, nextSlot: "Tomorrow, 11 AM", lat: 20.260, lng: 85.839 },
  { id: 28, name: "Dr. D Patra", specialty: "Nephrologist", experience: "16 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.8, availableNow: true, lat: 20.299, lng: 85.824 },
  { id: 29, name: "Dr. R Nayak", specialty: "Rheumatologist", experience: "13 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 3 PM", lat: 20.333, lng: 85.821 },
  { id: 30, name: "Dr. S Tripathy", specialty: "Cardiologist", experience: "8 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.354, lng: 85.822 },
  { id: 31, name: "Dr. A Senapati", specialty: "Dermatologist", experience: "12 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.334, lng: 85.810 },
  { id: 32, name: "Dr. P Padhi", specialty: "Neurologist", experience: "15 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 9 AM", lat: 20.291, lng: 85.845 },
  { id: 33, name: "Dr. K Das", specialty: "Orthopedist", experience: "10 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.8, availableNow: true, lat: 20.324, lng: 85.817 },
  { id: 34, name: "Dr. M Sahoo", specialty: "Pediatrician", experience: "9 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.6, availableNow: false, nextSlot: "Tomorrow, 1 PM", lat: 20.260, lng: 85.839 },
  { id: 35, name: "Dr. N Panda", specialty: "ENT Specialist", experience: "14 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.299, lng: 85.824 },
  { id: 36, name: "Dr. T Behera", specialty: "Oncologist", experience: "11 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 37, name: "Dr. L Mohanty", specialty: "Gynecologist", experience: "13 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 10 AM", lat: 20.354, lng: 85.822 },
  { id: 38, name: "Dr. B Jena", specialty: "Urologist", experience: "16 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.334, lng: 85.810 },
  { id: 39, name: "Dr. G Swain", specialty: "Psychiatrist", experience: "10 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.6, availableNow: false, nextSlot: "Tomorrow, 2 PM", lat: 20.291, lng: 85.845 },
  { id: 40, name: "Dr. H Patra", specialty: "Endocrinologist", experience: "12 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.8, availableNow: true, lat: 20.324, lng: 85.817 },
  { id: 41, name: "Dr. J Mohapatra", specialty: "Pulmonologist", experience: "15 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.260, lng: 85.839 },
  { id: 42, name: "Dr. D Nayak", specialty: "Nephrologist", experience: "9 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.7, availableNow: false, nextSlot: "Tomorrow, 11 AM", lat: 20.299, lng: 85.824 },
  { id: 43, name: "Dr. R Sahu", specialty: "Rheumatologist", experience: "14 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: true, lat: 20.333, lng: 85.821 },
  { id: 44, name: "Dr. S Das", specialty: "Cardiologist", experience: "11 years", hospital: "KIMS Hospital", address: "Patia, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.354, lng: 85.822 },
  { id: 45, name: "Dr. A Panda", specialty: "Dermatologist", experience: "13 years", hospital: "AIIMS Bhubaneswar", address: "Infocity, Bhubaneswar", rating: 4.9, availableNow: false, nextSlot: "Tomorrow, 3 PM", lat: 20.334, lng: 85.810 },
  { id: 46, name: "Dr. P Ray", specialty: "Neurologist", experience: "10 years", hospital: "Sparsh Hospital", address: "Saheed Nagar, Bhubaneswar", rating: 4.7, availableNow: true, lat: 20.291, lng: 85.845 },
  { id: 47, name: "Dr. K Senapati", specialty: "Orthopedist", experience: "12 years", hospital: "Care Hospital", address: "Chandrasekharpur, Bhubaneswar", rating: 4.8, availableNow: false, nextSlot: "Tomorrow, 9 AM", lat: 20.324, lng: 85.817 },
  { id: 48, name: "Dr. M Tripathy", specialty: "Pediatrician", experience: "15 years", hospital: "SUM Hospital", address: "Kalinga Nagar, Bhubaneswar", rating: 4.9, availableNow: true, lat: 20.260, lng: 85.839 },
  { id: 49, name: "Dr. N Padhi", specialty: "ENT Specialist", experience: "8 years", hospital: "AMRI Hospital", address: "Jaydev Vihar, Bhubaneswar", rating: 4.6, availableNow: true, lat: 20.299, lng: 85.824 },
  { id: 50, name: "Dr. T Jena", specialty: "Oncologist", experience: "14 years", hospital: "Apollo Hospital", address: "Bhubaneswar, Odisha", rating: 4.8, availableNow: false, nextSlot: "Tomorrow, 1 PM", lat: 20.333, lng: 85.821 },
];



// Leaflet icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DoctorIcon = (size) => L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: size,
  iconAnchor: [size[0] / 2, size[1]],
  popupAnchor: [0, -size[1]],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: size,
});

const UserIcon = L.divIcon({
  className: "user-marker",
  html: '<div style="background-color: red; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [25, 25],
  iconAnchor: [12.5, 12.5],
  popupAnchor: [0, -10],
});

const MapClickHandler = ({ setPinLocation, setLatitude, setLongitude, setAddress }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPinLocation([lat, lng]);
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(response => response.json())
        .then(data => setAddress(data.display_name || "Unknown location"))
        .catch(() => setAddress("Unable to fetch address"));
    },
  });
  return null;
};

const Doctors = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management
  const [doctors, setDoctors] = useState(mockDoctors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isBookingPopupOpen, setIsBookingPopupOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState(null);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pinLocation, setPinLocation] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [bookingDetailsList, setBookingDetailsList] = useState([]);
  const barcodeRefs = useRef({});

  // Specialty and availability options
  const specialties = [
    { value: "Cardiologist", label: "Cardiologist" },
    { value: "Dermatologist", label: "Dermatologist" },
    { value: "Neurologist", label: "Neurologist" },
    // Add more specialties as needed
  ];

  const availabilityOptions = [
    { value: "availableNow", label: "Available Now" },
    { value: "nextSlot", label: "Next Available Slot" },
  ];

  const timeSlots = [
    { value: "morning", label: "9:00 AM - 12:00 PM" },
    { value: "afternoon", label: "1:00 PM - 4:00 PM" },
    { value: "evening", label: "5:00 PM - 8:00 PM" },
  ];

  const virtualMeetingUrl = "https://alekhakumarswain.github.io/OnlineAppointment-/#bhfhvy";

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        err => console.warn("Failed to get user location"),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Load booking details from localStorage on mount
  useEffect(() => {
    const storedAppointments = JSON.parse(localStorage.getItem("doctorAppointments")) || [];
    setBookingDetailsList(storedAppointments);
  }, []);

  // Generate barcodes for all booking slips
  useEffect(() => {
    bookingDetailsList.forEach(booking => {
      const ref = barcodeRefs.current[booking.bookingId];
      if (ref) {
        JsBarcode(ref, booking.bookingId, {
          format: "CODE128",
          displayValue: true,
          fontSize: 14,
          width: 2,
          height: 40,
        });
      }
    });
  }, [bookingDetailsList]);

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedSpecialty || doctor.specialty === selectedSpecialty.value) &&
    (!availabilityFilter || 
      (availabilityFilter.value === "availableNow" && doctor.availableNow) ||
      (availabilityFilter.value === "nextSlot" && !doctor.availableNow))
  );

  // Handle appointment booking
  const handleBookAppointment = () => {
    if (!userName || !email || !appointmentType || !appointmentDate || !appointmentTime || (appointmentType.value === "inPerson" && !pinLocation)) {
      toast.error("Please fill in all required fields!");
      return;
    }

    const bookingData = {
      patientName: userName,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      hospitalName: selectedDoctor.hospital,
      appointmentDate,
      appointmentTime: appointmentTime.label,
      appointmentType: appointmentType.label,
      bookingId: `DOC${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      patientId: `PAT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      email,
      address: appointmentType.value === "inPerson" ? address : "N/A",
      latitude: appointmentType.value === "inPerson" ? latitude : "N/A",
      longitude: appointmentType.value === "inPerson" ? longitude : "N/A",
      virtualMeetingUrl: appointmentType.value === "video" ? virtualMeetingUrl : null,
    };

    // Load existing appointments from localStorage
    const existingAppointments = JSON.parse(localStorage.getItem("doctorAppointments")) || [];
    const updatedAppointments = [...existingAppointments, bookingData];
    
    // Save to localStorage
    localStorage.setItem("doctorAppointments", JSON.stringify(updatedAppointments));
    setBookingDetailsList(updatedAppointments);

    toast.success(`Appointment booked with ${selectedDoctor.name}!`);
    setIsBookingPopupOpen(false);

    // Reset form fields
    setUserName("");
    setEmail("");
    setAppointmentType(null);
    setAppointmentDate("");
    setAppointmentTime(null);
    setAddress("");
    setPinLocation(null);
    setLatitude("");
    setLongitude("");
  };

  const handleDownloadPDF = (bookingDetails) => {
    if (!bookingDetails) return;

    const qrCanvas = document.getElementById(`qrCodeCanvas-${bookingDetails.bookingId}`);
    const qrCodeDataUrl = qrCanvas.toDataURL("image/png");
    const barcodeCanvas = document.getElementById(`barcode-${bookingDetails.bookingId}`);
    const barcodeDataUrl = barcodeCanvas.toDataURL("image/png");

    const currentDate = new Date().toLocaleDateString();
    const qrCodePayload = bookingDetails.appointmentType === "Video Consultation"
      ? `${bookingDetails.virtualMeetingUrl}`
      : `
Patient Name: ${bookingDetails.patientName}
Booking ID: ${bookingDetails.bookingId}
Patient ID: ${bookingDetails.patientId}
Doctor: ${bookingDetails.doctorName}
Hospital: ${bookingDetails.hospitalName}
Appointment Date: ${bookingDetails.appointmentDate}
Appointment Time: ${bookingDetails.appointmentTime}
      `.trim();

    const wrapper = document.createElement("div");
    wrapper.style.padding = "20px";
    wrapper.style.fontFamily = "'Arial', sans-serif";
    wrapper.style.background = "#f5f7fa";
    wrapper.style.color = "#000000";
    wrapper.style.lineHeight = "1.6";
    wrapper.innerHTML = `
      <div style="text-align: center; background: linear-gradient(90deg, #2ecc71, #27ae60); padding: 15px; border-radius: 15px 15px 0 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <img src="${logo}" alt="Swasthya Setu Logo" style="width: 90px; height: auto; margin-right: 15px;" />
        <h1 style="font-size: 32px; font-weight: 700; color: #fff; margin: 0; display: inline; font-family: 'Playfair Display', serif;">Swasthya Setu</h1>
        <p style="font-size: 16px; color: #fff; margin: 5px 0; font-family: 'Open Sans', sans-serif;">LogicLoom</p>
        <p style="font-size: 14px; color: #fff; font-family: 'Open Sans', sans-serif;">Booking ID: ${bookingDetails.bookingId}</p>
      </div>
      <div style="background: #ffffff; padding: 25px; border-radius: 0 0 15px 15px; box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px; padding-right: 20px;">
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Patient Name:</strong> ${bookingDetails.patientName}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Booking ID:</strong> ${bookingDetails.bookingId}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Patient ID:</strong> ${bookingDetails.patientId}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Email:</strong> ${bookingDetails.email}</p>
            <p style="font-size: 16px; margin: 8px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Date of Issue:</strong> ${currentDate}</p>
          </div>
          <div style="text-align: center; flex: 0 0 120px;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px; border: 2px solid #e0e0e0; border-radius: 8px;" />
            <p style="font-size: 12px; color: #666666; margin-top: 8px; font-family: 'Open Sans', sans-serif;">Scan to view ${bookingDetails.appointmentType === "Video Consultation" ? "meeting link" : "appointment details"}</p>
          </div>
        </div>
        <hr style="border: 2px solid #000000; margin: 20px 0;" />
        <h2 style="font-size: 24px; font-weight: 700; color: #2c3e50; text-align: center; margin-bottom: 20px; font-family: 'Playfair Display', serif;">DOCTOR APPOINTMENT SLIP</h2>
        <div style="margin-bottom: 20px;">
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Doctor:</strong> ${bookingDetails.doctorName}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Specialty:</strong> ${bookingDetails.specialty}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Hospital:</strong> ${bookingDetails.hospitalName}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Appointment Date:</strong> ${bookingDetails.appointmentDate}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Appointment Time:</strong> ${bookingDetails.appointmentTime}</p>
          <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Appointment Type:</strong> ${bookingDetails.appointmentType}</p>
          ${bookingDetails.appointmentType === "In-Person Consultation" ? `
            <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Address:</strong> ${bookingDetails.address}</p>
            <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Latitude:</strong> ${bookingDetails.latitude}</p>
            <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Longitude:</strong> ${bookingDetails.longitude}</p>
          ` : ""}
          ${bookingDetails.appointmentType === "Video Consultation" ? `
            <p style="font-size: 18px; margin: 10px 0; font-family: 'Open Sans', sans-serif;"><strong style="color: #2c3e50;">Virtual Meeting URL:</strong> <a href="${bookingDetails.virtualMeetingUrl}" target="_blank" style="color: #27ae60;">${bookingDetails.virtualMeetingUrl}</a></p>
          ` : ""}
        </div>
        <p style="font-size: 14px; color: #666666; margin-top: 15px; font-family: 'Open Sans', sans-serif;">
          <strong style="color: #2c3e50;">Instructions:</strong> Please arrive 15 minutes early with this slip and any relevant medical records. For cancellation or rescheduling, contact the hospital at least 24 hours prior.${bookingDetails.appointmentType === "Video Consultation" ? " For virtual appointment, join using the provided link at the scheduled time." : ""}
        </p>
        <div style="text-align: center; margin-top: 25px;">
          <img src="${barcodeDataUrl}" alt="Barcode" style="width: 180px; height: auto; border: 2px solid #e0e0e0; border-radius: 8px;" />
          <p style="font-size: 12px; color: #666666; margin-top: 8px; font-family: 'Open Sans', sans-serif;">Booking ID: ${bookingDetails.bookingId}</p>
        </div>
        <p style="font-size: 12px; color: #666666; text-align: center; margin-top: 25px; font-family: 'Open Sans', sans-serif;">
          Generated by Swasthya Setu on ${currentDate} | Confidential Appointment Slip
        </p>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `${bookingDetails.patientName}_Doctor_Appointment_${bookingDetails.bookingId}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    document.body.appendChild(wrapper);
    html2pdf()
      .from(wrapper)
      .set(opt)
      .save()
      .then(() => {
        document.body.removeChild(wrapper);
      })
      .catch((err) => console.error("PDF generation failed:", err));
  };

  const selectStyles = {
    container: base => ({ ...base, width: "100%", zIndex: 1050 }),
    control: base => ({ ...base, borderRadius: "10px", border: "1px solid #ced4da", boxShadow: "none" }),
    menu: base => ({ ...base, zIndex: 1050, borderRadius: "10px" }),
    option: base => ({ ...base, fontFamily: "Georgia, serif", color: "#2c3e50" }),
    singleValue: base => ({ ...base, color: "#2c3e50", fontFamily: "Georgia, serif" }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>Doctor Consultation</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-4">
        <div className="row">
          <div className="col-md-4 mb-2">
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ borderRadius: "10px", padding: "10px" }}
            />
          </div>
          <div className="col-md-4 mb-2">
            <Select
              options={specialties}
              value={selectedSpecialty}
              onChange={setSelectedSpecialty}
              placeholder="Filter by specialty..."
              styles={selectStyles}
              isClearable
            />
          </div>
          <div className="col-md-4 mb-2">
            <Select
              options={availabilityOptions}
              value={availabilityFilter}
              onChange={setAvailabilityFilter}
              placeholder="Filter by availability..."
              styles={selectStyles}
              isClearable
            />
          </div>
        </div>
      </div>

      {/* Doctors List */}
      <div className={styles.labsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Available Doctors</h2>
          <button className={styles.seeMoreBtn} onClick={() => navigate("/medicine")}>
            Go to Medicine <ChevronRight size={16} />
          </button>
        </div>
        <div className={styles.labsGrid}>
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className={styles.labCard}
                onClick={() => {
                  setSelectedDoctor(doctor);
                  setIsBookingPopupOpen(true);
                }}
              >
                <div className={styles.labAvatar}>
                  <Stethoscope size={24} />
                </div>
                <h3 className={styles.labName}>{doctor.name}</h3>
                <p className={styles.labDistance}>{doctor.specialty} - {doctor.experience}</p>
                <p style={{ fontSize: "0.9rem", color: "#2c3e50" }}>{doctor.hospital}, {doctor.address}</p>
                <div className={styles.ratingContainer}>
                  <Star className={styles.starIcon} />
                  <span className={styles.rating}>{doctor.rating}</span>
                </div>
                <p style={{ color: doctor.availableNow ? "#27ae60" : "#e74c3c", fontSize: "0.8rem" }}>
                  {doctor.availableNow ? "Available Now" : `Next: ${doctor.nextSlot}`}
                </p>
              </div>
            ))
          ) : (
            <p>No doctors found matching your criteria.</p>
          )}
        </div>
      </div>

      {/* Booking Slips Section */}
      {bookingDetailsList.length > 0 && (
        <div className={styles.labsSection}>
          <h2 className={styles.sectionTitle}>Your Appointments</h2>
          {bookingDetailsList.map((bookingDetails, index) => (
            <div key={index} className={styles.slipContainer}>
              <div className={styles.section}>
                <div className={styles.slipDetails}>
                  <div className={styles.logoContainer}>
                    <img src={logo} alt="Swasthya Setu Logo" className={styles.logo} />
                    <h3 className={styles.brandTitle}>Swasthya Setu</h3>
                  </div>
                  <div className={styles.patientInfo}>
                    <div className={styles.patientDetails}>
                      <p className={styles.detailItem}><strong>Patient Name:</strong> {bookingDetails.patientName}</p>
                      <p className={styles.detailItem}><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
                      <p className={styles.detailItem}><strong>Patient ID:</strong> {bookingDetails.patientId}</p>
                      <p className={styles.detailItem}><strong>Email:</strong> {bookingDetails.email}</p>
                      <p className={styles.detailItem}><strong>Date of Issue:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className={styles.qrCodeContainer}>
                      <QRCodeCanvas
                        id={`qrCodeCanvas-${bookingDetails.bookingId}`}
                        value={
                          bookingDetails.appointmentType === "Video Consultation"
                            ? `${bookingDetails.virtualMeetingUrl}`
                            : `
Patient Name: ${bookingDetails.patientName}
Booking ID: ${bookingDetails.bookingId}
Patient ID: ${bookingDetails.patientId}
Doctor: ${bookingDetails.doctorName}
Hospital: ${bookingDetails.hospitalName}
Appointment Date: ${bookingDetails.appointmentDate}
Appointment Time: ${bookingDetails.appointmentTime}
                            `.trim()
                        }
                        size={120}
                        level="H"
                      />
                      <p className={styles.qrCodeText}>
                        Scan to view {bookingDetails.appointmentType === "Video Consultation" ? "meeting link" : "appointment details"}
                      </p>
                    </div>
                  </div>
                  <hr className={styles.divider} />
                  <h3 className={styles.appointmentTitle}>Doctor Appointment Slip</h3>
                  <div className={styles.appointmentDetails}>
                    <p className={styles.detailItem}><strong>Doctor:</strong> {bookingDetails.doctorName}</p>
                    <p className={styles.detailItem}><strong>Specialty:</strong> ${bookingDetails.specialty}</p>
                    <p className={styles.detailItem}><strong>Hospital:</strong> ${bookingDetails.hospitalName}</p>
                    <p className={styles.detailItem}><strong>Appointment Date:</strong> ${bookingDetails.appointmentDate}</p>
                    <p className={styles.detailItem}><strong>Appointment Time:</strong> ${bookingDetails.appointmentTime}</p>
                    <p className={styles.detailItem}><strong>Appointment Type:</strong> ${bookingDetails.appointmentType}</p>
                    {bookingDetails.appointmentType === "In-Person Consultation" && (
                      <>
                        <p className={styles.detailItem}><strong>Address:</strong> ${bookingDetails.address}</p>
                        <p className={styles.detailItem}><strong>Latitude:</strong> ${bookingDetails.latitude}</p>
                        <p className={styles.detailItem}><strong>Longitude:</strong> ${bookingDetails.longitude}</p>
                      </>
                    )}
                    {bookingDetails.appointmentType === "Video Consultation" && (
                      <p className={styles.detailItem}>
                        <strong>Virtual Meeting URL:</strong> <a href={bookingDetails.virtualMeetingUrl} target="_blank" rel="noopener noreferrer">{bookingDetails.virtualMeetingUrl}</a>
                      </p>
                    )}
                    <p className={styles.instructions}>
                      <strong>Instructions:</strong> Please arrive 15 minutes early with this slip and any relevant medical records. For cancellation or rescheduling, contact the hospital at least 24 hours prior.
                      {bookingDetails.appointmentType === "Video Consultation" && " For virtual appointment, join using the provided link at the scheduled time."}
                    </p>
                  </div>
                  <div className={styles.barcodeContainer}>
                    <canvas
                      id={`barcode-${bookingDetails.bookingId}`}
                      ref={el => (barcodeRefs.current[bookingDetails.bookingId] = el)}
                      className={styles.barcode}
                    />
                    <p className={styles.qrCodeText}>Booking ID: ${bookingDetails.bookingId}</p>
                  </div>
                  <p className={styles.footerText}>
                    Generated by Swasthya Setu on ${new Date().toLocaleDateString()} | Confidential Appointment Slip
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF(bookingDetails)}
                  className={styles.downloadButton}
                >
                  Download Appointment Slip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Popup */}
      {isBookingPopupOpen && (
        <div className="modal show d-block" style={{ background: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "15px", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}>
              <div className="modal-header" style={{ background: "linear-gradient(45deg, #27ae60, #2ecc71)", color: "#fff" }}>
                <h5 className="modal-title" style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
                  Book Appointment with ${selectedDoctor?.name}
                </h5>
                <button type="button" className="btn-close" onClick={() => setIsBookingPopupOpen(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: "20px" }}>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Appointment Type</label>
                  <Select
                    options={[
                      { value: "video", label: "Video Consultation" },
                      { value: "inPerson", label: "In-Person Consultation" },
                    ]}
                    value={appointmentType}
                    onChange={setAppointmentType}
                    placeholder="Choose appointment type..."
                    styles={selectStyles}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="form-control"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Time Slot</label>
                  <Select
                    options={timeSlots}
                    value={appointmentTime}
                    onChange={setAppointmentTime}
                    placeholder="Choose a time slot..."
                    styles={selectStyles}
                  />
                </div>
                {appointmentType?.value === "inPerson" && (
                  <div className="mb-3">
                    <label className="form-label" style={{ color: "#2c3e50", fontFamily: "Montserrat, sans-serif" }}>Your Location</label>
                    <MapContainer
                      center={userLocation || [20.333, 85.821]}
                      zoom={15}
                      style={{ height: "200px", borderRadius: "10px", border: "2px solid #27ae60" }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      {userLocation && <Marker position={userLocation} icon={UserIcon} />}
                      {pinLocation && <Marker position={pinLocation} icon={DoctorIcon([40, 40])} />}
                      <MapClickHandler
                        setPinLocation={setPinLocation}
                        setLatitude={setLatitude}
                        setLongitude={setLongitude}
                        setAddress={setAddress}
                      />
                    </MapContainer>
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Latitude"
                        value={latitude}
                        readOnly
                        className="form-control mb-2"
                        style={{ borderRadius: "10px" }}
                      />
                      <input
                        type="text"
                        placeholder="Longitude"
                        value={longitude}
                        readOnly
                        className="form-control mb-2"
                        style={{ borderRadius: "10px" }}
                      />
                      <input
                        type="text"
                        placeholder="Address"
                        value={address}
                        readOnly
                        className="form-control"
                        style={{ borderRadius: "10px" }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ borderTop: "none" }}>
                <button
                  className="btn"
                  style={{ background: "#27ae60", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={handleBookAppointment}
                >
                  Book Appointment
                </button>
                <button
                  className="btn"
                  style={{ background: "#e74c3c", color: "#fff", borderRadius: "10px", padding: "10px 20px" }}
                  onClick={() => setIsBookingPopupOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Doctors;