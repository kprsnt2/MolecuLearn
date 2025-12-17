
import React, { useState } from 'react';
import { DrugCandidate, Language } from '../types';
import { ShieldCheck, Beaker, Share2, ShieldAlert, HeartPulse, AlertCircle } from 'lucide-react';
import { translations } from '../translations';
import MoleculeViewer from './MoleculeViewer';

interface DrugCardProps {
  candidate: DrugCandidate;
  isBestOption?: boolean;
  language: Language;
}

const DrugCard: React.FC<DrugCardProps> = ({ candidate, isBestOption, language }) => {
  const isOriginal = candidate.type === 'Original';
  const t = translations[language];
  const [copied, setCopied] = useState(false);

  const criticalWarning = candidate.personalSafetyWarnings?.find(w => w.severity === 'Critical');

  const getBorderColor = () => {
    if (criticalWarning) return 'border-red-500 bg-red-950/10';
    if (isOriginal) return 'border-slate-600';
    if (candidate.safetyScore > 85) return 'border-emerald-500';
    return 'border-blue-500';
  };

  const handleShare = async () => {
    const textToShare = `🧪 MolecuLearn Pro Safety Alert\n\nDrug: ${candidate.name}\nSafety Score: ${candidate.safetyScore}%\nWarnings: ${candidate.personalSafetyWarnings?.map(w => w.reason).join(', ') || 'None'}`;
    if (navigator.share) {
      await navigator.share({ title: `MolecuLearn: ${candidate.name}`, text: textToShare });
    } else {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`relative rounded-xl p-6 border-l-4 ${getBorderColor()} shadow-lg flex flex-col h-full group transition-all duration-300`}>
      
      {criticalWarning && (
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse rounded-t-xl" />
      )}

      {isBestOption && !criticalWarning && (
        <div className="absolute top-0 right-0 -mt-3 -mr-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 uppercase tracking-tighter">
          <ShieldCheck size={10} />
          {t.topPick}
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isOriginal ? 'bg-slate-700 text-slate-300' : 'bg-indigo-900/50 text-indigo-300'
          }`}>
            {candidate.type}
          </span>
          <h3 className={`text-xl font-bold mt-2 ${criticalWarning ? 'text-red-400' : 'text-white'}`}>
            {candidate.name}
          </h3>
          <div className="flex items-center gap-2 text-slate-400 text-xs mt-1 font-mono">
            <Beaker size={12} />
            <span>{candidate.chemicalFormula}</span> 
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">{t.safetyScore}</span>
            <div className={`text-2xl font-black ${
                criticalWarning ? 'text-red-500' : 
                candidate.safetyScore > 80 ? 'text-emerald-400' : 'text-blue-400'
            }`}>
                {candidate.safetyScore}%
            </div>
        </div>
      </div>

      {/* Simplified Safety Alert Section */}
      {candidate.personalSafetyWarnings?.length > 0 && (
        <div className={`mb-4 p-4 rounded-xl border-2 ${
          criticalWarning ? 'bg-red-950/40 border-red-500/50' : 'bg-amber-950/30 border-amber-500/50'
        }`}>
          {candidate.personalSafetyWarnings.map((warning, idx) => (
            <div key={idx} className="flex gap-3 items-start">
              <div className="mt-1">
                {warning.severity === 'Critical' ? (
                  <ShieldAlert className="text-red-400" size={20} />
                ) : (
                  <AlertCircle className="text-amber-400" size={20} />
                )}
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-tight mb-1 ${
                  warning.severity === 'Critical' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {warning.severity === 'Critical' ? 'DANGER - STOP' : 'USE CAUTION'}
                </p>
                <p className="text-sm text-white font-medium leading-snug mb-2">{warning.reason}</p>
                <div className="bg-black/20 p-2 rounded-lg">
                  <p className="text-[11px] text-slate-300 italic"><span className="font-bold uppercase text-slate-400">Advice:</span> {warning.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
        <MoleculeViewer smiles={candidate.smiles} />
      </div>

      <div className="space-y-4 flex-grow">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase mb-1">
                <HeartPulse size={12} /> {t.mechanism}
            </div>
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                {candidate.mechanismOfAction}
            </p>
        </div>

        <div>
            <div className="flex flex-wrap gap-1">
                {candidate.sideEffects.slice(0, 3).map((effect, idx) => (
                    <span key={idx} className="bg-slate-900 text-slate-400 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                        {effect}
                    </span>
                ))}
            </div>
        </div>
      </div>

      <button 
        onClick={handleShare}
        className="mt-4 w-full py-2 flex justify-center items-center gap-2 text-[10px] font-bold uppercase bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white rounded border border-slate-800 transition-colors"
      >
        <Share2 size={12} /> {copied ? t.copied : t.share}
      </button>
    </div>
  );
};

export default DrugCard;
