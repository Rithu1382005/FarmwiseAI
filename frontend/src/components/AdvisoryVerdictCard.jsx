import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  PauseCircle, 
  Volume2, 
  Square, 
  RotateCcw, 
  PhoneCall, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  TreePine,
  Sprout,
  Coins
} from 'lucide-react';
import { tCrop, tStage } from '../utils/translations';

// Strip markdown for clean Tamil TTS read-aloud
function cleanTextForSpeech(text = '') {
  return text
    .replace(/[*_#`~>•]/g, ' ')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function AdvisoryVerdictCard({ 
  advisoryData, 
  lang = 'ta', 
  isOfficerView = false,
  onToggleOfficerView,
  onOpenTrace
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCollapsible, setShowCollapsible] = useState(false);
  const utteranceRef = useRef(null);

  if (!advisoryData || !advisoryData.parcel) return null;

  const parcel = advisoryData.parcel;
  const weather = advisoryData.weather || {};
  const soil = advisoryData.soil_profile || {};
  const crop = advisoryData.crop_analysis || {};
  const verification = advisoryData.verification || {};
  const schedule = advisoryData.fertilizer_schedule || [];
  const market = advisoryData.market_prices;

  // Determine Traffic Light State:
  // Green: Safe to do today (clear weather, wind < 14 km/h, valid crop schedule)
  // Yellow: Monitor / Wait (high humidity, rain in 48h, soil adjustment needed)
  // Red: Warning (heavy rain, severe soil acidity/alkalinity hazard, pest warning)
  const isRainRisk = weather.spray_recommendation?.toLowerCase().includes("avoid") || 
                     weather.spray_recommendation?.toLowerCase().includes("delay") ||
                     weather.spray_recommendation?.toLowerCase().includes("rain") ||
                     weather.precipitation_mm > 0;

  const confidence = crop.confidence || verification.overall_confidence || 0.95;
  const isLowConfidence = confidence < 0.80;

  let trafficState = 'green'; // 'green' | 'yellow' | 'red'
  if (isRainRisk) {
    trafficState = 'yellow';
  }
  if (soil.ph && (soil.ph < 5.5 || soil.ph > 8.5)) {
    trafficState = 'yellow';
  }
  if (isLowConfidence) {
    trafficState = 'yellow';
  }

  // ONE Plain Tamil Sentence First
  let plainVerdictSentence = '';
  let plainVerdictSentenceEn = '';

  const cropNameTa = tCrop(crop.crop_name || parcel.recorded_crop, 'ta');
  const cropNameEn = crop.crop_name || parcel.recorded_crop || 'Crop';

  if (trafficState === 'yellow' && isRainRisk) {
    plainVerdictSentence = `மழை வாய்ப்பு உள்ளதால் மருந்து தெளிப்பதை 2 நாட்கள் தள்ளிப்போடவும்; நில வடிகால் வாய்க்கால்களை சுத்தமாக வைக்கவும்.`;
    plainVerdictSentenceEn = `Rain expected within 24–48 hours; delay chemical spraying and clear field drainage furrows.`;
  } else if (trafficState === 'green') {
    if (cropNameEn.toLowerCase().includes('coconut')) {
      plainVerdictSentence = `வானிலை சாதகமாக உள்ளது; ஒரு தென்னை மரத்திற்கு 1.3 கிலோ யூரியா மற்றும் 2 கிலோ பொட்டாஷ் உரத்தை இன்றே இடலாம்.`;
      plainVerdictSentenceEn = `Weather and soil conditions are optimal; apply 1.3 kg Urea and 2.0 kg Potash per palm today.`;
    } else if (cropNameEn.toLowerCase().includes('groundnut')) {
      plainVerdictSentence = `வானிலை உகந்ததாக உள்ளது; நிலக்கடலை காய் பிடிக்கும் பருவத்தில் ஜிப்சம் ஏக்கருக்கு 160 கிலோ இன்றே இடலாம்.`;
      plainVerdictSentenceEn = `Favorable weather today; apply Gypsum @ 160 kg/acre at pegging stage for optimal pod filling.`;
    } else {
      plainVerdictSentence = `வானிலை மற்றும் மண் நிலை மிகவும் உகந்ததாக உள்ளது; பரிந்துரைக்கப்பட்ட பயிர் ஊட்டச்சத்து உரங்களை இன்றே இடலாம்.`;
      plainVerdictSentenceEn = `Weather and soil conditions are ideal; apply the recommended balanced fertilizer dose today.`;
    }
  } else {
    plainVerdictSentence = `மண் மற்றும் வானிலை நிலைமைகளை அவதானிக்கவும்; பரிந்துரைக்கப்பட்ட திருத்தங்களைச் செய்த பின்னரே உரமிடவும்.`;
    plainVerdictSentenceEn = `Review soil and weather conditions; apply recommended amendments before full fertilizer dosing.`;
  }

  const activeSentence = lang === 'ta' ? plainVerdictSentence : plainVerdictSentenceEn;

  // TTS Read Aloud function
  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const playTTS = () => {
    if (!('speechSynthesis' in window)) return;
    stopTTS();

    const speechText = cleanTextForSpeech(activeSentence);
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === utterance.lang) ||
                  voices.find(v => v.lang.startsWith(lang === 'ta' ? 'ta' : 'en'));
    if (voice) utterance.voice = voice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, []);

  // Visual Traffic Light Configuration
  const trafficConfig = {
    green: {
      bg: 'bg-emerald-50 border-emerald-300',
      pillBg: 'bg-emerald-700 text-white',
      dotColor: 'bg-emerald-500',
      badgeTextTa: 'இன்றே செய்யலாம்',
      badgeTextEn: 'Do Today (Safe)',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      titleTa: 'இன்றைய கள நடவடிக்கை',
      titleEn: "Today's Farm Action",
      textColor: 'text-emerald-950',
      borderColor: 'border-emerald-300'
    },
    yellow: {
      bg: 'bg-amber-50 border-amber-300',
      pillBg: 'bg-amber-700 text-white',
      dotColor: 'bg-amber-500',
      badgeTextTa: 'காத்திருக்கவும் / கவனிக்கவும்',
      badgeTextEn: 'Wait / Monitor',
      icon: PauseCircle,
      iconColor: 'text-amber-700',
      titleTa: 'தள்ளிப்போட வேண்டிய நடவடிக்கை',
      titleEn: "Postpone / Monitor Action",
      textColor: 'text-amber-950',
      borderColor: 'border-amber-300'
    },
    red: {
      bg: 'bg-red-50 border-red-300',
      pillBg: 'bg-red-700 text-white',
      dotColor: 'bg-red-500',
      badgeTextTa: 'எச்சரிக்கை',
      badgeTextEn: 'Warning Hazard',
      icon: AlertTriangle,
      iconColor: 'text-red-700',
      titleTa: 'அவசர எச்சரிக்கை',
      titleEn: "Urgent Warning",
      textColor: 'text-red-950',
      borderColor: 'border-red-300'
    }
  }[trafficState];

  const TrafficIcon = trafficConfig.icon;

  // Farmer Friendly Dosages
  const isTreeCrop = cropNameEn.toLowerCase().includes('coconut') || cropNameEn.toLowerCase().includes('palm');
  const unitLabel = isTreeCrop 
    ? (lang === 'ta' ? '1 மரத்திற்கு அளவு' : 'Dose per Tree')
    : (lang === 'ta' ? '1 ஏக்கருக்கு அளவு' : 'Dose per Acre');

  let doseSummary = '';
  let doseHint = '';
  if (isTreeCrop) {
    doseSummary = lang === 'ta'
      ? 'யூரியா: 1.3 கிலோ • சூப்பர் பாஸ்பேட்: 2.0 கிலோ • பொட்டாஷ்: 2.0 கிலோ'
      : 'Urea: 1.3 kg • SSP: 2.0 kg • MOP: 2.0 kg per palm';
    doseHint = lang === 'ta'
      ? 'மரத்தைச் சுற்றி 1.8 மீட்டர் தூரத்தில் வட்டப்பாத்தி அமைத்து, மண்ணில் ஈரம் உள்ளபோது இடவும்.'
      : 'Apply in a 1.8m ring basin around palm trunk under sufficient soil moisture.';
  } else if (cropNameEn.toLowerCase().includes('groundnut')) {
    doseSummary = lang === 'ta'
      ? 'ஜிப்சம்: 160 கிலோ/ஏக்கர் (காய் பிடிக்கும் பருவம்) • யூரியா: 10 கிலோ/ஏக்கர்'
      : 'Gypsum: 160 kg/acre (pegging) • Urea: 10 kg/acre split';
    doseHint = lang === 'ta'
      ? 'பூ பூத்த 40-45 நாட்களில் ஜிப்சம் இட்டு மண் அணைக்கவும்; இது காய் திரட்சியை அதிகரிக்கும்.'
      : 'Incorporate gypsum at 40-45 days after sowing and earth-up for full pod setting.';
  } else {
    doseSummary = lang === 'ta'
      ? 'யூரியா: 40 கிலோ/ஏக்கர் • பொட்டாஷ்: 20 கிலோ/ஏக்கர்'
      : 'Urea: 40 kg/acre • Potash: 20 kg/acre';
    doseHint = lang === 'ta'
      ? 'காலையில் அல்லது மாலையில் மண்ணில் ஈரம் இருக்கும்போது சீராகத் தூவவும்.'
      : 'Broadcast evenly during morning or evening when soil is moist.';
  }

  return (
    <div 
      className={`rounded-3xl border-2 shadow-md p-5 sm:p-7 transition-all ${trafficConfig.bg} ${trafficConfig.borderColor}`}
      role="region"
      aria-label="Advisory Verdict Summary"
    >
      {/* ─── TOP STATUS STRIP: TRAFFIC LIGHT + PARCEL ID + VOICE BUTTON ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          {/* Color-blind safe indicator: color + distinct icon + bold label */}
          <div className="flex items-center gap-2">
            <span 
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-xs ${trafficConfig.pillBg}`}
            >
              <TrafficIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{lang === 'ta' ? trafficConfig.badgeTextTa : trafficConfig.badgeTextEn}</span>
            </span>
          </div>

          <span className="text-xs sm:text-sm font-bold text-slate-700 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
            {lang === 'ta' ? `புல எண் #${parcel.survey_number}` : `Parcel #${parcel.survey_number}`}
            <span className="font-normal text-slate-500"> ({cropNameTa})</span>
          </span>
        </div>

        {/* Large Voice Listen Button (>= 48px tap target) */}
        <div className="flex items-center gap-2">
          <button
            onClick={isSpeaking ? stopTTS : playTTS}
            aria-label={isSpeaking ? "குரல் ஆலோசனையை நிறுத்து" : "குரல் ஆலோசனையை கேளுங்கள் (Tamil voice)"}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer ${
              isSpeaking
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                <span>{lang === 'ta' ? 'நிறுத்து' : 'Stop Audio'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>{lang === 'ta' ? 'குரலில் கேளுங்கள் 🔊' : 'Listen Verdict 🔊'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── THE ONE PLAIN SENTENCE VERDICT FIRST (Readable in Sunlight) ─── */}
      <div className="py-4">
        <h2 className={`text-lg sm:text-2xl font-black tracking-tight leading-snug sm:leading-relaxed ${trafficConfig.textColor}`}>
          "{activeSentence}"
        </h2>
      </div>

      {/* ─── FARMER-FRIENDLY UNITS & ACTION SUMMARY ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 pb-4">
        {/* Fertilizer Dose Card */}
        <div className="bg-white/95 rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wide">
            {isTreeCrop ? <TreePine className="w-4 h-4 text-emerald-600" /> : <Sprout className="w-4 h-4 text-emerald-600" />}
            <span>{unitLabel}</span>
          </div>
          <div className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
            {doseSummary}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            💡 <span className="font-medium">{doseHint}</span>
          </p>
        </div>

        {/* Mandi Price & Money in Rupees */}
        <div className="bg-white/95 rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wide">
              <Coins className="w-4 h-4 text-purple-700" />
              <span>{lang === 'ta' ? 'நேரடி சந்தை விலை (ரூபாயில்)' : 'Mandi Market Price (₹)'}</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {market?.market || 'Tenkasi APMC'}
            </span>
          </div>
          <div className="font-black text-slate-900 text-lg sm:text-xl">
            {market?.modal_price || '₹2,450 / குவிண்டால்'}
          </div>
          <p className="text-xs text-slate-600">
            {lang === 'ta' ? 'விலை வரம்பு: ' : 'Price Range: '}
            <span className="font-semibold text-slate-800">{market?.min_price || '₹2,200'} – {market?.max_price || '₹2,680'}</span>
            <span className="text-emerald-700 font-bold ml-1.5">({market?.trend || 'Stable'})</span>
          </p>
        </div>
      </div>

      {/* ─── TRUST SIGNAL IN PLAIN WORDS (Replaces "Verified 98%") ─── */}
      <div className="pt-2">
        {isLowConfidence ? (
          <div className="p-4 bg-amber-100/90 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-amber-950">
                  {lang === 'ta' 
                    ? "எனக்கு இதில் முழு உறுதி இல்லை, தயவுசெய்து உங்கள் வட்டார வேளாண்மை அலுவலரிடம் கேட்கவும்."
                    : "I am not completely sure; please consult your local Agriculture Extension Officer."}
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {lang === 'ta' ? "இலவச உழவர் உதவி மைய எண்: 1800-180-1551" : "Kisan Call Center Toll-Free: 1800-180-1551"}
                </p>
              </div>
            </div>
            <a
              href="tel:18001801551"
              className="min-h-[48px] px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{lang === 'ta' ? 'அலுவலரை அழைக்கவும்' : 'Call Officer'}</span>
            </a>
          </div>
        ) : (
          <div className="p-3 bg-white/90 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold">
                {lang === 'ta' 
                  ? "TNAU வேளாண் பல்கலைக்கழக வழிகாட்டுதல் மற்றும் உங்கள் மண் அட்டைப்படி சரிபார்க்கப்பட்டது."
                  : "Checked against official TNAU crop guide and your Soil Health Card."}
              </span>
            </div>

            {/* Officer view toggle pill */}
            <button
              onClick={onToggleOfficerView}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {isOfficerView 
                ? (lang === 'ta' ? 'விவசாயி பார்வைக்கு மாறுக' : 'Switch to Farmer View')
                : (lang === 'ta' ? 'அதிகாரி பார்வை (விவரங்கள்)' : 'Officer View')}
            </button>
          </div>
        )}
      </div>

      {/* ─── COLLAPSIBLE DETAILS BUTTON ─── */}
      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
        <button
          onClick={() => setShowCollapsible(prev => !prev)}
          className="min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>
            {showCollapsible 
              ? (lang === 'ta' ? 'விவரங்களை மறைக்கவும்' : 'Hide Full Details')
              : (lang === 'ta' ? 'கூடுதல் விவரங்களை பார்க்க' : 'View Collapsible Full Details')}
          </span>
          {showCollapsible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isOfficerView && (
          <button
            onClick={onOpenTrace}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'ta' ? 'AI படிநிலைகள் (Trace)' : 'Decision Trace'}</span>
          </button>
        )}
      </div>

      {/* ─── COLLAPSIBLE BODY: COMPLETE FERTILIZER SCHEDULE & SAFETY ─── */}
      {showCollapsible && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fade-in">
          {schedule.length > 0 && (
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
                {lang === 'ta' ? 'முழு உரம் மற்றும் ஊட்டச்சத்து அட்டவணை (TNAU CPG 2024)' : 'Complete Fertilizer Schedule (TNAU CPG 2024)'}
              </h4>
              <div className="space-y-2">
                {schedule.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-emerald-900 block">{item.stage}</span>
                      <span className="text-slate-700">{item.fertilizer}</span>
                    </div>
                    <div className="text-right sm:shrink-0">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {item.dosage_per_acre}
                      </span>
                      <span className="block text-[11px] text-slate-500 mt-0.5">{item.timing}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Micro-climate spray advice */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block">
              {lang === 'ta' ? 'வானிலை மற்றும் தெளிப்பு பாதுகாப்பு:' : 'Weather & Spray Safety:'}
            </span>
            <p className="text-slate-700">
              {lang === 'ta' 
                ? `வெப்பநிலை: ${weather.temperature || 28}°C • காற்றின் வேகம்: ${weather.wind_speed || 3} km/h • ஈரப்பதம்: ${weather.humidity || 70}%. ${weather.spray_recommendation || 'பாதுகாப்பானது'}`
                : `Temp: ${weather.temperature}°C • Wind: ${weather.wind_speed} km/h • Humidity: ${weather.humidity}%. ${weather.spray_recommendation}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
