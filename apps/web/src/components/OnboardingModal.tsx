import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Check,
  ArrowRight,
  Shield,
  Sparkles,
  Store,
  Building2,
  Smartphone,
  CheckCircle2,
  Mic,
  Volume2,
} from './icons';
import { Guardrails, Language } from '../types';
import { formatRupee } from '../utils/formatters';
import { speakWithShubh, stopSpeech } from '../utils/speech';
import { transcribeVoiceAudio } from '../services/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLanguageSelect: (lang: Language) => void;
  guardrails: Guardrails;
  onUpdateGuardrails: (newGuardrails: Guardrails) => void;
  onSaveStoreDescription?: (description: string) => Promise<void> | void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLanguageSelect,
  guardrails,
  onUpdateGuardrails,
  onSaveStoreDescription,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [shopName, setShopName] = useState('Sharma Kirana Store');
  const [city, setCity] = useState('Pune');
  const [category, setCategory] = useState('Kirana & General Store');
  const [storeDescription, setStoreDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);
  const [paytmConnected, setPaytmConnected] = useState(true);
  const [isConnectingPaytm, setIsConnectingPaytm] = useState(false);
  const [showConsentSheet, setShowConsentSheet] = useState(false);

  // Local copy of guardrails
  const [localLimits, setLocalLimits] = useState<Guardrails>(guardrails);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'hindi' ? 'hi-IN' : lang === 'marathi' ? 'mr-IN' : 'en-IN';
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript?.trim();
        if (transcript) {
          setStoreDescription((current) => (current ? `${current} ${transcript}` : transcript));
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    setRecognitionAvailable(Boolean(SpeechRecognition || navigator.mediaDevices?.getUserMedia));

    return () => {
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      recognitionRef.current = null;
      mediaRecorderRef.current = null;
      setIsListening(false);
    };
  }, [isOpen, lang]);

  useEffect(() => () => stopSpeech(), []);

  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      return;
    }

    const prompts: Record<1 | 2 | 3 | 4 | 5, string> = {
      1: 'Namaste! Sabse pehle, aap kis bhasha mein Vyom se baat karna pasand karenge?',
      2: 'Ab apni dukaan ka naam, shehar aur business category batayein.',
      3: 'Aapki dukaan mein kya milta hai? Chhota sa description bolkar ya type karke batayein.',
      4: 'Ab apne Paytm merchant account ko Vyom se connect karein.',
      5: 'Aakhir mein, apni dukaan ke liye weekly budget aur discount limits set karein.',
    };

    stopSpeech();
    const timer = window.setTimeout(() => {
      speakWithShubh(prompts[step], { lang });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      stopSpeech();
    };
  }, [isOpen, lang, step]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  const handleConnectPaytm = () => {
    setShowConsentSheet(true);
  };

  const handleApprovePaytmConsent = () => {
    setShowConsentSheet(false);
    setIsConnectingPaytm(true);
    setTimeout(() => {
      setIsConnectingPaytm(false);
      setPaytmConnected(true);
    }, 1200);
  };

  const handleToggleListening = () => {
    if (recognitionRef.current) {
      if (isListening) recognitionRef.current.stop();
      else recognitionRef.current.start();
      return;
    }

    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          setIsListening(false);
          setIsTranscribing(true);
          try {
            const transcript = (await transcribeVoiceAudio(
              new Blob(audioChunksRef.current, { type: recorder.mimeType }),
              lang
            )).trim();
            if (transcript) {
              setStoreDescription((current) => (current ? `${current} ${transcript}` : transcript));
            }
          } catch {
            setStoreDescription((current) => current);
          } finally {
            setIsTranscribing(false);
            mediaRecorderRef.current = null;
          }
        };
        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
      })
      .catch(() => setIsListening(false));
  };

  const handleFinish = async () => {
    onUpdateGuardrails(localLimits);
    if (onSaveStoreDescription) await onSaveStoreDescription(storeDescription.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/75 backdrop-blur-xs p-3 sm:p-4">
      <div className="w-full max-w-md bg-paper rounded-3xl border border-line shadow-feature overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
        {/* Brand Header */}
        <div className="p-5 border-b border-soft-line bg-cloud/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue text-white font-black text-xl flex items-center justify-center shadow-button">
              V
            </div>
            <div>
              <div className="font-extrabold text-base text-obsidian tracking-tight">VYOM</div>
              <div className="text-[11px] text-charcoal">
                Aapka AI saathi jo dukaan ka paisa kabhi khone nahi deta
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-slate border-b border-soft-line">
          <span>Step {step} of 5</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className={`w-6 h-1 rounded-full transition-all ${
                  step === s ? 'bg-blue w-8' : step > s ? 'bg-emerald-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Step 1: Language selection */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-extrabold text-obsidian">Apni bhasha chunein</h3>
                <p className="text-xs text-charcoal">Vyom aapse usi bhasha mein baat karega</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {[
                  { id: 'hinglish' as Language, title: 'Hinglish', sub: 'Aam bolchaal ki bhasha' },
                  { id: 'hindi' as Language, title: 'हिन्दी', sub: 'शुद्ध हिन्दी में बातचीत' },
                  { id: 'marathi' as Language, title: 'मराठी', sub: 'आपुलकीची मराठी भाषा' },
                  { id: 'english' as Language, title: 'English', sub: 'Simple English prompts' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLanguageSelect(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      lang === item.id
                        ? 'border-blue bg-sky/50 text-blue font-bold shadow-xs'
                        : 'border-line bg-white hover:bg-cloud text-ink'
                    }`}
                  >
                    <div className="font-extrabold text-base">{item.title}</div>
                    <div className="text-[11px] text-charcoal mt-1">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Shop details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-obsidian">Dukaan ki jankari</h3>
                <p className="text-xs text-charcoal">Iski madad se Vyom aaspas ke patterns samjhega</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-obsidian">Dukaan ka naam</label>
                  <div className="mt-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white">
                    <Store className="w-4 h-4 text-slate flex-shrink-0" />
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full text-xs font-semibold text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-obsidian">Shahar / Area</label>
                  <div className="mt-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white">
                    <Building2 className="w-4 h-4 text-slate flex-shrink-0" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs font-semibold text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-obsidian">Business Category</label>
                  <div className="mt-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-cloud text-charcoal">
                    <span className="text-xs font-semibold">{category}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Store description */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-obsidian">Apni dukaan ke baare mein batayein</h3>
                <p className="text-xs text-charcoal">Aap kya bechte hain? Chhota sa description bolkar ya type karke dein.</p>
              </div>

              <div className="relative">
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Jaise: Hum daily grocery, snacks aur ghar ka samaan bechte hain..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-line bg-white p-3.5 pr-12 text-xs font-medium text-ink focus:border-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleToggleListening}
                  disabled={!recognitionAvailable || isTranscribing}
                  className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition cursor-pointer ${
                    isListening ? 'bg-blue text-white animate-pulse' : 'bg-sky text-blue hover:bg-sky/80'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                  aria-label={isListening ? 'Stop recording' : 'Describe your store by voice'}
                  title={recognitionAvailable ? 'Bolkar likhein' : 'Microphone input browser mein available nahi hai'}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              {isTranscribing && (
                <p className="text-[11px] text-blue">Aapki baat likh raha hoon...</p>
              )}
{/* 
              <div className="flex items-center justify-between rounded-2xl border border-line bg-cloud px-3.5 py-3">
                <span className="text-[11px] text-charcoal">
                  {isListening ? 'Sun raha hoon... dukaan ke baare mein boliye' : 'Voice se jaldi description bhar dein'}
                </span>
                <button
                  type="button"
                  onClick={() => speakWithShubh('Aapki dukaan mein kya milta hai? Chhota sa description bolkar batayein.', { lang })}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue shadow-xs cursor-pointer"
                  aria-label="Hear the question"
                  title="Sawaal suniye"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div> */}
            </div>
          )}

          {/* Step 4: Connect Paytm consent */}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-sky flex items-center justify-center text-blue shadow-xs">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-obsidian">Paytm Merchant Connect</h3>
                <p className="text-xs text-charcoal max-w-xs mx-auto mt-1 leading-relaxed">
                  Vyom aapke roz ke transactions ko analyse karke silent churn aur udhaar khojta hai.
                </p>
              </div>

              {paytmConnected ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Paytm Merchant Account Connected ✓</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 space-y-0.5">
                    <div>Merchant ID: <strong>9823****44 (Sharma Kirana)</strong></div>
                    <div>Daily Soundbox & QR Sync: Active</div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleConnectPaytm}
                  disabled={isConnectingPaytm}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#002e6e] text-white font-extrabold text-xs shadow-button hover:opacity-95 transition cursor-pointer"
                >
                  {isConnectingPaytm ? 'Connecting...' : 'Connect Paytm Merchant'}
                </button>
              )}

              {/* Consent popup preview */}
              {showConsentSheet && (
                <div className="p-4 rounded-2xl bg-cloud border border-line text-left space-y-3">
                  <div className="text-xs font-bold text-obsidian flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue" />
                    <span>Paytm Data Consent Permission</span>
                  </div>
                  <p className="text-[11px] text-charcoal leading-relaxed">
                    Vyom sirf aapke transaction timings aur repeat-customer numbers padhega. Paisa nikaalne ka koi adhikar nahi hota.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConsentSheet(false)}
                      className="flex-1 py-2 rounded-xl border border-line text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprovePaytmConsent}
                      className="flex-1 py-2 rounded-xl bg-blue text-white text-xs font-bold"
                    >
                      Manzoor Hai
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Set guardrail limits once */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-obsidian">Apni Limits Set Karein</h3>
                <p className="text-xs text-charcoal">
                  Vyom in limits ke bahar kuch nahi karega. Har offer se pehle aapki 'haan' zaroori hai.
                </p>
              </div>

              <div className="space-y-3">
                {/* Budget Slider */}
                <div className="p-3.5 rounded-2xl bg-cloud border border-line space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-obsidian">Max Weekly Budget:</span>
                    <span className="font-extrabold text-blue">{formatRupee(localLimits.maxWeeklyBudget)}</span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={250}
                    value={localLimits.maxWeeklyBudget}
                    onChange={(e) =>
                      setLocalLimits({ ...localLimits, maxWeeklyBudget: Number(e.target.value) })
                    }
                    className="w-full accent-blue cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate">
                    <span>₹500</span>
                    <span>₹5,000</span>
                  </div>
                </div>

                {/* Discount Slider */}
                <div className="p-3.5 rounded-2xl bg-cloud border border-line space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-obsidian">Max Discount Limit:</span>
                    <span className="font-extrabold text-blue">{localLimits.maxDiscountPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={localLimits.maxDiscountPercent}
                    onChange={(e) =>
                      setLocalLimits({ ...localLimits, maxDiscountPercent: Number(e.target.value) })
                    }
                    className="w-full accent-blue cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate">
                    <span>5%</span>
                    <span>30%</span>
                  </div>
                </div>

                {/* Frequency */}
                <div className="p-3.5 rounded-2xl bg-cloud border border-line flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-obsidian block">Spam Control</span>
                    <span className="text-[11px] text-charcoal">Hafte mein max message per customer</span>
                  </div>
                  <span className="text-xs font-extrabold text-ink bg-white px-2.5 py-1 rounded-lg border border-line">
                    1 msg/week
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-soft-line bg-paper flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="py-2.5 px-4 rounded-xl border border-line text-xs font-bold text-charcoal hover:bg-cloud cursor-pointer"
            >
              Peeche
            </button>
          ) : (
            <button
              onClick={handleClose}
              className="text-xs font-bold text-slate hover:text-charcoal cursor-pointer"
            >
              Skip Demo
            </button>
          )}

          {step < 5 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="py-2.5 px-5 rounded-xl bg-blue text-white text-xs font-bold shadow-button hover:bg-blue/90 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Aage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="py-2.5 px-5 rounded-xl bg-obsidian text-white text-xs font-extrabold shadow-button hover:opacity-90 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue" />
              <span>Vyom Shuru Karein (Start)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
