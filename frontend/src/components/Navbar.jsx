import React from 'react';
import { Sprout, ShieldAlert, UserCheck, Type } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Navbar({ 
  lang, 
  setLang, 
  fontSize = 'normal', 
  setFontSize,
  isOfficerView = false,
  setIsOfficerView,
  onOpenChat, 
  onResetHome 
}) {
  const t = translations[lang] || translations.en;

  const cycleFontSize = () => {
    if (fontSize === 'normal') setFontSize('large');
    else if (fontSize === 'large') setFontSize('xlarge');
    else setFontSize('normal');
  };

  const fontSizeLabel = {
    normal: 'A',
    large: 'A+',
    xlarge: 'A++'
  }[fontSize] || 'A';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Brand */}
          <div 
            onClick={onResetHome}
            className="flex items-center gap-2.5 cursor-pointer group"
            role="button"
            aria-label="Home"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-green-600 flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Farmwise<span className="text-emerald-600">AI</span>
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 hidden md:block">
                {lang === 'ta' ? 'தமிழ்நாடு விவசாயிகளுக்கான AI தளம்' : 'Tamil Nadu Agricultural AI Platform'}
              </p>
            </div>
          </div>

          {/* Right Controls: Font Size, Officer View Toggle, Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Font Size Accessibility Control (A- / A / A+) */}
            <button
              onClick={cycleFontSize}
              title={lang === 'ta' ? 'எழுத்து அளவை மாற்றவும்' : 'Adjust Text Size'}
              aria-label="Adjust font size"
              className="min-h-[42px] px-2.5 py-1.5 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
            >
              <Type className="w-3.5 h-3.5 text-slate-600" />
              <span>{fontSizeLabel}</span>
            </button>

            {/* Officer View / Farmer View Toggle */}
            <button
              onClick={() => setIsOfficerView(prev => !prev)}
              aria-label={isOfficerView ? "Switch to Farmer View" : "Switch to Officer View"}
              className={`min-h-[42px] px-3 py-1.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOfficerView
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              {isOfficerView ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{lang === 'ta' ? 'அதிகாரி பார்வை' : 'Officer View'}</span>
                  <span className="sm:hidden">Officer</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden sm:inline">{lang === 'ta' ? 'விவசாயி பார்வை' : 'Farmer View'}</span>
                  <span className="sm:hidden">Farmer</span>
                </>
              )}
            </button>

            {/* Language Selector (EN / தமிழ்) */}
            <div 
              className="flex items-center bg-slate-100 rounded-xl p-0.5 border-2 border-slate-200 text-xs font-bold"
              role="group"
              aria-label="Language selection"
            >
              <button
                onClick={() => setLang('ta')}
                aria-pressed={lang === 'ta'}
                className={`min-h-[38px] px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'ta' 
                    ? 'bg-emerald-700 text-white font-black shadow-xs' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                className={`min-h-[38px] px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en' 
                    ? 'bg-emerald-700 text-white font-black shadow-xs' 
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
