import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Check,
  TrendingUp,
  Users,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  Camera,
  Calendar,
  IndianRupee,
  Clock,
  BookOpen,
  WhatsappIcon,
  GraphicEq,
  KeyboardVoice,
  Copy,
  Edit3,
} from './icons';
import confetti from 'canvas-confetti';
import { ChatMessage, GenUiData, Language } from '../types';
import { translations } from '../utils/i18n';
import { formatRupee } from '../utils/formatters';
import { speakWithShubh, stopSpeech } from '../utils/speech';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onNavigateToTab?: (tab: 'home' | 'opportunities' | 'campaigns' | 'udhaar' | 'more') => void;
  onQuickApproveFromBot?: (title: string, revenue: number) => void;
  onSendReminderFromBot?: (customerName: string, amount: number) => void;
  onOpenKhataScanFromBot?: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  lang,
  onNavigateToTab,
  onQuickApproveFromBot,
  onSendReminderFromBot,
  onOpenKhataScanFromBot,
}) => {
  const t = translations[lang] || translations.hinglish;
  const [isListening, setIsListening] = useState(false);
  const [isDictatingInput, setIsDictatingInput] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [activeSpeechText, setActiveSpeechText] = useState('');
  const [recognitionAvailable, setRecognitionAvailable] = useState(false);

  // Generative UI local interactive states
  const [campaignDiscounts, setCampaignDiscounts] = useState<Record<string, number>>({});
  const [campaignLangs, setCampaignLangs] = useState<Record<string, Language>>({});
  const [campaignLaunched, setCampaignLaunched] = useState<Record<string, boolean>>({});
  const [reminderSentStates, setReminderSentStates] = useState<Record<string, boolean>>({});
  const [selectedTone, setSelectedTone] = useState<'soft' | 'firm'>('firm');
  const [activeQrCustomer, setActiveQrCustomer] = useState<{ name: string; amount: number } | null>(null);
  const [selectedDeadHoursSlot, setSelectedDeadHoursSlot] = useState('2:00 PM – 4:00 PM');
  const [selectedDeadHoursCategory, setSelectedDeadHoursCategory] = useState('Staples & Masale (8% Off)');

  const recognitionRef = useRef<any>(null);
  const dictationRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setRecognitionAvailable(true);

      // 1. Assistant command listener
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      if (lang === 'hindi') recognition.lang = 'hi-IN';
      else if (lang === 'marathi') recognition.lang = 'mr-IN';
      else if (lang === 'english') recognition.lang = 'en-IN';
      else recognition.lang = 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTrans = '';
        let interim = '';
        for (let i = 0; i < event.results.length; i++) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += trans;
          } else {
            interim += trans;
          }
        }
        if (interim) setInterimTranscript(interim);
        if (finalTrans) {
          handleSendPrompt(finalTrans);
          setIsListening(false);
          setInterimTranscript('');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      // 2. Dictate into input text bar
      const dictation = new SpeechRecognition();
      dictation.continuous = false;
      dictation.interimResults = true;
      dictation.lang = lang === 'hindi' ? 'hi-IN' : lang === 'marathi' ? 'mr-IN' : 'en-IN';

      dictation.onstart = () => {
        setIsDictatingInput(true);
      };

      dictation.onresult = (event: any) => {
        const trans = event.results[0][0].transcript;
        if (trans) {
          setInputText(trans);
        }
      };

      dictation.onerror = () => setIsDictatingInput(false);
      dictation.onend = () => setIsDictatingInput(false);

      dictationRef.current = dictation;
    }
  }, [lang]);

  // Initial welcome message with dynamic financial report generative widget
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'vyom',
      text: t.voiceGreeting,
      timestamp: 'Abhi',
      genUi: {
        type: 'financial_report',
        payload: {
          todaySales: 7420,
          yesterdaySales: 6870,
          delta: '+8%',
          weeklyRecovered: 18640,
          overdueCount: 3,
          lapsedCustomersCount: 23,
          lapsedAmount: 6900,
        },
      },
    },
  ]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, interimTranscript]);

  // Speech synthesis using Shubh Voice
  const speakText = (text: string) => {
    if (!autoSpeakEnabled) return;
    setActiveSpeechText(text);

    speakWithShubh(text, {
      lang,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => {
        setIsPlayingAudio(false);
        setActiveSpeechText('');
      },
      onError: () => {
        setIsPlayingAudio(false);
        setActiveSpeechText('');
      },
    });
  };

  const stopAudio = () => {
    stopSpeech();
    setIsPlayingAudio(false);
    setActiveSpeechText('');
  };

  // Generative UI Response Engine
  const generateBotResponse = (prompt: string): ChatMessage => {
    const q = prompt.toLowerCase();
    const timeNow = 'Abhi';

    // 1. Udhaar query -> Generates interactive Overdue Ledger & Quick Settlement Card
    if (
      q.includes('udhaar') ||
      q.includes('उधार') ||
      q.includes('उधारी') ||
      q.includes('credit') ||
      q.includes('baki') ||
      q.includes('बाकी') ||
      q.includes('takada')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'vyom',
        text:
          lang === 'hindi'
            ? 'रमेश जी, कुल ₹11,050 की उधारी 30 दिन से अधिक समय से अटकी है। राजेश कुलकर्णी (₹7,200) और अमित देशमुख (₹3,850) सबसे बड़े बकायेदार हैं। मैंने नीचे सीधा तकादा व यूपीआई क्यूआर कार्ड तैयार किया है:'
            : lang === 'marathi'
            ? 'रमेश भाऊ, एकूण ₹11,050 ची उधारी 30 दिवसांहून अधिक थकली आहे. राजेश कुलकर्णी (₹7,200) आणि अमित देशमुख (₹3,850) यांचे स्मरणपत्र खाली तयार आहे. थेट व्हॉट्सॲप व QR कोडने वसुली करा:'
            : lang === 'english'
            ? 'Ramesh ji, ₹11,050 credit is overdue beyond 30 days. Highest risk accounts are Rajesh Kulkarni (₹7,200) and Amit Deshmukh (₹3,850). Here is your instant recovery & UPI QR card:'
            : 'Ramesh bhai, Rajesh Kulkarni (₹7,200) aur Amit Deshmukh (₹3,850) ka udhaar 30+ dino se atka hai. Seedha yahan se WhatsApp takada bhejein ya counter par Paytm QR dikhayein:',
        timestamp: timeNow,
        genUi: {
          type: 'udhaar_recovery_list',
          payload: {
            customers: [
              { id: 'u-1', name: 'Rajesh Kulkarni', amount: 7200, days: 45, phone: '+91 94220 33491', status: 'firm', items: 'Aashirvaad Atta, Ghee & Oil' },
              { id: 'u-2', name: 'Amit Deshmukh', amount: 3850, days: 38, phone: '+91 97645 88201', status: 'firm', items: 'Mahindra Basmati, Masale' },
              { id: 'u-3', name: 'Sunita Patil', amount: 1400, days: 12, phone: '+91 98221 44102', status: 'soft', items: 'Amul Milk & Sugar' },
            ],
          },
        },
        actionText: t.tabUdhaar,
        actionTarget: 'udhaar',
      };
    }

    // 2. Offer / Tomorrow / Festival query -> Generates Campaign Proposal Generative Card with real-time slider
    if (
      q.includes('offer') ||
      q.includes('kal') ||
      q.includes('संधी') ||
      q.includes('deal') ||
      q.includes('mauka') ||
      q.includes('festival') ||
      q.includes('ganpati') ||
      q.includes('diwali') ||
      q.includes('combo')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'vyom',
        text:
          lang === 'hindi'
            ? 'कल के लिए "गणेश चतुर्थी मोदक व पूजा कॉम्बो किट" सबसे उत्तम अवसर है! मोदक आटा (1 किग्रा) + साफ़ घी बंडल पर 12% छूट देकर ₹8,500 की नई बिक्री होगी। नीचे डिस्काउंट स्लाइडर चलाकर ROI चेक करें:'
            : lang === 'marathi'
            ? 'उद्यासाठी "गणेशोत्सव मोदक साहित्य कॉम्बो" सर्वात मोठी संधी आहे! मोदक पीठ + साजूक तूप कॉम्बोवर 12% सवलत देऊन ₹8,500 कमाई होईल. खालील स्लाइडरने सवलत बदलून पहा:'
            : lang === 'english'
            ? 'Ganesh Chaturthi Festive Modak & Pooja Combo is your highest ROI move for tomorrow. Base projected turnover is ₹8,500. Adjust the discount slider below to simulate projected returns:'
            : 'Kal ke liye Ganesh Chaturthi Modak Combo sabse badiya opportunity hai! ₹8,500 ki guaranteed bikri banegi. Aap niche discount slider badal kar munafa test kar sakte hain:',
        timestamp: timeNow,
        genUi: {
          type: 'campaign_proposal',
          payload: {
            id: `camp-prop-${Date.now()}`,
            title: 'Ganesh Festival Modak & Pooja Kit',
            baseRevenue: 8500,
            baseCost: 420,
            defaultDiscount: 12,
            customers: 60,
            drafts: {
              hinglish: 'Ganpati Bappa Special: Sharma Kirana par Modak Peeth 1kg + Pure Ghee combo par 12% Chhoot! Aaj hi visit karein: paytm.me/sharma-kirana 🙏',
              hindi: 'गणेश चतुर्थी विशेष: शर्मा किराना पर मोदक आटा 1kg + शुद्ध घी कॉम्बो पर 12% की भारी छूट! आज ही पधारें: paytm.me/sharma-kirana 🙏',
              marathi: 'गणेशोत्सव विशेष: शर्मा किराणामध्ये मोदक पीठ 1kg + साजूक तूप कॉम्बोवर 12% खास सवलत! आजच भेट द्या: paytm.me/sharma-kirana 🙏',
              english: 'Ganesh Festival Special: Flat 12% OFF on Modak Flour + Pure Ghee Combo at Sharma Kirana! Visit today: paytm.me/sharma-kirana 🙏',
            },
          },
        },
        actionText: 'Opportunities Tab Kholein',
        actionTarget: 'opportunities',
      };
    }

    // 3. Dead hours / Afternoon query -> Generates Dead Hours Deal Card
    if (
      q.includes('dopahar') ||
      q.includes('dead') ||
      q.includes('मंदी') ||
      q.includes('2-4') ||
      q.includes('slow') ||
      q.includes('shaant')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'vyom',
        text:
          lang === 'hindi'
            ? 'दोपहर 2 से 4 बजे दुकान में 82% कम ग्राहक आते हैं। "किराना दाल और तेल पर 8% दोपहर छूट" से प्रतिदिन ₹450-₹600 की अतिरिक्त बिक्री होगी। नीचे टाइम स्लॉट चुनकर डील शेड्यूल करें:'
            : lang === 'marathi'
            ? 'दुपारी 2 ते 4 दरम्यान दुकानात गिऱ्हाईक 82% कमी असते. "मसाले व तेलावर 8% दुपार सवलत" देऊन रोज ₹450-₹600 अतिरिक्त गल्ला जमा करता येईल:'
            : lang === 'english'
            ? 'Footfall drops by 82% between 2-4 PM. Activating an 8% Flash Discount on kitchen staples recovers ~₹2,400/week incremental gross. Configure below:'
            : 'Dopahar 2–4 baje dukaan shaant rehti hai. Aaspas ki 35 societies ko "Masale & Tel 8% Off" flash deal bhej kar roz extra bikri ban sakti hai:',
        timestamp: timeNow,
        genUi: {
          type: 'dead_hours_deal',
          payload: {
            timeSlots: ['12:00 PM – 2:00 PM', '2:00 PM – 4:00 PM', '3:00 PM – 5:00 PM'],
            categories: ['Staples & Masale (8% Off)', 'Snacks & Beverages (10% Off)', 'Pooja Samagri (12% Off)'],
            estWeeklyRevenue: 2400,
            targetAudience: '35 verified residents within 500m',
          },
        },
        actionText: 'Schedule Deal',
        actionTarget: 'opportunities',
      };
    }

    // 4. Financial breakdown / Sales report / Churn audit
    if (
      q.includes('hisaab') ||
      q.includes('bikri') ||
      q.includes('dhanda') ||
      q.includes('हिशोब') ||
      q.includes('report') ||
      q.includes('sales') ||
      q.includes('audit')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'vyom',
        text:
          lang === 'hindi'
            ? 'रमेश जी, आज दुकान पर कुल ₹7,420 की बिक्री हुई है (कल से 8% अधिक)। इस हफ्ते व्योम ने ₹18,640 का नुकसान बचाया है। 23 पुराने नियमित ग्राहक 30 दिन से नहीं आए हैं, जिन्हें वापस लाना आवश्यक है:'
            : lang === 'marathi'
            ? 'रमेश भाऊ, आज एकूण ₹7,420 विक्री झाली (कालपेक्षा 8% जास्त). या आठवड्यात व्योमने ₹18,640 वसुली केली. 23 नियमित ग्राहक गेल्या 30 दिवसांत आले नाहीत:'
            : lang === 'english'
            ? 'Today recorded ₹7,420 turnover (+8% vs yesterday). Total recovered revenue this week stands at ₹18,640. 23 valuable regulars are at churn risk:'
            : 'Aaj dukaan par ₹7,420 ki bikri hui hai (+8% growth). Shaam 6 baje peak footfall tha aur is hafte Vyom ne ₹18,640 recover kiya. 23 purane regulars at risk hain:',
        timestamp: timeNow,
        genUi: {
          type: 'financial_report',
          payload: {
            todaySales: 7420,
            yesterdaySales: 6870,
            delta: '+8%',
            weeklyRecovered: 18640,
            overdueCount: 3,
            lapsedCustomersCount: 23,
            lapsedAmount: 6900,
          },
        },
        actionText: 'Dukaan Report Dekhein',
        actionTarget: 'home',
      };
    }

    // 5. Khata scan query
    if (
      q.includes('scan') ||
      q.includes('khata') ||
      q.includes('photo') ||
      q.includes('bahi') ||
      q.includes('register')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'vyom',
        text:
          lang === 'hindi'
            ? 'आप अपने हाथ से लिखे बहीखाता रजिस्टर का फोटो खींचकर तुरंत डिजिटल कर सकते हैं। व्योम हिंदी/मराठी लिखावट पढ़कर ग्राहक का नाम व बकाया निकाल लेगा:'
            : lang === 'marathi'
            ? 'तुम्ही हाताने लिहिलेल्या खातेवहीचे पान स्कॅन करून डिजिटल करू शकता. व्योम हस्ताक्षरावरून ग्राहकाचे नाव व रक्कम अचूक काढेल:'
            : lang === 'english'
            ? 'Scan your handwritten register page with OCR camera. Vyom reads Hindi & Marathi handwriting and digitizes balances instantly:'
            : 'Apne haath se likhe khata register ka photo lijiye. Vyom Hindi/Marathi handwriting padh kar digital ledger bana dega:',
        timestamp: timeNow,
        genUi: {
          type: 'khata_action_confirm',
          payload: {
            confidence: 96,
            recentScans: 5,
            samplePage: 'Page #42 • Sharma Kirana',
          },
        },
        actionText: 'Scan Khata',
        actionTarget: 'udhaar',
      };
    }

    // Default friendly conversational response with opportunity highlight
    return {
      id: `bot-${Date.now()}`,
      sender: 'vyom',
      text:
        lang === 'hindi'
          ? 'रमेश जी, मैंने दुकान के आंकड़े देखे। 23 पुराने नियमित ग्राहक पिछले 30 दिनों से नहीं आए हैं। ₹50 का कूपन भेजकर ₹6,900 वापस ला सकते हैं:'
          : lang === 'marathi'
          ? 'रमेश भाऊ, 23 जुने नियमित ग्राहक गेल्या 30 दिवसांत आलेले नाहीत. ₹50 सवलतीचा मेसेज पाठवून ₹6,900 परत मिळवता येतील:'
          : lang === 'english'
          ? 'Ramesh ji, 23 valuable regular shoppers have lapsed over 30 days. Sending a ₹50 re-engagement coupon recovers ~₹6,900:'
          : 'Ramesh bhai, 23 regular customers pichle ek mahine se dukaan nahi aaye hain. Unhe wapas bulane ka proposal ready hai:',
      timestamp: timeNow,
      genUi: {
        type: 'campaign_proposal',
        payload: {
          id: `camp-prop-${Date.now()}`,
          title: '30-Day Lapsed Regulars Win-Back',
          baseRevenue: 6900,
          baseCost: 350,
          defaultDiscount: 10,
          customers: 23,
          drafts: {
            hinglish: 'Sharma Kirana Special: Aapko dukaan par dekhe bohot din ho gaye! Is hafte ₹500 ke kirana par flat ₹50 OFF. Zaroor aana: paytm.me/sharma-kirana 🙏',
            hindi: 'शर्मा किराना विशेष: आपको दुकान पर देखे बहुत दिन हो गए! इस हफ्ते ₹500 के राशन पर ₹50 की छूट। अवश्य पधारें: paytm.me/sharma-kirana 🙏',
            marathi: 'शर्मा किराणा विशेष: बऱ्याच दिवसांत भेट झाली नाही! या आठवड्यात ₹500 च्या खरेदीवर ₹50 खास सवलत. नक्की भेट द्या: paytm.me/sharma-kirana 🙏',
            english: 'Sharma Kirana Special: We miss having you! Get flat ₹50 OFF on groceries above ₹500 this week. Visit soon: paytm.me/sharma-kirana 🙏',
          },
        },
      },
      actionText: t.tabOpportunities,
      actionTarget: 'opportunities',
    };
  };

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: 'Abhi',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setInterimTranscript('');
    setIsListening(false);
    setIsDictatingInput(false);

    // Simulated thinking
    setTimeout(() => {
      const botReply = generateBotResponse(promptText);
      setMessages((prev) => [...prev, botReply]);
      speakText(botReply.text);
    }, 600);
  };

  const handleMicToggle = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      if (recognitionRef.current && recognitionAvailable) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          setIsListening(true);
          setTimeout(() => {
            setIsListening(false);
            handleSendPrompt('Kaun udhaar nahi de raha?');
          }, 2600);
        }
      } else {
        setIsListening(true);
        setTimeout(() => {
          setIsListening(false);
          handleSendPrompt('Kaun udhaar nahi de raha?');
        }, 2600);
      }
    }
  };

  const handleDictateInputToggle = () => {
    if (isDictatingInput) {
      if (dictationRef.current) dictationRef.current.stop();
      setIsDictatingInput(false);
    } else {
      if (dictationRef.current && recognitionAvailable) {
        try {
          dictationRef.current.start();
        } catch (e) {
          setIsDictatingInput(true);
          setTimeout(() => {
            setInputText('Aaj ka hisaab aur bikri dikhao');
            setIsDictatingInput(false);
          }, 2000);
        }
      } else {
        setIsDictatingInput(true);
        setTimeout(() => {
          setInputText('Aaj ka hisaab aur bikri dikhao');
          setIsDictatingInput(false);
        }, 2000);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper">
      {/* Top Header */}
      <header className="sticky top-0 z-20 bg-paper/95 backdrop-blur-md border-b border-soft-line px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue text-white flex items-center justify-center font-google font-black text-xl shadow-button">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-google font-black text-base text-obsidian tracking-tight">
                Vyom Voice AI
              </h2>
              <span className="text-[10px] font-google font-extrabold uppercase tracking-wider text-blue bg-sky px-2 py-0.5 rounded-full">
                Generative UI
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-sans">Sharma Kirana Smart Teammate</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Speaking Equalizer Indicator */}
          {isPlayingAudio ? (
            <button
              onClick={stopAudio}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky text-blue text-xs font-google font-bold cursor-pointer animate-pulse"
              title="Stop audio"
            >
              <GraphicEq className="w-4 h-4 text-blue animate-bounce" />
              <span>Bol raha hai (Stop)</span>
            </button>
          ) : (
            <button
              onClick={() => setAutoSpeakEnabled(!autoSpeakEnabled)}
              className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                autoSpeakEnabled ? 'bg-cloud border-line text-blue' : 'bg-cloud/50 border-line text-slate'
              }`}
              title={autoSpeakEnabled ? 'Voice readout enabled' : 'Voice readout muted'}
            >
              {autoSpeakEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* Close button */}
          <button
            onClick={() => {
              stopAudio();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-cloud border border-line flex items-center justify-center text-charcoal hover:text-ink cursor-pointer transition shadow-button"
            aria-label="Close Voice Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2 animate-in fade-in duration-200`}
            >
              {/* Spoken Text Bubble */}
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-obsidian text-white font-medium rounded-br-xs shadow-button font-sans'
                    : 'bg-cloud text-ink border border-soft-line rounded-bl-xs shadow-feature font-sans'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between mb-2 text-xs font-bold text-blue">
                    <span className="flex items-center gap-1.5 font-google">
                      <Sparkles className="w-3.5 h-3.5 text-blue" />
                      Vyom AI
                    </span>
                    <button
                      onClick={() => speakText(m.text)}
                      className="p-1 rounded-lg hover:bg-white text-slate hover:text-blue transition cursor-pointer flex items-center gap-1"
                      title="Audio Sunao"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-google font-bold">Sunao</span>
                    </button>
                  </div>
                )}

                <p className="leading-relaxed font-sans">{m.text}</p>
              </div>

              {/* GENERATIVE UI WIDGET (Rendered dynamically based on intent) */}
              {m.genUi && (
                <div className="w-full max-w-md sm:max-w-xl">
                  {/* 1. Campaign Proposal Generative Card with Real Interactive Discount Slider */}
                  {m.genUi.type === 'campaign_proposal' && (() => {
                    const payload = m.genUi?.payload;
                    if (!payload) return null;
                    const cardId = payload.id || 'camp-prop';
                    const curDiscount = campaignDiscounts[cardId] ?? payload.defaultDiscount ?? 10;
                    const curLang = campaignLangs[cardId] || lang;
                    const isLaunched = campaignLaunched[cardId] || false;

                    // Dynamically compute values based on the slider
                    const baseRev = payload.baseRevenue || 8500;
                    const baseCost = payload.baseCost || 420;
                    const dynamicRev = Math.round(baseRev * (1 + (curDiscount - 10) * 0.04));
                    const dynamicCost = Math.round(baseCost * (1 + (curDiscount - 10) * 0.05));
                    const dynamicRoi = (dynamicRev / dynamicCost).toFixed(1) + 'x';
                    const activeDraft =
                      payload.drafts?.[curLang] ||
                      payload.draft ||
                      'Sharma Kirana Special Offer!';

                    return (
                      <div className="rounded-3xl bg-white border border-line shadow-feature p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-google font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky text-blue">
                              Interactive Campaign Generator
                            </span>
                            <h4 className="font-google font-black text-base text-obsidian mt-1">
                              {m.genUi.payload.title}
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate font-medium block">Exp. Return</span>
                            <span className="font-google font-black text-lg text-blue">
                              {formatRupee(dynamicRev)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Discount Slider Control */}
                        <div className="p-3 rounded-2xl bg-cloud border border-soft-line space-y-2">
                          <div className="flex items-center justify-between text-xs font-google font-bold text-obsidian">
                            <span>Discount Level:</span>
                            <span className="text-sm font-black text-blue bg-white px-2 py-0.5 rounded-lg border border-line">
                              {curDiscount}% OFF
                            </span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="25"
                            step="1"
                            value={curDiscount}
                            onChange={(e) =>
                              setCampaignDiscounts((prev) => ({
                                ...prev,
                                [cardId]: Number(e.target.value),
                              }))
                            }
                            className="w-full accent-blue cursor-pointer h-2 bg-slate-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] font-medium text-slate">
                            <span>5% (Conservative)</span>
                            <span>15% (Recommended)</span>
                            <span>25% (Aggressive)</span>
                          </div>
                        </div>

                        {/* Multilingual WhatsApp message preview bubble */}
                        <div className="p-3.5 rounded-2xl bg-[#e7f7e9] border border-emerald-200 text-xs text-ink space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                              <WhatsappIcon className="w-3.5 h-3.5 text-emerald-600" />
                              WhatsApp Message Template:
                            </span>
                            {/* Language Switcher for message */}
                            <div className="flex gap-1">
                              {(['hinglish', 'hindi', 'marathi', 'english'] as Language[]).map((l) => (
                                <button
                                  key={l}
                                  onClick={() =>
                                    setCampaignLangs((prev) => ({ ...prev, [cardId]: l }))
                                  }
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    curLang === l
                                      ? 'bg-emerald-700 text-white'
                                      : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                                  }`}
                                >
                                  {l.slice(0, 2)}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="font-sans text-xs leading-relaxed text-emerald-950">
                            {activeDraft}
                          </p>
                        </div>

                        {/* Live Metrics strip */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                            <span className="text-[10px] text-slate font-medium block">Audience</span>
                            <span className="font-google font-black text-sm text-ink">
                              {m.genUi.payload.customers} grahak
                            </span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                            <span className="text-[10px] text-slate font-medium block">Kharch</span>
                            <span className="font-google font-black text-sm text-ink">
                              {formatRupee(dynamicCost)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-2xl bg-cloud border border-soft-line">
                            <span className="text-[10px] text-slate font-medium block">Exp. ROI</span>
                            <span className="font-google font-black text-sm text-emerald-700">
                              {dynamicRoi}
                            </span>
                          </div>
                        </div>

                        {/* One-click Approval action */}
                        {isLaunched ? (
                          <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-google font-extrabold flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span>Campaign Live Chalu Ho Gaya ✓</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              try {
                                confetti({ particleCount: 75, spread: 65, origin: { y: 0.7 } });
                              } catch (e) {}
                              setCampaignLaunched((prev) => ({ ...prev, [cardId]: true }));
                              if (onQuickApproveFromBot) {
                                onQuickApproveFromBot(payload.title, dynamicRev);
                              }
                            }}
                            className="w-full py-3 rounded-2xl bg-blue text-white font-google font-extrabold text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Haan, Yeh Campaign Abhi Chalao ✓ ({curDiscount}% Off)</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. Udhaar Recovery List & UPI QR Generative Card */}
                  {m.genUi.type === 'udhaar_recovery_list' && (
                    <div className="rounded-3xl bg-white border border-line shadow-feature p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-error" />
                          <h4 className="font-google font-extrabold text-xs text-obsidian uppercase tracking-wider">
                            Overdue Khata Action Center
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 bg-cloud p-0.5 rounded-xl border border-line">
                          <button
                            onClick={() => setSelectedTone('soft')}
                            className={`px-2 py-0.5 text-[10px] font-google font-bold rounded-lg ${
                              selectedTone === 'soft' ? 'bg-white text-blue shadow-xs' : 'text-slate'
                            }`}
                          >
                            Vinamra
                          </button>
                          <button
                            onClick={() => setSelectedTone('firm')}
                            className={`px-2 py-0.5 text-[10px] font-google font-bold rounded-lg ${
                              selectedTone === 'firm' ? 'bg-white text-error shadow-xs' : 'text-slate'
                            }`}
                          >
                            Kadak
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {m.genUi.payload.customers.map((c: any) => {
                          const isSent = reminderSentStates[c.id];
                          return (
                            <div
                              key={c.id}
                              className="p-3 rounded-2xl bg-cloud border border-soft-line flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-google font-extrabold text-xs text-obsidian truncate">
                                    {c.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-error bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                                    {c.days} din overdue
                                  </span>
                                </div>
                                <div className="text-[11px] text-charcoal font-sans truncate mt-0.5">
                                  {c.items}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-soft-line">
                                <span className="font-google font-black text-xs text-ink">
                                  {formatRupee(c.amount)}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  {/* Show QR button */}
                                  <button
                                    onClick={() =>
                                      setActiveQrCustomer(
                                        activeQrCustomer?.name === c.name ? null : { name: c.name, amount: c.amount }
                                      )
                                    }
                                    className="p-1.5 rounded-xl bg-white border border-line text-charcoal hover:text-blue hover:border-blue transition shadow-xs cursor-pointer"
                                    title="Show Paytm QR"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Send WhatsApp button */}
                                  <button
                                    onClick={() => {
                                      setReminderSentStates((prev) => ({ ...prev, [c.id]: true }));
                                      if (onSendReminderFromBot) {
                                        onSendReminderFromBot(c.name, c.amount);
                                      }
                                    }}
                                    disabled={isSent}
                                    className={`px-2.5 py-1.5 rounded-xl font-google font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer shadow-xs ${
                                      isSent
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                        : 'bg-blue text-white hover:bg-blue/90'
                                    }`}
                                  >
                                    {isSent ? <Check className="w-3 h-3" /> : <WhatsappIcon className="w-3 h-3" />}
                                    <span>{isSent ? 'Bheja ✓' : 'Nudge'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Dynamic Paytm UPI QR Card if expanded */}
                      {activeQrCustomer && (
                        <div className="p-4 rounded-2xl bg-white border-2 border-blue shadow-feature text-center space-y-2 animate-in zoom-in-95">
                          <div className="flex items-center justify-between text-xs font-google font-extrabold text-obsidian">
                            <span>Paytm Dynamic UPI QR</span>
                            <button
                              onClick={() => setActiveQrCustomer(null)}
                              className="text-slate hover:text-ink text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="w-36 h-36 mx-auto bg-slate-50 border border-line rounded-2xl flex flex-col items-center justify-center p-2 relative shadow-inner">
                            <QrCode className="w-24 h-24 text-obsidian" />
                            <span className="text-[10px] font-mono text-slate font-bold mt-1">
                              paytm.me/sharma
                            </span>
                          </div>
                          <div className="font-google font-black text-sm text-obsidian">
                            {activeQrCustomer.name} • {formatRupee(activeQrCustomer.amount)}
                          </div>
                          <p className="text-[11px] text-charcoal">
                            Grahak ko yeh screen dikhayein — Paytm/GPay se scan karke seedha dukaan me jama hoga!
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          if (onNavigateToTab) onNavigateToTab('udhaar');
                          onClose();
                        }}
                        className="w-full py-2.5 rounded-2xl bg-cloud border border-line text-xs font-google font-extrabold text-charcoal hover:text-obsidian text-center block transition cursor-pointer"
                      >
                        Pura Khata Ledger Kholein →
                      </button>
                    </div>
                  )}

                  {/* 3. Dead Hours Deal Generative Card */}
                  {m.genUi.type === 'dead_hours_deal' && (
                    <div className="rounded-3xl bg-white border border-line shadow-feature p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-google font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky text-blue">
                          Dead Hours Flash Engine
                        </span>
                        <span className="font-google font-black text-sm text-emerald-700">
                          +{formatRupee(m.genUi.payload.estWeeklyRevenue)} / wk
                        </span>
                      </div>

                      {/* Slot selector chips */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-google font-bold text-slate block">Time Slot Chunein:</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {m.genUi.payload.timeSlots.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedDeadHoursSlot(slot)}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-google font-extrabold transition cursor-pointer text-center ${
                                selectedDeadHoursSlot === slot
                                  ? 'bg-blue text-white shadow-xs'
                                  : 'bg-cloud border border-line text-charcoal hover:text-ink'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category selector chips */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-google font-bold text-slate block">Category Offer:</label>
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                          {m.genUi.payload.categories.map((cat: string) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedDeadHoursCategory(cat)}
                              className={`py-1.5 px-2.5 rounded-xl text-[10px] font-google font-extrabold whitespace-nowrap transition cursor-pointer ${
                                selectedDeadHoursCategory === cat
                                  ? 'bg-obsidian text-white'
                                  : 'bg-cloud border border-line text-charcoal hover:text-ink'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-sky/30 border border-sky flex items-center justify-between text-xs font-sans">
                        <div>
                          <span className="font-bold text-obsidian">{selectedDeadHoursSlot}</span>
                          <span className="text-[11px] text-charcoal block">{selectedDeadHoursCategory}</span>
                        </div>
                        <span className="font-google font-black text-base text-blue">8% OFF</span>
                      </div>

                      <button
                        onClick={() => {
                          try {
                            confetti({ particleCount: 60, spread: 50 });
                          } catch (e) {}
                          if (onQuickApproveFromBot && m.genUi?.payload) {
                            onQuickApproveFromBot(`Afternoon Flash Deal (${selectedDeadHoursSlot})`, m.genUi.payload.estWeeklyRevenue || 2400);
                          }
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-obsidian text-white font-google font-black text-xs shadow-button hover:bg-ink flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue" />
                        <span>Aaj Dopahar Deal Active Karein ✓</span>
                      </button>
                    </div>
                  )}

                  {/* 4. Financial Report & Silent Churn Radar Card */}
                  {m.genUi.type === 'financial_report' && (
                    <div className="rounded-3xl bg-white border border-line shadow-feature p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95">
                      <div className="flex items-center justify-between">
                        <span className="font-google font-extrabold text-xs text-charcoal uppercase tracking-wider">
                          Dukaan Financial Diagnosis
                        </span>
                        <span className="text-[10px] font-google font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Paytm Verified ✓
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl bg-cloud border border-soft-line">
                          <span className="text-[11px] text-slate font-medium block font-google">Aaj Ki Bikri</span>
                          <div className="font-google font-black text-lg text-obsidian mt-0.5">
                            {formatRupee(m.genUi.payload.todaySales)}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 font-sans">
                            {m.genUi.payload.delta} kal se (+₹550)
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-sky/40 border border-sky">
                          <span className="text-[11px] text-blue font-bold block font-google">Vyom Recovered</span>
                          <div className="font-google font-black text-lg text-blue mt-0.5">
                            {formatRupee(m.genUi.payload.weeklyRecovered)}
                          </div>
                          <span className="text-[10px] text-charcoal font-sans">Is hafte vasool</span>
                        </div>
                      </div>

                      {/* Silent Churn alert strip */}
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <div className="text-xs">
                            <div className="font-google font-extrabold text-amber-950">
                              23 Grahak Silent Churn Risk
                            </div>
                            <div className="text-[10px] text-amber-800 font-sans">
                              30+ dino se nahi aaye (Est. ₹6,900 loss)
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (onNavigateToTab) onNavigateToTab('opportunities');
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-800 text-white font-google font-extrabold text-[10px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>Recover</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Khata Action Generative Card */}
                  {m.genUi.type === 'khata_action_confirm' && (
                    <div className="rounded-3xl bg-white border border-line shadow-feature p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky text-blue flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-google font-extrabold text-sm text-obsidian">
                            Handwritten Khata OCR Digitizer
                          </h4>
                          <span className="text-[10px] font-sans text-slate">
                            Hindi, Marathi & English handwriting recognition
                          </span>
                        </div>
                      </div>

                      {/* Mockup of Bahi Khata preview */}
                      <div className="p-3 rounded-2xl bg-white border border-line font-sans text-xs space-y-2">
                        <div className="flex justify-between items-center border-b border-soft-line pb-1 text-[11px] font-google font-bold text-obsidian">
                          <span>Bahi-Khata Ledger OCR</span>
                          <span className="font-mono text-[10px] text-blue font-bold">96% Conf.</span>
                        </div>
                        <div className="text-[11px] text-charcoal space-y-1">
                          <div className="flex justify-between">
                            <span>Rajesh Kulkarni (Atta, Tel)</span>
                            <span className="font-google font-bold text-rose-700">₹7,200 (Udhaar)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Santosh Shinde (Cash Jama)</span>
                            <span className="font-google font-bold text-emerald-700">₹450 (Jama)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenKhataScanFromBot) onOpenKhataScanFromBot();
                          onClose();
                        }}
                        className="w-full py-3 rounded-2xl bg-blue text-white font-google font-black text-xs shadow-button hover:bg-blue/90 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Abhi Photo Khinchein Aur Scan Karein</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Listening live audio indicator */}
        {isListening && (
          <div className="p-4 rounded-3xl bg-sky/50 border border-sky max-w-sm mx-auto text-center space-y-2 animate-in fade-in">
            <div className="flex items-center justify-center gap-1.5 h-8">
              <span className="w-1.5 bg-blue rounded-full animate-sound-1" />
              <span className="w-1.5 bg-blue rounded-full animate-sound-2" />
              <span className="w-1.5 bg-blue rounded-full animate-sound-4" />
              <span className="w-1.5 bg-blue rounded-full animate-sound-3" />
              <span className="w-1.5 bg-blue rounded-full animate-sound-5" />
            </div>
            <div className="font-google font-extrabold text-xs text-blue">
              {interimTranscript ? `"${interimTranscript}"` : t.voiceOrbListening}
            </div>
            <p className="text-[11px] text-charcoal font-sans">
              Hindi, Marathi ya Hinglish mein bolein...
            </p>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-3 border-t border-soft-line bg-paper max-w-2xl mx-auto w-full">
        <div className="text-[11px] font-google font-extrabold text-slate uppercase tracking-wider mb-2 px-1">
          Jaldi Poochhein:
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            t.voiceSuggestion1,
            t.voiceSuggestion2,
            t.voiceSuggestion3,
            t.voiceSuggestion4,
            'Bahi khata audit karo',
            'Ganpati combo offer banao',
          ].map((sug, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(sug)}
              className="whitespace-nowrap px-3.5 py-2 rounded-2xl bg-cloud border border-line text-xs font-google font-bold text-charcoal hover:text-ink hover:border-blue transition shadow-xs cursor-pointer flex-shrink-0"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Voice & Text Input Dock (Single Mic - No Duplicate) */}
      <div className="p-3 sm:p-4 bg-cloud/80 border-t border-soft-line">
        <div className="max-w-2xl mx-auto w-full">
          {isListening ? (
            /* Active Listening State with Soundwave Equalizer & Real-time Transcript */
            <div className="p-3 rounded-2xl bg-sky/60 border border-sky flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-0.5 h-6 flex-shrink-0">
                  <span className="w-1 bg-blue rounded-full animate-sound-1" />
                  <span className="w-1 bg-blue rounded-full animate-sound-2" />
                  <span className="w-1 bg-blue rounded-full animate-sound-4" />
                  <span className="w-1 bg-blue rounded-full animate-sound-3" />
                  <span className="w-1 bg-blue rounded-full animate-sound-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-google font-extrabold text-blue">
                    Vyom sun raha hai...
                  </div>
                  <p className="text-xs font-sans text-obsidian truncate font-medium">
                    {interimTranscript ? `"${interimTranscript}"` : 'Boliye, aapki aawaz suni ja rahi hai...'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleMicToggle}
                className="px-3.5 py-2 rounded-xl bg-error text-white font-google font-extrabold text-xs shadow-xs hover:bg-error/90 transition cursor-pointer flex-shrink-0"
              >
                Rokhein (Done)
              </button>
            </div>
          ) : (
            /* Idle Input Bar with Single Primary Mic & Send */
            <div className="flex items-center gap-2">
              <div className="flex-1 relative flex items-center bg-white border border-line rounded-2xl shadow-xs focus-within:border-blue">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt(inputText)}
                  placeholder="Sawaal likhein ya mic dabakar bolein..."
                  className="flex-1 px-4 py-3 text-xs sm:text-sm text-ink placeholder:text-slate focus:outline-none font-sans rounded-2xl bg-transparent"
                />
              </div>

              {/* Single Primary Mic Button */}
              <button
                onClick={handleMicToggle}
                className="h-11 w-11 rounded-2xl bg-blue hover:bg-blue/90 text-white flex items-center justify-center shadow-button transition cursor-pointer flex-shrink-0 active:scale-95"
                title="Bolke poochhein"
                aria-label="Speak to Vyom"
              >
                <Mic className="w-5 h-5 text-white" />
              </button>

              {/* Send button (appears when text is typed) */}
              {inputText.trim() && (
                <button
                  onClick={() => handleSendPrompt(inputText)}
                  className="h-11 px-4 rounded-2xl bg-obsidian hover:bg-ink text-white font-google font-bold text-xs flex items-center justify-center gap-1.5 shadow-button cursor-pointer flex-shrink-0 transition animate-in fade-in"
                >
                  <span>Bhejein</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
