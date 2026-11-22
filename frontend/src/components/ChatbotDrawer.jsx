import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Camera, 
  Loader2, 
  Mic, 
  MicOff, 
  RotateCcw, 
  Volume2, 
  VolumeX,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  History,
  Plus,
  ShieldAlert,
  Tag,
  Wrench,
  AlertTriangle
} from 'lucide-react';
import { api, classifyRiskTier, MODEL_CONFIG } from '../services/api';
import { ensureTamilChatReply, tCrop } from '../utils/translations';

const QUICK_PROMPTS_TA = [
  "இன்று உரம் இடலாமா?",
  "தென்னைக்கு உகந்த உரம் எது?",
  "இன்றைய மண்டி சந்தை விலை என்ன?",
  "மழை வாய்ப்பு & தெளிக்கும் நேரம்",
  "மண் அமிலத்தன்மைக்கு என்ன செய்வது?"
];

const QUICK_PROMPTS_EN = [
  "Can I apply fertilizer today?",
  "What is the best fertilizer for coconut?",
  "What is the current mandi market price?",
  "Rain forecast & safe spray window",
  "How to treat acidic laterite soil?"
];

const getWelcomeMessage = (l, parcel) => ({
  id: 'msg-welcome',
  sender: 'bot',
  text: l === 'ta'
    ? `வணக்கம் விவசாயி அவர்களே! நான் உங்கள் பார்ம்வைஸ் AI நேரடி வேளாண் ஆலோசகர்.${parcel?.survey_number ? ` (புல எண் #${parcel.survey_number} • ${parcel.recorded_crop || 'தென்னை'} நில விவரங்கள் இணைக்கப்பட்டுள்ளன)` : ''}\n\nஉங்களுக்கு உதவக்கூடிய சேவைகள்:\n• **உரம் & ஊட்டச்சத்து அட்டவணை** (TNAU பரிந்துரைத்த யூரியா, பொட்டாஷ் அளவுகள்)\n• **பூச்சி & நோய் கட்டுப்பாடு** (இயற்கை NSKE & பாதுகாப்பு வழிகாட்டல்)\n• **வானிலை & தெளிக்கும் நேரம்** (மழை மற்றும் காற்றின் வேகம்)\n• **நேரடி மண்டி சந்தை விலைகள்** (தென்காசி, திருநெல்வேலி APMC)\n\n🎤 **குறிப்பு:** மைக் பொத்தானை அழுத்தி தமிழில் பேசலாம், அல்லது கீழே உள்ள குறிப்புகளை அழுத்தலாம்!`
    : `Vanakkam Farmer! I am your FarmwiseAI Live Agricultural Assistant.${parcel?.survey_number ? ` (Survey Parcel #${parcel.survey_number} • ${parcel.recorded_crop || 'Coconut'} is actively linked)` : ''}\n\nI can help you with:\n• **Fertilizer & Nutrient Schedules** (TNAU / ICAR dosages of Urea, DAP, Potash)\n• **Pest & Disease Diagnostics** (Integrated pest management)\n• **Micro-Climate & Foliar Spray Windows** (Live Open-Meteo ECMWF)\n• **Live Mandi Commodity Rates** (Tenkasi & Tirunelveli APMC)\n\n🎤 **Tip:** Tap the mic to speak in Tamil or English, or tap the quick chips below!`,
  modelUsed: 'Ministral-8B / Flash-Lite Tier',
  riskTier: 'LOW',
  confidence: 0.98,
  sources: ['TNAU Crop Guide 2024', 'National Soil Health Card', 'Open-Meteo ECMWF'],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

// Markdown lightweight formatter
function renderFormattedMarkdown(text = '') {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bold parsing
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pIdx} className="font-black text-slate-950">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={idx} className="flex items-start gap-2 my-0.5 pl-1">
          <span className="text-emerald-700 font-bold">•</span>
          <span>{formattedParts}</span>
        </div>
      );
    }
    if (line.startsWith('⚠️') || line.startsWith('📌')) {
      return (
        <div key={idx} className="p-2.5 my-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold">
          {formattedParts}
        </div>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-1.5" />;
    }
    return <p key={idx} className="my-0.5 leading-relaxed">{formattedParts}</p>;
  });
}

export default function ChatbotDrawer({ 
  isOpen = true, 
  onClose, 
  activeParcel, 
  lang: propLang = 'ta', 
  embedded = false,
  isOfficerView = false
}) {
  const [lang, setLang] = useState(propLang || 'ta');
  const [messages, setMessages] = useState([getWelcomeMessage(propLang || 'ta', activeParcel)]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingIdx, setCurrentlySpeakingIdx] = useState(null);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);

  // Chat memory sessions
  const [savedSessions, setSavedSessions] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  // Officer view demo: simulate outage/fallback
  const [simulateOutage, setSimulateOutage] = useState(false);

  const utteranceRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (propLang) setLang(propLang);
  }, [propLang]);

  // Load saved sessions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('farmwise_chat_sessions');
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  // Sync initial welcome message if only 1 message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [getWelcomeMessage(lang, activeParcel)];
      }
      return prev;
    });
  }, [activeParcel?.survey_number, lang]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isLoading]);

  // TTS read-aloud
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingIdx(null);
  }, []);

  const speakMessage = useCallback((text, msgIdx = null) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking && currentlySpeakingIdx === msgIdx) {
      stopSpeaking();
      return;
    }
    stopSpeaking();

    const clean = String(text || '').replace(/[*_#`~>•]/g, ' ').replace(/\n+/g, '. ').trim();
    if (!clean) return;

    const hasTa = /[\u0B80-\u0BFF]/.test(clean);
    const targetLang = (lang === 'ta' || hasTa) ? 'ta-IN' : 'en-IN';

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = targetLang;
    utterance.rate = targetLang === 'ta-IN' ? 0.92 : 0.98;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === targetLang) ||
                  voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingIdx(msgIdx);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, currentlySpeakingIdx, lang, stopSpeaking]);

  // "New Chat" Handler
  const handleNewChat = () => {
    stopSpeaking();
    if (messages.length > 1) {
      // Archive current session
      const newSession = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        title: messages[1]?.text?.slice(0, 35) + '...' || 'Agricultural Advisory',
        messages: [...messages]
      };
      const updated = [newSession, ...savedSessions.slice(0, 9)];
      setSavedSessions(updated);
      try {
        localStorage.setItem('farmwise_chat_sessions', JSON.stringify(updated));
      } catch (e) {}
    }
    setMessages([getWelcomeMessage(lang, activeParcel)]);
    setInput('');
    removeImage();
    setStreamingText('');
  };

  const handleLoadSession = (session) => {
    setMessages(session.messages || []);
    setShowHistoryModal(false);
  };

  // Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Copy message
  const handleCopyMessage = (id, text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Feedback 👍 / 👎
  const handleFeedback = (id, type) => {
    setFeedbackGiven(prev => ({ ...prev, [id]: type }));
  };

  // Voice recording via Web Speech API
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'ta' ? 'உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை.' : 'Speech recognition not supported.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Send Message with Live Streaming
  const handleSend = async (customText = null) => {
    const query = (typeof customText === 'string' ? customText : input).trim();
    if (!query && !selectedImage) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: query || (lang === 'ta' ? 'பயிர் புகைப்படம் ஆய்வுக்காக அனுப்பப்பட்டது' : 'Field photograph submitted for analysis.'),
      image: imagePreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    const chatHistory = messages.slice(-5).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      await api.streamChatAdvisor({
        message: query || "Analyze crop photograph",
        surveyNumber: activeParcel?.survey_number || "1342",
        imageFile: selectedImage,
        history: chatHistory,
        lang,
        simulateOutage,
        onToken: (tokenChunk) => {
          setStreamingText(tokenChunk);
        },
        onComplete: (result) => {
          const botMessageId = `msg-bot-${Date.now()}`;
          const botMsg = {
            id: botMessageId,
            sender: 'bot',
            text: result.reply,
            modelUsed: result.model_used,
            riskTier: result.risk_tier,
            toolsCalled: result.tools_called,
            sources: result.sources,
            confidence: result.confidence_score,
            isFallback: result.is_fallback,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          setMessages(prev => [...prev, botMsg]);
          setStreamingText('');
          setIsLoading(false);
          removeImage();

          if (isVoiceOutputEnabled) {
            setTimeout(() => {
              speakMessage(result.reply, messages.length);
            }, 300);
          }
        },
        onError: (err) => {
          console.error("Stream error:", err);
          setIsLoading(false);
          setStreamingText('');
        }
      });

    } catch (e) {
      console.error("Chat error:", e);
      setIsLoading(false);
      setStreamingText('');
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUser) {
      handleSend(lastUser.text);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = lang === 'ta' ? QUICK_PROMPTS_TA : QUICK_PROMPTS_EN;

  return (
    <div 
      className={embedded 
        ? "w-full bg-white rounded-3xl border-2 border-emerald-200 shadow-md flex flex-col h-[640px] sm:h-[680px] overflow-hidden" 
        : "fixed inset-y-0 right-0 z-[1500] w-full max-w-md bg-white shadow-2xl border-l-2 border-emerald-200 flex flex-col h-full"}
      role="region"
      aria-label="AI Farm Advisor Chatbot"
    >
      {/* ─── 1. CHAT HEADER WITH PARCEL CONTEXT & CONTROLS ─── */}
      <div className="px-4 py-3 bg-emerald-800 text-white shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm sm:text-base leading-tight">
                  {lang === 'ta' ? 'FarmwiseAI உதவியாளர்' : 'FarmwiseAI Advisor'}
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-emerald-200">
                {lang === 'ta' ? 'TNAU வழிகாட்டல் • நேரடி வானிலை & சந்தை' : 'TNAU Verified • Live Weather & Mandi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              title={lang === 'ta' ? 'புதிய உரையாடல்' : 'New Chat'}
              className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline text-[11px]">{lang === 'ta' ? 'புதியது' : 'New'}</span>
            </button>

            {/* Saved Chat History Button */}
            {savedSessions.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                title="View Past Chats"
                className="p-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors cursor-pointer"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Voice Read-aloud Toggle */}
            <button
              onClick={() => {
                stopSpeaking();
                setIsVoiceOutputEnabled(prev => !prev);
              }}
              title={isVoiceOutputEnabled ? "Mute Voice Read-Aloud" : "Enable Voice Read-Aloud"}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isVoiceOutputEnabled ? 'bg-emerald-700 text-white' : 'bg-emerald-900 text-emerald-400'
              }`}
            >
              {isVoiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {!embedded && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Active Context Pill */}
        <div className="flex items-center justify-between text-[11px] bg-emerald-900/80 px-2.5 py-1 rounded-xl font-medium">
          <span className="truncate">
            📍 <b>#{activeParcel?.survey_number || '1342'}</b> • {tCrop(activeParcel?.recorded_crop || 'Coconut', lang)} • {activeParcel?.village_name || 'Sivagiri'}
          </span>
          <span className="text-emerald-300 font-bold shrink-0 ml-1">
            {lang === 'ta' ? 'இணைக்கப்பட்டுள்ளது' : 'Linked'}
          </span>
        </div>

        {/* Officer View: Outage Fallback Simulator Toggle */}
        {isOfficerView && (
          <div className="flex items-center justify-between bg-slate-900 px-2.5 py-1 rounded-xl text-[10px] text-amber-300 font-bold">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ta' ? 'அதிகாரி மாதிரி: முறிப்பான் உருவகப்படுத்துதல்' : 'Officer Demo: Simulate Outage'}</span>
            </span>
            <button
              onClick={() => setSimulateOutage(prev => !prev)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                simulateOutage ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {simulateOutage ? 'OUTAGE ON' : 'NORMAL'}
            </button>
          </div>
        )}
      </div>

      {/* ─── 2. SCROLLABLE MESSAGES CONTAINER ─── */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/60"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const isLastBot = !isUser && idx === messages.length - 1;

          return (
            <div 
              key={msg.id || idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-xs ${
                  isUser 
                    ? 'bg-emerald-700 text-white rounded-br-xs font-medium' 
                    : 'bg-white text-slate-900 border-2 border-slate-200/90 rounded-bl-xs'
                }`}
              >
                {/* User Image Attachment Preview */}
                {msg.image && (
                  <div className="mb-2 rounded-xl overflow-hidden border border-emerald-600 max-h-40">
                    <img src={msg.image} alt="User field attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Formatted Text */}
                <div className="space-y-1">
                  {renderFormattedMarkdown(msg.text)}
                </div>

                {/* Bot Metadata & Citations */}
                {!isUser && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 font-medium">
                    <div className="flex flex-wrap items-center gap-1">
                      {/* Risk Tier Badge */}
                      {msg.riskTier === 'HIGH' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold">
                          Tier 3: Frontier Guard
                        </span>
                      )}
                      {msg.toolsCalled && msg.toolsCalled.length > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          <Wrench className="w-2.5 h-2.5" />
                          <span>{msg.toolsCalled.join(', ')}</span>
                        </span>
                      )}
                      {msg.isFallback && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                          Circuit Breaker Failover
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-[9px]">{msg.time}</span>
                  </div>
                )}

                {/* Source Citation Tags */}
                {!isUser && msg.sources && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {msg.sources.map((s, sIdx) => (
                      <span key={sIdx} className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bot Action Tools (Copy, TTS, Feedback, Regenerate) */}
              {!isUser && (
                <div className="flex items-center gap-2 mt-1 px-1 text-slate-500 text-xs">
                  {/* TTS Read Aloud */}
                  <button
                    onClick={() => speakMessage(msg.text, idx)}
                    className="hover:text-emerald-700 transition-colors cursor-pointer p-0.5"
                    title="Read Aloud"
                  >
                    {isSpeaking && currentlySpeakingIdx === idx ? (
                      <VolumeX className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(msg.id, msg.text)}
                    className="hover:text-emerald-700 transition-colors cursor-pointer p-0.5 flex items-center gap-0.5"
                    title="Copy Answer"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {/* Regenerate Button (on latest bot message) */}
                  {isLastBot && (
                    <button
                      onClick={handleRegenerate}
                      className="hover:text-emerald-700 transition-colors cursor-pointer p-0.5"
                      title="Regenerate Answer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Feedback Thumbs */}
                  <button
                    onClick={() => handleFeedback(msg.id, 'up')}
                    className={`hover:text-emerald-700 transition-colors cursor-pointer p-0.5 ${
                      feedbackGiven[msg.id] === 'up' ? 'text-emerald-700 font-bold' : ''
                    }`}
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(msg.id, 'down')}
                    className={`hover:text-red-700 transition-colors cursor-pointer p-0.5 ${
                      feedbackGiven[msg.id] === 'down' ? 'text-red-600 font-bold' : ''
                    }`}
                    title="Not Helpful"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Live Streaming Token Preview Bubble */}
        {isLoading && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="max-w-[85%] rounded-2xl rounded-bl-xs p-3.5 bg-white text-slate-900 border-2 border-emerald-300 shadow-sm text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'ta' ? 'பதிலளிக்கிறது...' : 'Generating verified response...'}</span>
              </div>
              <div className="text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                {streamingText || "..."}
                <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-600 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. TAMIL QUICK-REPLY CHIPS ─── */}
      <div className="px-3 pt-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((chip, cIdx) => (
          <button
            key={cIdx}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-950 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Image Preview bar if photo attached */}
      {imagePreview && (
        <div className="px-3 py-1.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={imagePreview} alt="Attached crop" className="w-8 h-8 rounded-lg object-cover border border-slate-300" />
            <span className="text-xs font-bold text-emerald-900 truncate max-w-[200px]">{selectedImage?.name}</span>
          </div>
          <button onClick={removeImage} className="text-emerald-700 hover:text-red-600 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── 4. INPUT CONTROLS: TEXT, PHOTO ATTACH, MIC, SEND ─── */}
      <div className="p-3 bg-white border-t-2 border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5"
        >
          {/* Photo Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={lang === 'ta' ? 'புகைப்படம் இணைக்க' : 'Attach photo'}
            className="min-h-[46px] min-w-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Camera className="w-5 h-5 text-emerald-700" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />

          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={startVoiceInput}
            title={isRecording ? "Stop Listening" : "Speak in Tamil or English"}
            className={`min-h-[46px] min-w-[46px] rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isRecording 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Field */}
          <input
            id="live-chatbot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              lang === 'ta' 
                ? 'கேள்வி கேட்கவும் (எ.கா. உரம், விலை)...' 
                : 'Ask farm questions (e.g. fertilizer, price)...'
            }
            disabled={isLoading}
            className="flex-1 min-h-[46px] px-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="min-h-[46px] min-w-[46px] bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {/* ─── 5. SAVED CHAT SESSIONS MODAL ─── */}
      {showHistoryModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-2xl border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'ta' ? 'சேமிக்கப்பட்ட உரையாடல்கள்' : 'Saved Conversations'}</span>
              </h4>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedSessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleLoadSession(s)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{s.title}</p>
                  <span className="text-[10px] text-slate-500 font-mono">{s.timestamp}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
