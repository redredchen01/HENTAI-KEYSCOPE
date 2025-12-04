
import React, { useState, useEffect } from 'react';
import { analyzeKeywords } from './services/geminiService';
import { SearchState, UserSettings } from './types';
import ResultsView from './components/ResultsView';
import SettingsModal from './components/SettingsModal';
import { Search, Loader2, Sparkles, TrendingUp, History, Clock, Settings, AlertTriangle, ShieldAlert, Key } from 'lucide-react';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    data: null,
    lastSearched: ''
  });

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_settings');
      try {
        return saved ? JSON.parse(saved) : {
          targetMarket: 'Taiwan',
          language: 'Traditional Chinese',
          keywordCount: 30
        };
      } catch (e) {
        return { targetMarket: 'Taiwan', language: 'Traditional Chinese', keywordCount: 30 };
      }
    }
    return { targetMarket: 'Taiwan', language: 'Traditional Chinese', keywordCount: 30 };
  });

  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem('user_settings', JSON.stringify(newSettings));
  };

  // Initialize history from localStorage
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('search_history');
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse history", e);
        return [];
      }
    }
    return [];
  });

  const addToHistory = (term: string) => {
    const trimmedTerm = term.trim();
    if (!trimmedTerm) return;
    
    // Create new history: prepend new term, remove duplicates, keep max 5
    const newHistory = [trimmedTerm, ...history.filter(h => h !== trimmedTerm)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));
  };

  const triggerSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Update input UI to match what's being searched
    setQuery(searchTerm);

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Pass settings to analysis service
      const result = await analyzeKeywords(searchTerm, settings);
      setState({
        isLoading: false,
        error: null,
        data: result,
        lastSearched: searchTerm
      });
      // Save successful search to history
      addToHistory(searchTerm);
    } catch (err: any) {
      let errorMessage = "分析過程中發生錯誤，請稍後再試。";
      
      // Handle missing API Key specifically
      if (err.message === "MISSING_API_KEY") {
        errorMessage = "MISSING_API_KEY";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(query);
  };

  const suggestions = ["遠端工作", "台北美食", "數位行銷", "AI 工具", "露營裝備"];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              HENTAI KEYSCOPE 關鍵字探索
            </span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-sm text-slate-400 hidden sm:block">
              Powered by Gemini v2.5
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="偏好設定"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Search Hero Section (Centered if no data) */}
        <div className={`transition-all duration-500 ease-in-out ${state.data ? 'mb-8' : 'mt-20 md:mt-32 max-w-2xl mx-auto text-center'}`}>
          {!state.data && (
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                發掘未被開發的 <br/>
                <span className="text-indigo-400">關鍵字機會</span>
              </h1>
              <p className="text-slate-400 text-lg">
                利用 Google 搜尋數據，即時掌握趨勢、用戶疑問與長尾關鍵字。
              </p>
            </div>
          )}

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group z-20">
            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 ${state.isLoading ? 'animate-pulse' : ''}`}></div>
            <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 transition-transform duration-200 focus-within:scale-[1.01]">
              <Search className="w-6 h-6 text-slate-400 ml-3" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="輸入核心關鍵字 (例如：'數位行銷')"
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-slate-500 text-lg px-4 py-2 w-full focus:outline-none"
                disabled={state.isLoading}
              />
              <button 
                type="submit"
                disabled={state.isLoading || !query.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">分析中...</span>
                  </>
                ) : (
                  <>
                    <span>開始分析</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* History Section */}
          {history.length > 0 && !state.isLoading && (
             <div className={`mt-4 flex flex-col items-center animate-fade-in ${state.data ? 'md:items-start max-w-2xl mx-auto' : ''}`}>
               <div className="flex items-center gap-2 text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">
                 <History className="w-3.5 h-3.5" />
                 <span>最近搜尋</span>
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-2">
                 {history.map((term, i) => (
                   <button
                     key={i}
                     onClick={() => triggerSearch(term)}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-sm rounded-lg border border-slate-700 hover:border-slate-600 transition-all group"
                   >
                     <Clock className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                     {term}
                   </button>
                 ))}
               </div>
             </div>
          )}
          
          {/* Quick Suggestions (Only show if no data and no history to clean up view) */}
          {!state.data && !state.isLoading && history.length === 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-slate-500 py-1">試試看：</span>
              {suggestions.map(s => (
                <button 
                  key={s} 
                  onClick={() => triggerSearch(s)}
                  className="text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-700 px-3 py-1 rounded-full border border-slate-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error State */}
        {state.error && (
          <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
             {state.error === "MISSING_API_KEY" ? (
               <div className="bg-amber-500/10 border border-amber-500/30 text-amber-100 p-6 rounded-xl flex items-start gap-4 shadow-lg">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-amber-500 mb-2">未設定 API Key</h3>
                    <p className="text-amber-200/80 text-sm leading-relaxed mb-4">
                      若您是在線上網頁使用此服務，請點擊下方按鈕輸入您的 Gemini API Key。<br/>
                      您的 Key 僅會儲存在您的瀏覽器中，不會上傳至伺服器。
                    </p>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-bold text-sm transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      前往設定 API Key
                    </button>
                  </div>
               </div>
             ) : (
               <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  {state.error}
               </div>
             )}
          </div>
        )}

        {/* Loading Skeleton */}
        {state.isLoading && !state.data && (
          <div className="max-w-4xl mx-auto mt-12 space-y-4">
             <div className="h-40 bg-slate-800/50 rounded-xl animate-pulse"></div>
             <div className="h-64 bg-slate-800/50 rounded-xl animate-pulse"></div>
          </div>
        )}

        {/* Results */}
        {state.data && !state.isLoading && (
          <div className="mt-8">
            <ResultsView data={state.data} settings={settings} />
          </div>
        )}

      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} HENTAI KEYSCOPE. Built with React & Gemini.
        </div>
      </footer>
    </div>
  );
};

export default App;
