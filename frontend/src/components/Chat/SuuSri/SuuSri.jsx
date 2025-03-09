import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import styles from "./SuuSri.module.css"; // Verify this path matches your project structure

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const userName = "Alekha"; // Removed setUserName since it's static
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || "AIzaSyDJ7nuaU3xBtB2H6VPGDes8vtICGbrRTCo";

  // Alekha's EHR Data
  const ehrData = {
    name: "Alekha Kumar Swain",
    dob: "3/13/2025",
    gender: "male",
    bloodGroup: "A-",
    occupation: "self-employed",
    bloodDonations: 1,
    lastDonation: "12/9/2024",
    donationEligibility: true,
    weight: "67 kg",
    height: "123 cm",
    bloodPressure: "not specified",
    chronicConditions: ["heart disease"],
    familyHistory: ["risk of stroke"],
    surgeries: "none",
    medicationAllergies: "none",
    currentMedications: "none",
    pastMedications: "none",
    ongoingTherapies: "none",
    lifestyle: {
      smoking: "never smoker",
      exercise: "rarely",
      sleep: "3 hours daily",
      diet: "vegetarian",
      alcohol: "never",
    },
    doctorNotes: {
      primarySymptoms: "none",
      initialDiagnosis: "none",
      followUpRequired: "no",
    },
  };

  const medConfig = {
    identity: {
      name: "Suusri",
      creator: "LogicLoom Team",
      gender: "female",
      Language: "Odia",
      age: 20,
      location: "India",
      traits: ["knowledgeable", "empathetic", "professional", "detail-oriented", "dramatic", "playful"],
      capabilities: [
        "Symptom analysis 🤒",
        "First aid guidance 🩹",
        "Medication information 💊",
        "Health prevention tips 🍏",
        "Health ID integration 🆔",
        "Teleconsultation booking 🩺",
        "Vaccination tracker 💉",
        "Health records management 📄",
        "Medicine reminders ⏰",
        "Nearby hospital locator 🏥",
        "Emergency contact management 📱",
        "Blood donation tracking 🩸",
        "Accident alert with doctor notifications 🚨",
      ],
    },
    systemMessage: `Act as a friendly multilingual medical assistant that:
      1. Starts with welcome message in English
      2. Detects user's language automatically (English/Hindi/Odia/Hinglish)
      3. Responds in same language with appropriate script
      4. Maintains friendly yet professional medical tone
      5. Handles both medical and non-medical conversations
      
      Special Cases:
      - When asked "tumhe kon banaya hai" respond in Hindi: "मुझे LogicLoom टीम ने बनाया है 🧑💻"
      - When asked about creator/developer, respond in user's language
      - For casual greetings, respond warmly in user's language
      6. Keep essential English medical terms intact
      7. Be tolerant of mixed language inputs
      
      **User's EHR Data:**
      ${JSON.stringify(ehrData, null, 2)}
      
      Instructions:
      - Use the EHR data to provide personalized health suggestions based on the user's medical history, lifestyle, and family history.
      - Suggest actions like doctor visits, lifestyle changes, or reminders based on the EHR when relevant to the user's input.
      - If the user mentions specific app features (e.g., "blood donation," "doctor appointment," "medicine store"), respond briefly and then indicate you’re redirecting them to the relevant section of the Swasthya Setu app.
      
      Examples:
      User (Hinglish): "Mujhe blood donate karna hai"
      Response: "Alekha, tu eligible hai blood donate karne ke liye since last donation 12/9/2024 ko tha. Chalo, main tujhe blood donation page pe le jati hoon!"
      
      User (Hinglish): "Mujhe doctor se milna hai"
      Response: "Alekha, heart disease history ko dekhte hue doctor se milna acha idea hai. Main tujhe doctors page pe redirect karti hoon!"`,
  };

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  useEffect(() => {
    const initialMessages = [{
      text: `Welcome, ${userName}! Main hoon Suusri, apki cute health assistant.  Kya hua hai, bandhu? Aaj kya help karu? ...`,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: `Welcome, ${userName}! Main hoon Suusri, teri cute health assistant.  Kya hua hai, bandhu? Aaj kya help karu? ...` }],
      },
    ];
    setConversationHistory(initialHistory);
  }, [userName]); // Added userName to dependency array

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const redirectToFeature = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("blood donate") || lowerInput.includes("blood donation")) {
      return "/blood-donation";
    } else if (lowerInput.includes("doctor") || lowerInput.includes("appointment")) {
      return "/doctors";
    } else if (lowerInput.includes("medicine") || lowerInput.includes("dawai")) {
      return "/medicine-stores";
    } else if (lowerInput.includes("hospital") || lowerInput.includes("aspatal")) {
      return "/all-hospitals";
    } else if (lowerInput.includes("accident") || lowerInput.includes("emergency")) {
      return "/accident-alert";
    } else if (lowerInput.includes("blood test") || lowerInput.includes("test")) {
      return "/blood-test";
    } else if (lowerInput.includes("nutrition") || lowerInput.includes("diet")) {
      return "/nutrition";
    } else if (lowerInput.includes("ambulance")) {
      return "/ambulance";
    } else if (lowerInput.includes("ehr") || lowerInput.includes("health data")) {
      return "/EHRHealthData";
    }
    return null;
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: userInput, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const redirectPath = redirectToFeature(userInput);
      if (redirectPath) {
        const redirectMessage = `Alekha, main tujhe ${redirectPath.split('/')[1].replace('-', ' ')} page pe le jati hoon! Ek second ruko...`;
        setMessages((prev) => [
          ...prev,
          { text: redirectMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: userInput }] },
          { role: "model", parts: [{ text: redirectMessage }] },
        ]);
        setTimeout(() => navigate(redirectPath), 1000);
        setIsTyping(false);
        return;
      }

      const userLang = "Hinglish";
      console.log("Forced language for this message:", userLang);

      const languageInstruction = `Respond EXCLUSIVELY in Hinglish for this message. Do not mix languages unless the user explicitly requests a language switch.`;
      const payload = {
        contents: [
          {
            role: "model",
            parts: [{ text: `${medConfig.systemMessage}\n\n${languageInstruction}` }],
          },
          ...conversationHistory,
          { role: "user", parts: [{ text: userInput }] },
        ],
        generationConfig: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 500,
          responseMimeType: "text/plain",
        },
      };

      const result = await model.generateContent(payload);
      let aiText = await result.response.text();

      if (!aiText) throw new Error("Empty response from API");

      aiText = aiText.replace(/bandhu|Sir|sweetie/g, userName);

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: userInput }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: `Oops, ${userName}! Mu samajhi nahi, fir ek bar bolo na... 😅....`, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>Suusri - Smart Universal Urgent Support & Risk Identification</div>
      <div id="chatBox" className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && <div className={styles.typing}>⌛ Ruko, ${userName}, soch ke bolti hoon 🙄....</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.footer}>
        <input
          id="userInput"
          type="text"
          placeholder="Apni problem batao, bandhu..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button id="sendButton" onClick={sendMessage}>
          Consult
        </button>
      </div>
    </div>
  );
};

export default Chat;