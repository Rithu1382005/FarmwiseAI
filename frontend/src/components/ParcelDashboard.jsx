import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  Printer, 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Lock,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import ParcelMap from './ParcelMap';
import CropAnalysisCard from './CropAnalysisCard';
import WeatherCard from './WeatherCard';
import AdvisoryCard from './AdvisoryCard';
import SoilHealthCard from './SoilHealthCard';
import DecisionTraceModal from './DecisionTraceModal';
import AdvisoryVerdictCard from './AdvisoryVerdictCard';
import { translations, tCrop, tStage } from '../utils/translations';
import { getMediaUrl, getCropSampleFallback } from '../services/api';

export default function ParcelDashboard({ 
  lang = 'ta', 
  advisoryData, 
  onNewSearch,
  isOfficerView = false,
  setIsOfficerView
}) {
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const t = translations[lang] || translations.en;

  if (!advisoryData || !advisoryData.parcel) return null;

  const parcel = advisoryData.parcel;
  const crop = advisoryData.crop_analysis;
  const weather = advisoryData.weather;
  const verification = advisoryData.verification;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* ─── 1. ADVISORY VERDICT FIRST (Traffic-Light Summary + Voice Read Aloud) ─── */}
      <AdvisoryVerdictCard
        advisoryData={advisoryData}
        lang={lang}
        isOfficerView={isOfficerView}
        onToggleOfficerView={() => setIsOfficerView(prev => !prev)}
        onOpenTrace={() => setIsTraceOpen(true)}
      />

      {/* ─── 2. PARCEL IDENTITY STRIP (High Contrast & Sunlight Readable) ─── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <span>{parcel.district || "Tenkasi"}</span>
              <span>/</span>
              <span>{parcel.taluk || "Sivagiri"}</span>
              <span>/</span>
              <span className="text-emerald-800 font-extrabold">{parcel.village_name || "Sivagiri"}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {lang === 'ta' ? 'நிலப் புல எண்' : 'Survey Parcel'} #{parcel.survey_number}
              {parcel.sub_division && (
                <span className="text-slate-400 font-semibold text-lg"> / {parcel.sub_division}</span>
              )}
            </h1>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-950 rounded-full border border-emerald-200 font-bold">
                <span>{lang === 'ta' ? 'பயிர்:' : 'Crop:'}</span>
                <span className="text-emerald-800">{tCrop(parcel.recorded_crop, lang)}</span>
                {parcel.recorded_stage && (
                  <span className="text-emerald-700 font-medium">({tStage(parcel.recorded_stage, lang)})</span>
                )}
              </span>

              {isOfficerView && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-mono text-[11px]">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>{parcel.latitude.toFixed(4)}°N, {parcel.longitude.toFixed(4)}°E</span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons (Trace & Print visible in Officer View or expandable) */}
          <div className="flex items-center gap-2 shrink-0">
            {isOfficerView && (
              <button
                onClick={() => setIsTraceOpen(true)}
                className="min-h-[44px] px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ta' ? 'AI முடிவெடுக்கும் படிநிலைகள் (Trace)' : 'Decision Trace'}</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
              title="Print Crop Evidence Report PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{lang === 'ta' ? 'அறிக்கை PDF' : 'Evidence PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. MAIN CONTENT: CROP PHOTO & PHENOTYPE + WEATHER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Field Photograph + (In Officer View: Cadastral Map) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Field Photograph Card */}
          {parcel.image_url && (
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'ta' ? 'களப் பயிர் புகைப்படம்' : 'Field Crop Photograph'}
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {parcel.timestamp || '2024-11-08'}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                <img
                  src={getMediaUrl(parcel.image_url)}
                  alt={`Field Photo for Survey ${parcel.survey_number}`}
                  className="w-full h-64 sm:h-80 object-cover group-hover:scale-102 transition-transform duration-300"
                  onError={(e) => {
                    const fallback = getCropSampleFallback(parcel.recorded_crop);
                    if (e.target.src !== window.location.origin + fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 text-white">
                  <div className="font-black text-base">
                    {tCrop(parcel.recorded_crop, lang)} ({tStage(parcel.recorded_stage, lang)})
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OFFICER VIEW ONLY: Interactive Cadastral Map & FMB Boundary */}
          {isOfficerView ? (
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-900 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-base">
                    {lang === 'ta' ? 'அதிகாரி பார்வை: நிலப் புல எல்லை (FMB GIS)' : 'Officer View: Cadastral Boundary (FMB GIS)'}
                  </h3>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                  Officer Mode
                </span>
              </div>
              <ParcelMap parcel={parcel} lang={lang} />
            </div>
          ) : null}
        </div>

        {/* Right Column (5 cols): Phenotype Diagnostic + Weather Card */}
        <div className="lg:col-span-5 space-y-6">
          <CropAnalysisCard
            cropAnalysis={crop}
            parcel={parcel}
            lang={lang}
            isOfficerView={isOfficerView}
          />

          <div id="weather-card">
            <WeatherCard weather={weather} lang={lang} />
          </div>
        </div>
      </div>

      {/* ─── 4. SOIL HEALTH CARD & NUTRIENT PROFILE ─── */}
      <div id="soil-card" className="scroll-mt-6">
        <SoilHealthCard
          soilProfile={advisoryData.soil_profile || parcel.soil_profile}
          lang={lang}
          isOfficerView={isOfficerView}
        />
      </div>

      {/* ─── 5. COMPLETE ADVISORY DOSSIER ─── */}
      <AdvisoryCard
        advisoryData={advisoryData}
        lang={lang}
        isOfficerView={isOfficerView}
        onOpenTrace={() => setIsTraceOpen(true)}
      />

      {/* Decision Trace Modal (when open) */}
      <DecisionTraceModal
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        executionTrace={advisoryData.execution_trace}
        verification={verification}
        lang={lang}
      />
    </div>
  );
}
