import React, { useState, useCallback } from 'react';
import { Search, Dna, Activity, RotateCcw, Info, Languages } from 'lucide-react';
import { analyzeDrugCandidates } from './services/geminiService';
import { AnalysisResult, ViewMode, Language } from './types';
import DrugCard from './components/DrugCard';
import ComparisonChart from './components/ComparisonChart';
import { translations } from './translations';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [language, setLanguage] = useState<Language>('en');

  const t = translations[language];

  // Refactored analysis function to be reusable for search and language switch
  const performAnalysis = useCallback(async (searchQuery: string, targetLanguage: Language) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeDrugCandidates(searchQuery, targetLanguage);
      setResult(data);
    } catch (err: any) {
      // Improved error logging for production debugging
      console.error("Analysis Error:", err);
      
      const errorMessage = targetLanguage === 'en' 
        ? "Failed to analyze drug data." 
        : "ఔషధ డేటాను విశ్లేషించడంలో విఫలమైంది.";
      
      const helpText = targetLanguage === 'en'
        ? "Please check your API key and try again."
        : "దయచేసి మీ API కీని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.";

      // If it's a specific configuration error, show it
      if (err.message && (err.message.includes("API Key") || err.message.includes("Missing"))) {
        setError(`${errorMessage} (${err.message})`);
      } else {
        setError(`${errorMessage} ${helpText}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await performAnalysis(query, language);
  }, [query, language, performAnalysis]);

  const resetHome = useCallback(() => {
    setQuery('');
    setResult(null);
    setError(null);
    setLoading(false);
    setViewMode(ViewMode.GRID);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'te' : 'en';
    setLanguage(newLanguage);
    
    // If there is an active result, re-fetch it in the new language
    if (result && query) {
      performAnalysis(query, newLanguage);
    }
  };

  const bestCandidateIndex = result 
    ? result.candidates.reduce((bestIdx, current, idx, arr) => 
        current.safetyScore > arr[bestIdx].safetyScore ? idx : bestIdx, 0)
    : -1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-white pb-20">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={resetHome} 
              className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none"
            >
              <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 p-2 rounded-lg">
                <Dna size={24} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">Molecu<span className="text-emerald-400">Learn</span></span>
            </button>
            
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-1 text-emerald-500 text-sm font-medium">
                  <Activity size={16} />
                  <span>{t.tagline}</span>
               </div>
               
               <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
               >
                 <Languages size={16} />
                 <span className="text-sm font-semibold">{language === 'en' ? 'English' : 'తెలుగు'}</span>
               </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* Hero / Search Section */}
        <div className={`transition-all duration-500 ${result ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center items-center text-center'}`}>
          {!result && !loading && (
            <div className="mb-8 space-y-4 max-w-2xl mx-auto animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 pb-2">
                {t.heroTitle}
              </h1>
              <p className="text-lg text-slate-400">
                {t.heroSubtitle}
              </p>
            </div>
          )}

          <div className="w-full max-w-2xl relative z-10">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-6 w-6 transition-colors ${loading ? 'text-emerald-500 animate-pulse' : 'text-slate-500 group-focus-within:text-emerald-400'}`} />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl leading-5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-xl text-lg"
                placeholder={t.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !query}
                className="absolute right-2 top-2 bottom-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-6 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 hover:border-emerald-500"
              >
                {loading ? t.analyzingBtn : t.analyzeBtn}
              </button>
            </form>
            
            {/* Quick Suggestions */}
            {!result && !loading && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <span className="text-slate-500 text-sm py-1">{t.tryLabel}</span>
                {t.suggestions.map((suggestion: string) => (
                  <button 
                    key={suggestion}
                    onClick={() => { setQuery(suggestion); }}
                    className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-fade-in">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-t-4 border-emerald-500 rounded-full animate-spin"></div>
              <div className="absolute inset-3 border-t-4 border-blue-500 rounded-full animate-spin-reverse"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Dna className="text-slate-600 animate-pulse" size={32} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-white">{t.loadingTitle}</h3>
              <p className="text-slate-400">{t.loadingSubtitle}</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto p-6 bg-red-950/30 border border-red-900/50 rounded-xl flex items-start gap-4 animate-fade-in">
            <div className="p-2 bg-red-900/50 rounded-lg text-red-400">
              <Info size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-200">{t.errorTitle}</h3>
              <p className="text-red-300/80 mt-1">{error}</p>
              <button 
                onClick={() => { setError(null); setLoading(false); }}
                className="mt-4 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium"
              >
                <RotateCcw size={14} /> {t.retryBtn}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && !loading && (
          <div className="animate-slide-up space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">{t.resultsTitle} <span className="text-emerald-400">{result.targetDrug}</span></h2>
                <p className="text-slate-400 mt-2">
                   {t.foundPathways.replace('{count}', result.candidates.length.toString())}
                </p>
              </div>
              <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 mt-4 md:mt-0">
                <button 
                  onClick={() => setViewMode(ViewMode.GRID)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.GRID ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.viewCards}
                </button>
                <button 
                  onClick={() => setViewMode(ViewMode.CHART)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === ViewMode.CHART ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.viewChart}
                </button>
              </div>
            </div>

            {viewMode === ViewMode.CHART && (
              <div className="animate-fade-in">
                <ComparisonChart candidates={result.candidates} language={language} />
              </div>
            )}

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 ${viewMode === ViewMode.CHART ? 'mt-8' : ''}`}>
              {result.candidates.map((candidate, idx) => (
                <DrugCard 
                  key={idx} 
                  candidate={candidate} 
                  isBestOption={idx === bestCandidateIndex && candidate.type !== 'Original'} 
                  language={language}
                />
              ))}
            </div>

            <div className="mt-12 p-6 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">{t.disclaimerTitle}</p>
              <p className="text-slate-400 text-sm max-w-3xl mx-auto">
                {t.disclaimerText}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;