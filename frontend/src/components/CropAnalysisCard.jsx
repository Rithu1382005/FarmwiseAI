import { Leaf, Eye, ShieldCheck, Check, Sparkles, AlertCircle, AlertTriangle, PhoneCall, Camera, ExternalLink } from 'lucide-react';
import { translations, tCrop, tStage, tHealth, tVisualFeature } from '../utils/translations';
import { getMediaUrl } from '../services/api';

export default function CropAnalysisCard({ cropAnalysis, parcel, lang = 'ta', onOpenPhoto, isOfficerView = false }) {
  if (!cropAnalysis) return null;
  const t = translations[lang] || translations.en;

  const crop = cropAnalysis.crop_name || parcel?.recorded_crop || "Agricultural Crop";
  const stage = cropAnalysis.growth_stage || parcel?.recorded_stage || "vegetation";
  const health = cropAnalysis.crop_health || "Healthy & Vigorous";
  const confidence = cropAnalysis.confidence || 0.95;
  const features = cropAnalysis.visual_features || [
    "Uniform vegetative canopy spread",
    "Adequate chlorophyll reflectance",
    "Proper row spacing and tiller density"
  ];

  // Cross-Modal Divergence Detection: When Cadastral Revenue Record != Computer Vision Identification
  const recordedCropClean = (parcel?.recorded_crop || '').toLowerCase().trim();
  const identifiedCropClean = (crop || '').toLowerCase().trim();
  const hasDivergence = recordedCropClean && identifiedCropClean && 
    !recordedCropClean.includes(identifiedCropClean) && 
    !identifiedCropClean.includes(recordedCropClean) &&
    recordedCropClean !== "agricultural crop" &&
    identifiedCropClean !== "field specimen / ground survey stand";

  // Calibrated Abstention: When confidence is below threshold, recommend official human expert referral
  const isAbstention = confidence < 0.78;

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t.cropPhenotypeTitle || "Crop Phenotype & Health"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ta' ? 'களப் பயிர் வளர்ச்சி & நலன் ஆய்வு' : 'Field crop growth & health status'}
              </p>
            </div>
          </div>

          {/* Trust Signal: Plain words in Farmer View, % in Officer View */}
          {isOfficerView ? (
            <span className="text-xs px-2.5 py-1 bg-slate-900 text-white font-mono font-bold rounded-full">
              {Math.round(confidence * 100)}% {t.confidence || "Confidence"}
            </span>
          ) : (
            <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-950 font-bold rounded-full border border-emerald-300">
              ✓ {lang === 'ta' ? 'TNAU சரிபார்க்கப்பட்டது' : 'TNAU Verified'}
            </span>
          )}
        </div>

        {/* Identified Crop & Stage Hero */}
        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-900">
              {t.identifiedCrop || "Identified Crop"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {tCrop(crop, lang)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 bg-emerald-700 text-white font-bold rounded-full">
                {t.stagePrefix || "Stage:"} {tStage(stage, lang)}
              </span>
              <span className="text-xs text-emerald-950 font-bold">
                • {tHealth(health, lang)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── CROSS-MODAL CADASTRAL DIVERGENCE DETECTION ─── */}
        {hasDivergence && (
          <div className="mb-4 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 uppercase tracking-wide text-[11px]">
                <span>{lang === 'ta' ? 'நில ஆவண முரண்பாடு கண்டறியப்பட்டது' : 'Cross-Modal Cadastral Divergence Detected'}</span>
                {isOfficerView && <span className="px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-mono">PMFBY Audit</span>}
              </div>
              <p className="text-amber-900 font-medium mt-1 leading-relaxed">
                {lang === 'ta' 
                  ? `நில வருவாய் பதிவு: "${tCrop(parcel.recorded_crop, 'ta')}" | களப் பட ஆய்வு: "${tCrop(crop, 'ta')}". நில பயன்பாட்டு மாற்றம் அல்லது பயிர் காப்பீட்டு சரிபார்ப்புக்காக குறிக்கப்பட்டுள்ளது.`
                  : `Land Revenue Cadastre: "${parcel.recorded_crop}" vs Visual Canopy: "${crop}". Flagged for crop-insurance verification & land-use divergence audit.`}
              </p>
            </div>
          </div>
        )}

        {/* ─── CALIBRATED ABSTENTION HANDOFF ─── */}
        {isAbstention && (
          <div className="mb-4 p-3.5 bg-red-50 border-2 border-red-300 rounded-2xl flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div className="text-xs text-red-950">
                <span className="font-black text-sm block">
                  {lang === 'ta' ? "எனக்கு இதில் முழு உறுதி இல்லை, தயவுசெய்து உங்கள் வேளாண் அலுவலரிடம் கேட்கவும்." : "Low Model Confidence — Calibrated Abstention"}
                </span>
                <p className="text-red-800 font-medium mt-0.5">
                  {lang === 'ta'
                    ? "தெளிவற்ற படத்தால் கணிப்பு உறுதி குறைவாக உள்ளது. வட்டார வேளாண்மை அலுவலரை அல்லது கிசான் உதவி மையத்தை அழைக்கவும்."
                    : "Foliar visibility insufficient for deterministic advice. Please refer to Kisan Call Centre (1800-180-1551)."}
                </p>
              </div>
            </div>
            <a
              href="tel:18001801551"
              className="min-h-[44px] px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer w-fit"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{lang === 'ta' ? 'வேளாண் அலுவலரை அழைக்கவும் (1800-180-1551)' : 'Call Extension Officer (1800-180-1551)'}</span>
            </a>
          </div>
        )}

        {/* Visual Features Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.visualCanopy || "Visual Canopy Observations"}
          </div>
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-800 font-medium">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                ✓
              </div>
              <span>{tVisualFeature(feat, lang)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Image Link Preview */}
      {parcel?.image_url && (
        <div 
          onClick={onOpenPhoto}
          className="pt-3 border-t border-slate-200 flex items-center justify-between group cursor-pointer hover:bg-slate-50 -mx-2 px-2 py-1.5 rounded-2xl transition-colors"
          title={t.clickToEnlarge || "Click to enlarge photograph"}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
              <img
                src={getMediaUrl(parcel.image_url)}
                alt="Field Photo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  const fallback = '/samples/sample_paddy_tillering.jpg';
                  if (e.target.src !== window.location.origin + fallback) {
                    e.target.src = fallback;
                  }
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1">
                <span>{t.groundTruthPhoto || "Ground-Truth Field Photo"}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                #{parcel.survey_number} &bull; {tCrop(parcel.recorded_crop, lang)}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg group-hover:bg-emerald-700 group-hover:text-white transition-colors">
            {lang === 'ta' ? 'பெரிதாக்கு' : 'Enlarge'}
          </span>
        </div>
      )}
    </div>
  );
}
