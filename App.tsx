
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Dna, Activity, RotateCcw, Info, Languages, User, Save, ShieldCheck, Heart, AlertCircle, Trash2 } from 'lucide-react';
import { analyzeDrugCandidates } from './services/geminiService';
import { AnalysisResult, ViewMode, Language, UserProfile, Condition } from './types';
import DrugCard from './components/DrugCard';
import ComparisonChart from './components/ComparisonChart';
import { translations } from './translations';

const CONDITIONS: Condition[] = ['Diabetes', 'High Blood Pressure', 'Asthma', 'Kidney Disease', 'Heart Disease', 'Liver Issues'];

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [language, setLanguage] = useState<Language>('en');
  
  // Profile State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('moleculearn_profile');
    return saved ? JSON.parse(saved) : null;
  });

  // Profile Edit State
  const [editProfile, setEditProfile] = useState<UserProfile>(profile || {
    id: 'user_1',
    age: 30,
    weight: 70,
    conditions: [],
    allergies: [],
    currentMedications: [],
    lastUpdated: new Date().toISOString()
  });

  const t = translations[language];

  useEffect(() => {
    if (profile) {
      localStorage.setItem('moleculearn_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('moleculearn_profile');
    }
  }, [profile]);

  const saveProfile = () => {
    setProfile(editProfile);
    setIsProfileOpen(false);
  };

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeDrugCandidates(query, language, profile);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }, [query, language, profile]);

  const toggleCondition = (c: Condition) => {
    const next = editProfile.conditions.includes(c)
      ? editProfile.conditions.filter(item => item !== c)
      : [...editProfile.conditions, c];
    setEditProfile({ ...editProfile, conditions: next });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-white pb-20">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => {setResult(null); setQuery('');}} className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-emerald-500 to-blue-500 p-2 rounded-lg">
                <Dna size={20} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">MolecuLearn<span className="text-emerald-400">Pro</span></span>
            </button>
            
            <div className="flex items-center gap-3">
               {!result && (
                 <button onClick={() => setLanguage(l => l === 'en' ? 'te' : 'en')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
                    <Languages size={20} />
                 </button>
               )}
               <button 
                 onClick={() => setIsProfileOpen(true)}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                   profile ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                 }`}
               >
                 <User size={18} />
                 <span className="text-sm font-bold">{profile ? 'Patient Profile' : 'Setup Profile'}</span>
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart className="text-emerald-400" /> Patient Digital Twin
              </h2>
              {profile && (
                 <button onClick={() => {setProfile(null); setIsProfileOpen(false);}} className="text-slate-500 hover:text-red-400">
                    <Trash2 size={18} />
                 </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Age</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-1 text-white focus:ring-1 focus:ring-emerald-500 outline-none" 
                    value={editProfile.age}
                    onChange={(e) => setEditProfile({...editProfile, age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Weight (kg)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-1 text-white focus:ring-1 focus:ring-emerald-500 outline-none" 
                    value={editProfile.weight}
                    onChange={(e) => setEditProfile({...editProfile, weight: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Chronic Conditions</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => (
                    <button 
                      key={c}
                      onClick={() => toggleCondition(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        editProfile.conditions.includes(c) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Known Allergies (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Penicillin, Sulfa"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mt-1 text-white focus:ring-1 focus:ring-emerald-500 outline-none" 
                  value={editProfile.allergies.join(', ')}
                  onChange={(e) => setEditProfile({...editProfile, allergies: e.target.value.split(',').map(s => s.trim())})}
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={saveProfile}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Save size={18} /> Save & Authenticate
              </button>
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="px-6 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {/* Main Dashboard Hero */}
        <div className={`transition-all duration-500 ${result ? 'mb-12' : 'min-h-[60vh] flex flex-col justify-center items-center text-center'}`}>
          {!result && !loading && (
            <div className="mb-10 space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <ShieldCheck size={14} /> Personalized Medical Safety Auditor
              </div>
              <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500 leading-tight">
                Safety First.<br/>Search Precision.
              </h1>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                Validate prescriptions against your personal medical history using clinical-grade AI.
              </p>
            </div>
          )}

          <div className="w-full max-w-2xl relative">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className={`h-6 w-6 ${loading ? 'text-emerald-500 animate-spin' : 'text-slate-600'}`} />
              </div>
              <input
                type="text"
                className="block w-full pl-12 pr-4 py-5 bg-slate-900 border border-slate-700 rounded-3xl text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-2xl text-xl font-medium"
                placeholder="Enter medicine (e.g. Lisinopril) or Symptom..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit"
                disabled={loading || !query}
                className="absolute right-3 top-2.5 bottom-2.5 bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl font-black text-sm uppercase transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-30"
              >
                {loading ? 'Auditing...' : 'Analyze'}
              </button>
            </form>

            {!profile && !result && !loading && (
               <div className="mt-4 flex items-center gap-2 justify-center text-amber-400 text-sm font-bold bg-amber-950/20 py-2 px-4 rounded-xl border border-amber-500/30 animate-pulse">
                  <AlertCircle size={16} /> 
                  Warning: Using General Mode. Create a profile for Safety Checks.
               </div>
            )}
          </div>
        </div>

        {/* Audit Results */}
        {result && !loading && (
          <div className="animate-slide-up space-y-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">PERSONALIZED AUDIT FOR: <span className="text-emerald-400">{result.targetDrug}</span></p>
                <h2 className="text-xl font-bold text-white">{result.profileCheckSummary}</h2>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setViewMode(ViewMode.GRID)} className={`px-4 py-2 rounded-xl font-bold text-xs ${viewMode === ViewMode.GRID ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>GRID</button>
                 <button onClick={() => setViewMode(ViewMode.CHART)} className={`px-4 py-2 rounded-xl font-bold text-xs ${viewMode === ViewMode.CHART ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>RISK MAP</button>
              </div>
            </div>

            {viewMode === ViewMode.CHART ? (
              <ComparisonChart candidates={result.candidates} language={language} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {result.candidates.map((c, i) => (
                  <DrugCard key={i} candidate={c} language={language} />
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
           <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="w-20 h-20 border-t-4 border-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cross-referencing medical database...</p>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;
