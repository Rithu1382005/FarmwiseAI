import React from 'react';
import { Camera, MessageSquareText, TrendingUp, CloudSun } from 'lucide-react';
import { translations } from '../utils/translations';

export default function QuickActionCards({ 
  lang = 'ta', 
  onOpenUpload, 
  onOpenChat, 
  onOpenMarket, 
  onOpenWeather, 
  inline = false 
}) {
  const t = translations[lang] || translations.en;

  const actions = [
    {
      id: 'photo',
      title: lang === 'ta' ? 'படம் எடு' : 'Take Photo',
      subtitle: lang === 'ta' ? 'பயிர் & நோய் ஆய்வு' : 'Crop & Health Check',
      desc: lang === 'ta' ? 'புகைப்படம் எடுத்து உடனடி தீர்வு பெறவும்' : 'Snap photo for instant diagnosis',
      icon: Camera,
      badge: lang === 'ta' ? 'கேமரா' : 'Camera',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50/70 hover:bg-amber-100/80 active:bg-amber-200/90',
      borderColor: 'border-amber-300',
      textColor: 'text-amber-950',
      badgeColor: 'bg-amber-200/90 text-amber-900',
      onClick: onOpenUpload
    },
    {
      id: 'ask',
      title: lang === 'ta' ? 'கேளுங்கள்' : 'Ask Advisor',
      subtitle: lang === 'ta' ? 'AI விவசாய உதவியாளர்' : 'AI Farm Assistant',
      desc: lang === 'ta' ? 'உரம், பூச்சி மேலாண்மை பற்றி கேளுங்கள்' : 'Ask about fertilizers, pests, soil',
      icon: MessageSquareText,
      badge: lang === 'ta' ? 'குரல் / உரை' : 'Voice / Chat',
      color: 'from-emerald-600 to-green-700',
      bgColor: 'bg-emerald-50/70 hover:bg-emerald-100/80 active:bg-emerald-200/90',
      borderColor: 'border-emerald-300',
      textColor: 'text-emerald-950',
      badgeColor: 'bg-emerald-200/90 text-emerald-900',
      onClick: onOpenChat
    },
    {
      id: 'price',
      title: lang === 'ta' ? 'சந்தை விலை' : 'Mandi Price',
      subtitle: lang === 'ta' ? 'நேரடி APMC மண்டி' : 'Live APMC Rates',
      desc: lang === 'ta' ? 'தென்காசி, திருநெல்வேலி இன்றைய விலை' : 'Today’s mandi prices in rupees',
      icon: TrendingUp,
      badge: lang === 'ta' ? 'ரூபாயில்' : 'In Rupees (₹)',
      color: 'from-purple-600 to-indigo-700',
      bgColor: 'bg-purple-50/70 hover:bg-purple-100/80 active:bg-purple-200/90',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-950',
      badgeColor: 'bg-purple-200/90 text-purple-900',
      onClick: onOpenMarket
    },
    {
      id: 'weather',
      title: lang === 'ta' ? 'வானிலை' : 'Live Weather',
      subtitle: lang === 'ta' ? 'தெளிக்கும் நேரம் & மழை' : 'Spray & Rain Alert',
      desc: lang === 'ta' ? 'மருந்து தெளிக்க உகந்த நேரம் அறிய' : 'Safe window for spraying today',
      icon: CloudSun,
      badge: lang === 'ta' ? 'மழை ஆய்வு' : 'Agro-Met',
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50/70 hover:bg-blue-100/80 active:bg-blue-200/90',
      borderColor: 'border-blue-300',
      textColor: 'text-blue-950',
      badgeColor: 'bg-blue-200/90 text-blue-900',
      onClick: onOpenWeather
    }
  ];

  const gridClass = "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4";
  const containerClass = inline
    ? "w-full pt-2"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 relative z-20";

  return (
    <div className={containerClass} role="region" aria-label="Quick Farm Actions">
      <div className={gridClass}>
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              aria-label={`${act.title} - ${act.subtitle}`}
              className={`min-h-[110px] sm:min-h-[120px] p-3.5 sm:p-4 rounded-2xl border-2 ${act.borderColor} ${act.bgColor} shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between text-left group active:scale-[0.97] focus:outline-none focus:ring-3 focus:ring-emerald-500/30`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${act.badgeColor}`}>
                    {act.badge}
                  </span>
                </div>
                <h3 className={`font-black text-sm sm:text-base ${act.textColor} tracking-tight leading-tight`}>
                  {act.title}
                </h3>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-0.5 line-clamp-1">
                  {act.subtitle}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] font-bold text-slate-800">
                <span className="line-clamp-1">{lang === 'ta' ? 'தொடங்க' : 'Tap here'}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
