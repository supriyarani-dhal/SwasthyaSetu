import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./SuuSri.module.css";
import { Languages } from "lucide-react";

const Chat = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userName, setUserName] = useState(""); // User's name storage
  const chatEndRef = useRef(null);
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY || "AIzaSyDJ7nuaU3xBtB2H6VPGDes8vtICGbrRTCo"; // Move to .env

  // Temporarily commented out speakText function
  /*
  const speakText = (text) => {
    if (synth.speaking) {
      console.error("SpeechSynthesis is already speaking.");
      return;
    }
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN"; // Forced to Hinglish pronunciation
      utterance.rate = 1;
      utterance.pitch = 1;
      synth.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };
  */

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
      7. Always include disclaimers in the response language
      8. Be tolerant of mixed language inputs
      
      Examples:
      User (Odia): "ମୋର ଥଣ୍ଡା ଲାଗିଛି"
      Response: "ଥଣ୍ଡା କେତେ ଦିନ ହେଲା? 🤧 ଗରମ ପାଣି ପିଅନ୍ତୁ ଏବଂ ବିଶ୍ରାମ କରନ୍ତୁ। 3 ଦିନ ମଧ୍ୟରେ ଉନ୍ନତି ନହେଲେ ଡାକ୍ତରଙ୍କୁ ଦେଖାନ୍ତୁ 🏥"

      User (Hinglish): "Mera pet kharab hai"
      Response: "Pet dard ke saath koi aur symptoms? 🤢 Jaise ulti ya bukhar? 6 ghante tak khali pet rahein aur ORS ka solution piye. 💧"`,
  };

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const detectLanguage = (text) => {
    // Since all responses will be in Hinglish, this is overridden in the payload
    const hasOdia = /[ଅ-ଳ]/.test(text);
    const hasHindi = /[अ-ह]/.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);

    if (hasOdia) return "Odia";
    if (hasHindi && hasEnglish) return "Hinglish";
    if (hasHindi) return "Hindi";
    return "English";
  };

  useEffect(() => {
    const initialMessages = [{
      text: "Welcome, mere sir! Main hoon Suusri, apki cute health assistant. kya hua hai, bandhu? Aaj kya help karu? ...",
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }];
    setMessages(initialMessages);

    const initialHistory = [
      {
        role: "model",
        parts: [{ text: "Welcome, mere Sir! Main hoon Suusri, teri cute health assistant. Kan heigala, bandhu? Aaj kya help karu? ...." }],
      },
    ];
    setConversationHistory(initialHistory);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMessages = [...messages, { text: userInput, sender: "user", timestamp }];
    setMessages(newMessages);
    setUserInput("");
    setIsTyping(true);

    // Check for user's name in input
    const nameMatch = userInput.match(/my name is (\w+)/i);
    if (nameMatch) {
      setUserName(nameMatch[1]);
    }

    try {
      // Force Hinglish language for all responses
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

      // Add user's name or pet name to the response if known
      if (userName) {
        aiText = aiText.replace(/bandhu|Sir|sweetie/g, userName);
      }

      setConversationHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: userInput }] },
        { role: "model", parts: [{ text: aiText }] },
      ]);

      setMessages((prev) => [
        ...prev,
        { text: aiText, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      // speakText(aiText); // Commented out as per request
    } catch (error) {
      console.error("API Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: `Oops, Sir! Mu samajhi nahi, fir ek bar bolo na... 😅💕....`, sender: "ai", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>Suusri - Tera Health Assistant</div>
      <div id="chatBox" className={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={styles[`${msg.sender}-message`]}
            data-timestamp={msg.timestamp}
          >
            {msg.text}
            {msg.sender === "ai" && (
              <span className={styles.speakerIcon} /* onClick={() => speakText(msg.text)} */ />
            )}
          </div>
        ))}
        {isTyping && <div className={styles.typing}>⌛ Ruko, Sir, soch ke bolti hoon 🙄....</div>}
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