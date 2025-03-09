import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useNavigate } from "react-router-dom";
import styles from "./SuuSri.module.css";
import Picker from "emoji-picker-react"; // For emoji picker

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const userName = "Alekha";
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || "AIzaSyDJ7nuaU3xBtB2H6VPGDes8vtICGbrRTCo";

  // Speech Recognition and Synthesis Setup
  const recognition = useRef(null);
  const synth = window.speechSynthesis;

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("suusriMessages");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = "en-IN";

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setMessages((prev) => [
          ...prev,
          { text: "Oops, Alekha! Speech samajh nahi aaya, fir se bolo na...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    synth.onvoiceschanged = () => {
      console.log("Voices loaded:", synth.getVoices());
    };
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("suusriMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      text: `Welcome, ${userName}! Main hoon Suusri, apki cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu? ...`,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: `Welcome, ${userName}! Main hoon Suusri, teri cute health assistant. Bol na, kya hua hai, bandhu? Aaj kya help karu? ...` }],
      },
    ];
    setConversationHistory(initialHistory);

    const hindiWelcome = `स्वागत है, ${userName}! मैं हूँ सूसरी, आपकी प्यारी हेल्थ असिस्टेंट। बोलो ना, क्या हुआ है, बंधु? आज क्या मदद करूँ? ...`;
    speakText(hindiWelcome);
  }, [userName]);

  const redirectToFeature = (input) => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes("blood donate") || lowerInput.includes("blood donation")) {
      return "/blood-donation";
    } else if (lowerInput.includes("blood test")) {
      return "/blood-test";
    } else if (lowerInput.includes("all labs")) {
      return "/all-labs";
    } else if (lowerInput.includes("check report")) {
      return "/check-report";
    } else if (lowerInput.includes("download report")) {
      return "/download-report";
    } else if (lowerInput.includes("follow up")) {
      return "/follow-up";
    } else if (lowerInput.includes("track order")) {
      return "/track-order";
    } else if (lowerInput.includes("doctor") || lowerInput.includes("appointment")) {
      return "/doctors";
    } else if (lowerInput.includes("medicine schedule")) {
      return "/medicine-schedule";
    } else if (lowerInput.includes("medicine all")) {
      return "/medicine-all";
    } else if (lowerInput.includes("medicine") || lowerInput.includes("dawai")) {
      return "/medicine-stores";
    } else if (lowerInput.includes("nutrition") || lowerInput.includes("diet")) {
      return "/nutrition";
    } else if (lowerInput.includes("ehr") || lowerInput.includes("health data")) {
      return "/EHRHealthData";
    } else if (lowerInput.includes("ambulance")) {
      return "/ambulance";
    } else if (lowerInput.includes("hospital") || lowerInput.includes("aspatal")) {
      return "/all-hospitals";
    } else if (lowerInput.includes("medical records")) {
      return "/medical-records";
    } else if (lowerInput.includes("emergency services")) {
      return "/emergency-services";
    } else if (lowerInput.includes("billing")) {
      return "/billing";
    } else if (lowerInput.includes("nutritionist")) {
      return "/nutritionists";
    } else if (lowerInput.includes("nutritionist appointment")) {
      return "/nutritionist-appointments";
    } else if (lowerInput.includes("video call") || lowerInput.includes("video calling")) {
      return "/vedio-calling";
    } else if (lowerInput.includes("accident") || lowerInput.includes("emergency")) {
      return "/accident-alert";
    }
    return null;
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
      setMessages((prev) => [
        ...prev,
        { text: "Sun rahi hoon, Alekha! Bol na...", sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText("सुन रही हूँ, Alekha! बोल ना...");
    }
  };

  const speakText = (text) => {
    if (synth.speaking) {
      console.error("SpeechSynthesis is already speaking.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 1;
      utterance.pitch = 1.2;

      const voices = synth.getVoices();
      const hindiVoice = voices.find(
        (voice) =>
          (voice.lang === "hi-IN" || voice.name.includes("Google हिन्दी")) &&
          (voice.name.toLowerCase().includes("female") || voice.gender === "female")
      );

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        console.log("Using voice:", hindiVoice.name);
      } else {
        console.warn("Hindi female voice not found, using default hi-IN voice.");
      }

      synth.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };

  const onEmojiClick = (emojiObject) => {
    setUserInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [
        ...prev,
        { text: `Uploaded file: ${file.name}`, sender: "user", timestamp },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: `Uploaded file: ${file.name}` }] },
      ]);
      const aiResponse = "File received! Main ise review karungi. Koi specific query hai iske baare mein?";
      const hindiAiResponse = "फाइल मिल गई! मैं इसे देखूँगी। इसके बारे में कोई खास सवाल है?";
      setMessages((prev) => [
        ...prev,
        { text: aiResponse, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      setConversationHistory((prev) => [
        ...prev,
        { role: "model", parts: [{ text: aiResponse }] },
      ]);
      speakText(hindiAiResponse);
    }
  };

  const deleteAllMessages = () => {
    if (window.confirm("Are you sure you want to delete all messages?")) {
      setMessages([]);
      setConversationHistory([]);
      localStorage.removeItem("suusriMessages");
      const clearMessage = `All messages deleted, ${userName}! Main nayi shuruaat ke liye taiyaar hoon!`;
      const hindiClearMessage = `सभी संदेश हटा दिए गए, ${userName}! मैं नई शुरुआत के लिए तैयार हूँ!`;
      setMessages([{ text: clearMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
      speakText(hindiClearMessage);
    }
  };

  const handleQuickReply = (query) => {
    setUserInput(query);
    sendMessage(query);
  };

  const sendMessage = async (input = userInput) => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: input, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    try {
      const redirectPath = redirectToFeature(input);
      if (redirectPath) {
        const redirectMessage = `Alekha, main tujhe ${redirectPath.split('/')[1].replace('-', ' ')} page pe le jati hoon! Ek second ruko...`;
        const hindiRedirectMessage = `Alekha, मैं तुझे ${redirectPath.split('/')[1].replace('-', ' ')} पेज पर ले जाती हूँ! एक सेकंड रुको...`;
        setMessages((prev) => [
          ...prev,
          { text: redirectMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", parts: [{ text: input }] },
          { role: "model", parts: [{ text: redirectMessage }] },
        ]);
        speakText(hindiRedirectMessage);
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
          { role: "user", parts: [{ text: input }] },
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

      const hindiText = aiText
        .replace("Alekha", "अलेखा")
        .replace("tu", "तू")
        .replace("hai", "है")
        .replace("main", "मैं")
        .replace("tujhe", "तुझे")
        .replace("pe", "पर")
        .replace("le jati hoon", "ले जाती हूँ")
        .replace("ek second ruko", "एक सेकंड रुको")
        .replace("heart disease", "दिल की बीमारी")
        .replace("ko dekhte hue", "को देखते हुए")
        .replace("doctor", "डॉक्टर")
        .replace("se milna", "से मिलना")
        .replace("acha idea hai", "अच्छा विचार है")
        .replace("Oops", "अरे")
        .replace("Mu samajhi nahi", "मैं समझी नहीं")
        .replace("fir ek bar bolo na", "फिर एक बार बोलो ना");

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: input }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);

      speakText(hindiText);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = `Oops, ${userName}! Mu samajhi nahi, fir ek bar bolo na... 😅....`;
      const hindiErrorMessage = `अरे, ${userName}! मैं समझी नहीं, फिर एक बार बोलो ना... 😅....`;
      setMessages((prev) => [
        ...prev,
        { text: errorMessage, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      speakText(hindiErrorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        Suusri - Smart Universal Urgent Support & Risk Identification
        <button onClick={deleteAllMessages} className={styles.deleteButton}>
          Delete All Messages
        </button>
      </div>
      <div id="chatBox" className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
            <span className={styles.timestamp}>{msg.timestamp}</span>
          </div>
        ))}
        {isTyping && <div className={styles.typing}>Typing...</div>}
        {isListening && <div className={styles.typing}>🎙️ Sun rahi hoon, bolte jao...</div>}
        <div ref={chatEndRef} />
      </div>
      <div className={styles.quickReplies}>
        <button onClick={() => handleQuickReply("Book doctor appointment")}>Book Appointment</button>
        <button onClick={() => handleQuickReply("Blood donation")}>Blood Donation</button>
        <button onClick={() => handleQuickReply("Medicine")}>Medicine</button>
        <button onClick={() => handleQuickReply("Hospital")}>Hospital</button>
      </div>
      <div className={styles.footer}>
        <div className={styles.inputWrapper}>
          <span
            className={styles.smileyIcon}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </span>
          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              <Picker onEmojiClick={onEmojiClick} />
            </div>
          )}
          <label className={styles.attachmentIcon}>
            📎
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <input
            id="userInput"
            type="text"
            placeholder="Type a message..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className={styles.inputField}
          />
          {userInput.trim() ? (
            <button
              id="sendButton"
              onClick={() => sendMessage()}
              className={styles.sendButton}
            >
              <span role="img" aria-label="send">➡️</span>
            </button>
          ) : (
            <button
              id="micButton"
              onClick={startListening}
              disabled={isListening}
              className={styles.micButton}
            >
              {isListening ? "🎙️" : "🎤"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;