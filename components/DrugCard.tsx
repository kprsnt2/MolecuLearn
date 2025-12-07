import React, { useState } from 'react';
import { DrugCandidate, Language } from '../types';
import { ShieldCheck, AlertTriangle, Zap, Microscope, Beaker, Share2, Check } from 'lucide-react';
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

  // Dynamic border color based on safety score
  const getBorderColor = () => {
    if (isOriginal) return 'border-slate-600';
    if (candidate.safetyScore > 85) return 'border-emerald-500';
    if (candidate.safetyScore > 60) return 'border-blue-500';
    return 'border-amber-500';
  };

  const getTranslatedType = (type: string) => {
    // Attempt to map known types to translations if available, or fallback to type
    const map: Record<string, string> = (t.types || {});
    return map[type] || type;
  }

  const handleShare = async () => {
    const textToShare = `🧪 MolecuLearn Discovery\n\nName: ${candidate.name}\nType: ${candidate.type}\nSafety Score: ${candidate.safetyScore}/100\nEfficacy Score: ${candidate.efficacyScore}/100\n\nMechanism: ${candidate.mechanismOfAction}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MolecuLearn: ${candidate.name}`,
          text: textToShare,
        });
      } catch (err) {
        console.debug('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  return (
    <div className={`relative bg-slate-800 rounded-xl p-6 border-l-4 ${getBorderColor()} shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full group`}>
      
      {isBestOption && (
        <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse z-10">
          <ShieldCheck size={12} />
          {t.topPick}
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md ${
            isOriginal ? 'bg-slate-700 text-slate-300' : 'bg-indigo-900/50 text-indigo-300'
          }`}>
            {getTranslatedType(candidate.type)}
          </span>
          <h3 className="text-xl font-bold text-white mt-2 group-hover:text-emerald-400 transition-colors break-words">
            {candidate.name}
          </h3>
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1 font-mono flex-wrap">
            <Beaker size={14} className="shrink-0" />
            <span className="truncate max-w-[150px]" title={candidate.chemicalFormula}>{candidate.chemicalFormula}</span> 
            <span className="shrink-0">• {candidate.molecularWeight}</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-2 shrink-0">
             {/* Safety Score Block */}
            <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 mb-1">{t.safetyScore}</span>
                <div className={`text-2xl font-bold ${
                    candidate.safetyScore > 80 ? 'text-emerald-400' : 
                    candidate.safetyScore > 50 ? 'text-blue-400' : 'text-amber-400'
                }`}>
                    {candidate.safetyScore}/100
                </div>
            </div>
            
            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-emerald-400 transition-colors bg-slate-900/50 px-2 py-1.5 rounded-md border border-slate-700/50 hover:border-emerald-500/30"
              title={t.share}
            >
              {copied ? <Check size={12} /> : <Share2 size={12} />}
              {copied ? t.copied : t.share}
            </button>
        </div>
      </div>

      {/* Chemical Structure Visualization */}
      <div className="mb-4">
        <MoleculeViewer smiles={candidate.smiles} />
      </div>

      <div className="space-y-4 flex-grow">
        
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-1">
                <Microscope size={14} /> {t.mechanism}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
                {candidate.mechanismOfAction}
            </p>
        </div>

        <div>
           <div className="flex items-center gap-2 text-slate-400 text-sm font-medium mb-2">
                <AlertTriangle size={14} /> {t.sideEffects}
            </div>
            <div className="flex flex-wrap gap-2">
                {candidate.sideEffects.slice(0, 3).map((effect, idx) => (
                    <span key={idx} className="bg-red-950/30 text-red-300 text-xs px-2 py-1 rounded border border-red-900/50">
                        {effect}
                    </span>
                ))}
                {candidate.sideEffects.length > 3 && (
                    <span className="text-xs text-slate-500 py-1">+{candidate.sideEffects.length - 3} {t.more}</span>
                )}
            </div>
        </div>

        {!isOriginal && (
             <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/30 mt-auto">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-1">
                    <Zap size={14} /> {t.improvement}
                </div>
                <p className="text-slate-300 text-sm">
                    {candidate.improvementNotes}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default DrugCard;