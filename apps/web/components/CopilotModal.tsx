"use client";

import React, { useState, useEffect, useRef } from "react";
import { useT } from "../lib/i18n";
import { sendCopilotChat, confirmCopilotAction } from "../lib/api";
import { X, Mic, Send, Volume2, Sparkles, Check, AlertCircle } from "lucide-react";

interface CopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: "merchant" | "copilot";
  text: string;
  audioUrl?: string;
  pendingAction?: {
    action_id: string;
    action_type: string;
    summary: string;
  };
}

export function CopilotModal({ isOpen, onClose }: CopilotModalProps) {
  const { t, lang } = useT();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Namaste Ramesh ji! 🙏 Main Vyom hoon. Aaj Pitru Paksha ka 4th din hai. Navratri ki tayyari ya udhaar hisaab ke baare mein kuch poochna hai?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: "u_" + Date.now(),
      sender: "merchant",
      text: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const res = await sendCopilotChat(textToSend, lang);
      const copilotMsg: Message = {
        id: "c_" + Date.now(),
        sender: "copilot",
        text: res.answer_text || "Main aapki dukaan ke data se check kar raha hoon.",
        audioUrl: res.audio_url,
        pendingAction: res.pending_action,
      };
      setMessages((prev) => [...prev, copilotMsg]);

      // If audio returned, play TTS
      if (res.audio_url) {
        const audio = new Audio(res.audio_url);
        audio.play().catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err_" + Date.now(),
          sender: "copilot",
          text: "Kshama karein, abhi connection mein dikkat aayi. Ek baar dobara boliye.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    setLoading(true);
    try {
      await confirmCopilotAction(actionId);
      setMessages((prev) => [
        ...prev,
        {
          id: "conf_" + Date.now(),
          sender: "copilot",
          text: "✅ Kaam ho gaya! Vyom ne action execute kar diya hai.",
        },
      ]);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Aaj ka kaun sa tyohaar chal raha hai?",
    "Navratri ke liye kya stock karun?",
    "Kaun se grahak ka udhaar baaki hai?",
    "Navratri vrat kit campaign banao",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-obsidian/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-paper sm:rounded-3xl rounded-t-3xl border border-soft-line shadow-2xl flex flex-col max-h-[90vh] h-[650px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-soft-line bg-cloud/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue flex items-center justify-center text-paper shadow-button">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-obsidian flex items-center gap-1.5">
                {t("copilot.title")}
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h2>
              <p className="text-[11px] text-charcoal">{t("copilot.subtitle")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-cloud flex items-center justify-center text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isCopilot = m.sender === "copilot";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isCopilot ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isCopilot
                      ? "bg-cloud text-obsidian border border-soft-line shadow-sm"
                      : "bg-obsidian text-paper shadow-button"
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Audio Speaker icon */}
                  {m.audioUrl && (
                    <button
                      onClick={() => {
                        const a = new Audio(m.audioUrl);
                        a.play();
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue font-semibold hover:underline"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Sunao (Bulbul Voice)</span>
                    </button>
                  )}

                  {/* Two-phase Confirmation Card */}
                  {m.pendingAction && (
                    <div className="mt-3 p-3 bg-paper rounded-xl border border-line text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-obsidian font-bold">
                        <AlertCircle className="w-4 h-4 text-festive-amber" />
                        <span>Manzoori Chahiye:</span>
                      </div>
                      <p className="text-charcoal">{m.pendingAction.summary}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(m.pendingAction!.action_id)}
                          className="flex-1 py-1.5 rounded-lg bg-obsidian text-paper font-semibold hover:bg-ink flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("copilot.confirm.yes")}</span>
                        </button>
                        <button
                          onClick={() => {
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: "cancel_" + Date.now(),
                                sender: "copilot",
                                text: "Theek hai, action cancel kar diya.",
                              },
                            ]);
                          }}
                          className="py-1.5 px-3 rounded-lg border border-line text-charcoal hover:bg-cloud font-medium"
                        >
                          {t("copilot.confirm.no")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-charcoal py-2 px-3 bg-cloud/80 rounded-2xl w-fit">
              <span className="w-2 h-2 rounded-full bg-blue animate-ping"></span>
              <span>{t("copilot.thinking")}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-soft-line flex gap-2 overflow-x-auto no-scrollbar">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-cloud hover:bg-sky/50 text-obsidian border border-line transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar with Voice Toggle */}
        <div className="p-3 border-t border-soft-line bg-paper flex items-center gap-2">
          {/* Mic Button */}
          <button
            onClick={() => {
              if (!isListening) {
                setIsListening(true);
                // Simulate voice recording stop after 3s
                setTimeout(() => {
                  setIsListening(false);
                  handleSend("Navratri ke liye kya stock karun?");
                }, 2500);
              } else {
                setIsListening(false);
              }
            }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? "bg-festive-vermilion text-paper animate-pulse ring-4 ring-red-200"
                : "bg-sky text-blue hover:bg-blue hover:text-paper"
            }`}
            title="Speech to Text (Saaras Voice)"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(inputText);
            }}
            placeholder={isListening ? t("copilot.listening") : t("copilot.type_placeholder")}
            className="flex-1 bg-cloud rounded-2xl px-4 py-2.5 text-sm text-obsidian placeholder:text-slate border border-soft-line focus:outline-none focus:ring-2 focus:ring-blue/30"
          />

          <button
            onClick={() => handleSend(inputText)}
            disabled={!inputText.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-obsidian text-paper flex items-center justify-center hover:bg-ink disabled:opacity-40 transition-colors shadow-button"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
