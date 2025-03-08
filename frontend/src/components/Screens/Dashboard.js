import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplet, 
  AlertTriangle, 
  Stethoscope, 
  TestTube, 
  Pill, 
  Heart, 
  Ambulance, 
  Hospital, 
  Apple, 
  FileText, 
  User,
  Smile 
} from 'lucide-react';
import img1 from "../assets/1.png"; // Blood Donation
import img2 from "../assets/2.png"; // Accident Alert
import styles from './Dashboard.module.css'; // Import CSS Module

function Dashboard() {
  const cardData = [
    {
      title: "Blood Donation",
      description: "Manage blood donation and receiving",
      icon: <Droplet className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/blood-donate-receive",
      img: img1
    },
    {
      title: "Accident Alert",
      description: "Monitor emergency accident alerts",
      icon: <AlertTriangle className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/accident-alert",
      img: img2
    },
    {
      title: "Doctors",
      description: "Find and consult with doctors",
      icon: <Stethoscope className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/doctors"
    },
    {
      title: "Blood Test",
      description: "Schedule and track blood tests",
      icon: <TestTube className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/blood-test"
    },
    {
      title: "Medicine Store",
      description: "Browse medicine stores",
      icon: <Pill className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/medicine-stores"
    },
    {
      title: "EHR Health Data",
      description: "View health records",
      icon: <Heart className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/EHRHealthData"
    },
    {
      title: "Ambulance",
      description: "Request emergency services",
      icon: <Ambulance className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/ambulance"
    },
    {
      title: "Hospitals",
      description: "Explore hospital services",
      icon: <Hospital className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/hospitals"
    },
    {
      title: "Nutrition",
      description: "Access diet plans",
      icon: <Apple className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/nutrition"
    },
    {
      title: "Medical History",
      description: "Review your medical records",
      icon: <FileText className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/medicine-history"
    },
    {
      title: "Profile",
      description: "Manage your account",
      icon: <User className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/profile"
    },
    {
      title: "Welcome",
      description: "Start your journey with us",
      icon: <Smile className={styles.icon} style={{ color: '#1b558b' }} />,
      path: "/welcome"
    }
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Dashboard</h2>
      
      <div className={styles.grid}>
        {cardData.map((card, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                {card.icon}
                <h5 className={styles.cardTitle}>{card.title}</h5>
              </div>
              <p className={styles.cardDescription}>{card.description}</p>
              {card.img && (
                <img 
                  src={card.img} 
                  alt={card.title}
                  className={styles.cardImage}
                />
              )}
              <Link 
                to={card.path}
                className={styles.cardButton}
              >
                Go to {card.title}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
