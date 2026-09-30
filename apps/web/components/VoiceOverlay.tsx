"use client";

import React, { useState, useEffect, useRef } from "react";
import { useVyomStore } from "../lib/store";
import { useT } from "../lib/i18n";
import { X, Mic, Send, Volume2, Sparkles, VolumeX } from "lucide-react";

export function VoiceOverlay() {
  const { voiceOpen, setVoiceOpen } = useVyomStore();
  const { t, lang } = useT();
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [conversation, setConversation] = useState<{
    id: string;
    sender: "user" | "vyom";
    text: string;
    time: string;
  }[]>([
    {
      id: "v1",
      sender: "user",
      text: "Aaj dhanda kaisa hai?",
      time: "Just now",
    },
    {
      id: "v2",
      sender: "vyom",
      text: "Namaste Ramesh bhai! Aaj ab tak ₹7,420 ki bikri hui hai, kal se 8% zyada. Shaam 6 baje sabse zyada bheed thi. 2 logon ne udhaar chukaya hai.",
      time: "Just now",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (voiceOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, voiceOpen]);

  if (!voiceOpen) return null;

  const speakText = (text: string) => {
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (lang === "hi" || lang === "hinglish") {
        utterance.lang = "hi-IN";
      } else if (lang === "mr") {
        utterance.lang = "mr-IN";
      } else {
        utterance.lang = "en-IN";
      }
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const getVyomResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes("dhanda") || q.includes("bikri") || q.includes("business") || q.includes("today")) {
      return lang === "mr"
        ? "आज आतापर्यंत ₹7,420 ची विक्री झाली आहे, कालपेक्षा 8% जास्त. संध्याकाळी 6 वाजता दुकानात सर्वाधिक गर्दी होती."
        : lang === "hi"
        ? "आज अब तक ₹7,420 की बिक्री हुई है, कल से 8% अधिक। शाम 6 बजे सबसे ज्यादा ग्राहक आए थे।"
        : lang === "en"
        ? "Today's sales stand at ₹7,420 so far, +8% compared to yesterday. Peak footfall was observed at 6:00 PM."
        : "Aaj ab tak ₹7,420 ki bikri hui hai, kal se 8% zyada. Shaam 6 baje sabse zyada bheed thi. 2 logon ne udhaar chukaya hai.";
    }
    if (q.includes("udhaar") || q.includes("credit") || q.includes("baaki") || q.includes("who")) {
      return lang === "mr"
        ? "एकूण ₹48,300 बाकी आहेत. अमित देशमुख आणि राजेश कुलकर्णी यांचे 30 दिवसांपेक्षा जुने ₹5,500 बाकी आहेत. आज 6 स्वयंचलित आठवण संदेश पाठवले आहेत."
        : lang === "hi"
        ? "कुल ₹48,300 बकाया है। अमित देशमुख और राजेश कुलकर्णी का 30+ दिन पुराना ₹5,500 बाकी है। आज 6 स्वचालित रिमाइंडर भेजे गए हैं।"
        : lang === "en"
        ? "Total outstanding credit is ₹48,300. Overdue accounts include Amit Deshmukh (₹3,400) and Rajesh Kulkarni (₹2,100). Vyom dispatched 6 polite sweeps today."
        : "Kul ₹48,300 ka udhaar baaki hai. Amit Deshmukh (₹3,400) aur Rajesh Kulkarni (₹2,100) ka 30 din se zyada ho gaya hai. Vyom ne aaj gentle reminder bhej diya hai.";
    }
    if (q.includes("offer") || q.includes("kal") || q.includes("suggest") || q.includes("tomorrow")) {
      return lang === "mr"
        ? "दुपारी 2 ते 4 दरम्यान चहा आणि बिस्किट कॉम्बोवर 10% सूट द्या. यामुळे दुकानातील शांत तासांत ₹2,400 चा अतिरिक्त गल्ला होईल."
        : lang === "hi"
        ? "दोपहर 2 से 4 बजे के लिए चाय और बिस्कुट कॉम्बो पर 10% फ्लैश डिस्काउंट चलाएं। इससे ₹2,400 की अतिरिक्त बिक्री होगी।"
        : lang === "en"
        ? "Launch a 10% tea-and-biscuit flash discount between 2-4 PM tomorrow. It recovers an estimated ₹2,400 during empty hours."
        : "Kal dopahar 2 se 4 baje ke liye Chai-Biscuit combo par 10% flash discount ka offer chalana best rahega. Isse lagbhag ₹2,400 ki extra bikri aayegi.";
    }
    if (q.includes("hisaab") || q.includes("hafta") || q.includes("week") || q.includes("summary")) {
      return lang === "mr"
        ? "या आठवड्यात व्योमने ₹18,640 ची कमाई वाचवून मिळवून दिली आहे. 14 जुने ग्राहक परत आले आणि ₹9,200 उधार वसूल झाले."
        : lang === "hi"
        ? "इस हफ्ते व्योम ने ₹18,640 की रिकवरी कराई है। 14 ग्राहक वापस आए और ₹9,200 की उधारी वसूली हुई।"
        : lang === "en"
        ? "This week Vyom recovered ₹18,640 (+12% uplift). 14 lapsed customers returned and ₹9,200 in overdue credit was collected."
        : "Is hafte Vyom ne ₹18,640 recover kiya hai (+12% uplift). 14 customers wapas aaye aur ₹9,200 ka purana udhaar collect hua.";
    }
    return lang === "mr"
      ? "मी तुमच्या दुकानाचे सर्व व्यवहार तपासून पाहत आहे. तुम्ही विक्री, उधारी किंवा सणांच्या ऑफरबद्दल विचारू शकता."
      : lang === "hi"
      ? "मैं आपकी दुकान के डेटा की निगरानी कर रहा हूँ। आप बिक्री, उधारी या ऑफर्स के बारे में पूछ सकते हैं।"
      : lang === "en"
      ? "I am continuously monitoring your Paytm transactions and store velocity. Feel free to ask about sales, credit ledger, or festive kits."
      : "Main aapki dukaan ke transactions check kar raha hoon. Aap aaj ki bikri, udhaar recovery ya festive offers ke baare mein pooch sakte hain.";
  };

  const handleQuery = (text: string) => {
    if (!text.trim()) return;

    const userMsg = {
      id: "u_" + Date.now(),
      sender: "user" as const,
      text: text.trim(),
      time: "Just now",
    };

    const replyText = getVyomResponse(text.trim());

    const vyomMsg = {
      id: "v_" + (Date.now() + 1),
      sender: "vyom" as const,
      text: replyText,
      time: "Just now",
    };

    setConversation((prev) => [...prev, userMsg, vyomMsg]);
    setInputText("");
    speakText(replyText);
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    // Simulate voice detection
    setTimeout(() => {
      setIsListening(false);
      handleQuery("Aaj ka dhanda kaisa hai?");
    }, 2200);
  };

  const suggestions = [
    t("voice.chip1"),
    t("voice.chip2"),
    t("voice.chip3"),
    t("voice.chip4"),
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-obsidian/60 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-paper sm:rounded-3xl rounded-t-3xl border border-soft-line shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue text-paper flex items-center justify-center shadow-button font-display font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-obsidian flex items-center gap-2">
                {t("voice.title")}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky text-blue">
                  AI Active
                </span>
              </h3>
              <p className="text-[11px] text-charcoal">
                {isSpeaking ? t("voice.speaking") : isListening ? t("voice.listening") : "Hindi / Marathi / Hinglish"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl border border-line hover:bg-cloud text-charcoal"
              title={soundEnabled ? "Mute Voice Readout" : "Enable Voice Readout"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setVoiceOpen(false);
              }}
              className="p-2 rounded-xl hover:bg-cloud text-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Voice Wave / Orb Section */}
        <div className="pt-6 pb-4 px-6 flex flex-col items-center justify-center border-b border-soft-line bg-gradient-to-b from-sky/20 to-paper">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulsing Rings */}
            <div
              className={`absolute w-36 h-36 rounded-full bg-blue/15 transition-all duration-700 ${
                isListening || isSpeaking ? "scale-125 animate-ping opacity-75" : "scale-100 opacity-40"
              }`}
            />
            <div
              className={`absolute w-28 h-28 rounded-full bg-sky transition-all duration-500 ${
                isListening || isSpeaking ? "scale-110 animate-pulse" : "scale-100"
              }`}
            />

            {/* Main Interactive Mic Orb */}
            <button
              onClick={handleMicClick}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-elevated transition-all duration-300 ${
                isListening
                  ? "bg-red-500 text-paper ring-4 ring-red-200 scale-105"
                  : isSpeaking
                  ? "bg-blue text-paper ring-4 ring-sky scale-105"
                  : "bg-blue text-paper hover:bg-blue/90 hover:scale-105"
              }`}
              aria-label="Toggle voice listening"
            >
              <Mic className={`w-8 h-8 ${isListening ? "animate-bounce" : ""}`} />
            </button>
          </div>

          {/* Sound Waveform Visualization */}
          <div className="flex items-center justify-center gap-1.5 h-8 mt-4">
            {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35].map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full bg-blue transition-all duration-300 ${
                  isListening || isSpeaking ? "animate-wave" : "opacity-30"
                }`}
                style={{
                  height: isListening || isSpeaking ? `${height}%` : "30%",
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>

          <p className="text-xs font-bold text-obsidian text-center mt-2">
            {isListening ? "Sun raha hoon... Boliye" : isSpeaking ? "Vyom bol raha hai..." : "Mic daba kar bolke poochhein"}
          </p>
        </div>

        {/* Conversation Message Bubbles */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {conversation.map((msg) => {
            const isVyom = msg.sender === "vyom";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isVyom ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[88%] rounded-3xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isVyom
                      ? "bg-cloud text-obsidian border border-soft-line shadow-feature rounded-tl-sm"
                      : "bg-obsidian text-paper shadow-button rounded-tr-sm"
                  }`}
                >
                  <p>{msg.text}</p>

                  {isVyom && soundEnabled && (
                    <button
                      onClick={() => speakText(msg.text)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-blue font-bold hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Dobara Sunao</span>
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-soft-line flex gap-2 overflow-x-auto no-scrollbar bg-cloud/30">
          {suggestions.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(chip)}
              className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold bg-paper hover:bg-sky/50 text-obsidian border border-line shadow-button transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Text Input Fallback Bar */}
        <div className="p-3 border-t border-soft-line bg-paper flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleQuery(inputText);
            }}
            placeholder={t("voice.fallback_placeholder")}
            className="flex-1 bg-cloud rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-obsidian placeholder:text-slate border border-soft-line focus:outline-none focus:ring-2 focus:ring-blue/30"
          />

          <button
            onClick={() => handleQuery(inputText)}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-2xl bg-obsidian text-paper hover:bg-ink flex items-center justify-center disabled:opacity-40 shadow-button transition-colors"
            aria-label="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
