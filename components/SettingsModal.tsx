import React, { useState, useEffect } from 'react';
import { X, Save, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
    setIsSaved(false);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-400" />
            分析偏好設定
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* API Key Section */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-indigo-500/30">
            <label className="flex items-center gap-2 text-sm font-bold text-indigo-300 mb-2">
              <Key className="w-4 h-4" />
              Gemini API Key
            </label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={localSettings.apiKey || ''}
                onChange={(e) => setLocalSettings({...localSettings, apiKey: e.target.value})}
                placeholder="貼上您的 API Key (AI Studio)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-mono"
              />
              <button 
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              您的 Key 僅會儲存在瀏覽器 LocalStorage 中，用於直接向 Google 發送請求，不會傳送至任何第三方伺服器。
            </p>
          </div>

          <div className="h-px bg-slate-800 my-2"></div>

          {/* Target Market */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">目標市場區域</label>
            <select 
              value={localSettings.targetMarket}
              onChange={(e) => setLocalSettings({...localSettings, targetMarket: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Taiwan">台灣 (Taiwan)</option>
              <option value="USA">美國 (USA)</option>
              <option value="Japan">日本 (Japan)</option>
              <option value="China">中國 (China)</option>
              <option value="Global">全球 (Global)</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">AI 輸出語言</label>
            <select 
              value={localSettings.language}
              onChange={(e) => setLocalSettings({...localSettings, language: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="Traditional Chinese">繁體中文 (Traditional Chinese)</option>
              <option value="Simplified Chinese">簡體中文 (Simplified Chinese)</option>
              <option value="English">英文 (English)</option>
              <option value="Japanese">日文 (Japanese)</option>
            </select>
          </div>

          {/* Keyword Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">生成關鍵字數量 (每批次)</label>
            <div className="flex items-center gap-4">
               {[10, 30, 50].map(count => (
                 <label key={count} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="keywordCount"
                      checked={localSettings.keywordCount === count}
                      onChange={() => setLocalSettings({...localSettings, keywordCount: count})}
                      className="text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-600"
                    />
                    <span className="text-slate-300">{count} 個</span>
                 </label>
               ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">數量越多，分析時間可能越長。</p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaved}
            className={`px-4 py-2 text-white rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 ${
                isSaved ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {isSaved ? (
                <>
                    <CheckCircle2 className="w-4 h-4" />
                    已儲存
                </>
            ) : (
                <>
                    <Save className="w-4 h-4" />
                    儲存設定
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Simple icon wrapper to avoid importing Issue
const SettingsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export default SettingsModal;