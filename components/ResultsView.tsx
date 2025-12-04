import React, { useState } from 'react';
import { AnalysisResult, KeywordExpansion, UserSettings } from '../types';
import { getKeywordDeepDive } from '../services/geminiService';
import KeywordChart from './KeywordChart';
import { 
  BarChart2, 
  Zap, 
  ExternalLink, 
  Users, 
  Target, 
  Lightbulb, 
  Hash,
  BookOpen,
  Video,
  Share2,
  FileText,
  Filter,
  Sparkles,
  Loader2
} from 'lucide-react';

interface ResultsViewProps {
  data: AnalysisResult;
  settings: UserSettings;
}

const IntentBadge: React.FC<{ intent: string }> = ({ intent }) => {
  const colors: Record<string, string> = {
    Informational: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Commercial: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Transactional: 'bg-green-500/20 text-green-300 border-green-500/30',
    Navigational: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };

  const labels: Record<string, string> = {
    Informational: '資訊型',
    Commercial: '商業型',
    Transactional: '交易型',
    Navigational: '導航型',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[intent] || 'bg-slate-700 text-slate-300'}`}>
      {labels[intent] || intent}
    </span>
  );
};

const CategoryBadge: React.FC<{ category?: string }> = ({ category }) => {
  if (!category) return null;
  
  const colors: Record<string, string> = {
    'Questions': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    'Long-tail': 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    'High Intent': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'Niche': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'Competitor': 'text-red-400 bg-red-400/10 border-red-400/20'
  };

  const labels: Record<string, string> = {
      'Questions': '問題類',
      'Long-tail': '長尾詞',
      'High Intent': '高意圖',
      'Niche': '利基市場',
      'Competitor': '競品詞'
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${colors[category] || 'text-slate-400 border-slate-700'}`}>
      {labels[category] || category}
    </span>
  );
};

const ContentIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'Video': return <Video className="w-4 h-4 text-red-400" />;
    case 'Social': return <Share2 className="w-4 h-4 text-pink-400" />;
    case 'Guide': return <BookOpen className="w-4 h-4 text-emerald-400" />;
    default: return <FileText className="w-4 h-4 text-blue-400" />;
  }
};

const ContentTypeLabel: React.FC<{ type: string }> = ({ type }) => {
    const labels: Record<string, string> = {
        Blog: '部落格文章',
        Video: '影片企劃',
        Social: '社群貼文',
        Guide: '完全指南'
    };
    return <span>{labels[type] || type}</span>;
}

const BuyingStageLabel: React.FC<{ stage: string }> = ({ stage }) => {
    const labels: Record<string, string> = {
        Awareness: '認知階段',
        Consideration: '考量階段',
        Decision: '決策階段'
    };
    return <span>{labels[stage] || stage}</span>;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, settings }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  // State for expanded rows
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set());
  const [expansionData, setExpansionData] = useState<Record<string, KeywordExpansion>>({});
  const [loadingExpansion, setLoadingExpansion] = useState<string | null>(null);

  const toggleExpand = async (keyword: string) => {
    const isExpanded = expandedKeywords.has(keyword);
    const newSet = new Set(expandedKeywords);

    if (isExpanded) {
      newSet.delete(keyword);
      setExpandedKeywords(newSet);
    } else {
      newSet.add(keyword);
      setExpandedKeywords(newSet);
      
      // Fetch data if not already present
      if (!expansionData[keyword]) {
        setLoadingExpansion(keyword);
        try {
          const result = await getKeywordDeepDive(keyword, settings);
          setExpansionData(prev => ({ ...prev, [keyword]: result }));
        } catch (e) {
          console.error("Failed to fetch details", e);
        } finally {
          setLoadingExpansion(null);
        }
      }
    }
  };

  // Extract unique categories from data
  // Fix: Explicitly filter and cast to ensure strict string type
  const categories = data.keywords
    .map(k => k.category)
    .filter((c): c is string => typeof c === 'string' && c.length > 0);
  
  const availableCategories: string[] = ['All', ...Array.from(new Set(categories))];

  const categoryLabels: Record<string, string> = {
    'All': '全部顯示',
    'Questions': '問題類',
    'Long-tail': '長尾關鍵字',
    'High Intent': '高意圖',
    'Niche': '利基市場',
    'Competitor': '競爭對手'
  };

  // Filter keywords based on selection
  const filteredKeywords = data.keywords.filter(k => 
    filterCategory === 'All' ? true : k.category === filterCategory
  );

  // Sort keywords by volume (descending)
  const sortedKeywords = [...filteredKeywords].sort((a, b) => b.volume - a.volume);
  
  const totalKeywords = filteredKeywords.length;
  const avgDifficulty = totalKeywords > 0 
    ? Math.round(filteredKeywords.reduce((acc, curr) => acc + curr.difficulty, 0) / totalKeywords) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* SECTION 1: KEYWORD OPPORTUNITIES (Moved to Top) */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                <BarChart2 className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">關鍵字機會分析</h2>
                <p className="text-slate-400 text-sm">顯示 {totalKeywords} 個結果 • 平均難度 {avgDifficulty}/100</p>
              </div>
           </div>

           {/* Category Filter */}
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <Filter className="w-4 h-4 text-slate-500 hidden md:block" />
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                    filterCategory === cat 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Chart */}
           <div className="lg:col-span-1">
              <KeywordChart data={sortedKeywords} />
           </div>

           {/* Detailed Table */}
           <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700 shadow-lg overflow-hidden backdrop-blur-sm flex flex-col h-[400px]">
              <div className="overflow-y-auto custom-scrollbar flex-grow">
                <table className="w-full text-left border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm">
                    <tr className="text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold w-[30%]">關鍵字 / 類型</th>
                      <th className="p-4 font-semibold w-[15%]">意圖</th>
                      <th className="p-4 font-semibold text-right w-[15%]">搜尋量</th>
                      <th className="p-4 font-semibold text-right w-[15%]">競爭度</th>
                      <th className="p-4 font-semibold w-[15%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {sortedKeywords.length > 0 ? (
                      sortedKeywords.map((kw, idx) => (
                        <React.Fragment key={idx}>
                          <tr className={`hover:bg-slate-700/30 transition-colors group ${expandedKeywords.has(kw.keyword) ? 'bg-slate-800' : ''}`}>
                            <td className="p-3 pl-4 align-middle">
                              <div className="font-medium text-slate-200 group-hover:text-white transition-colors text-base mb-1">
                                {kw.keyword}
                              </div>
                              <CategoryBadge category={kw.category} />
                            </td>
                            <td className="p-3 align-middle">
                              <IntentBadge intent={kw.intent} />
                            </td>
                            <td className="p-3 text-right align-middle">
                              <div className="flex flex-col items-end gap-1.5 w-full max-w-[120px] ml-auto">
                                <span className="text-sm font-mono font-medium text-slate-300">{kw.volume}</span>
                                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                                    style={{ width: `${kw.volume}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-right align-middle">
                              <div className="flex flex-col items-end gap-1.5 w-full max-w-[120px] ml-auto">
                                <span className="text-sm font-mono font-medium text-slate-300">{kw.difficulty}</span>
                                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full shadow-sm transition-all duration-500 ${
                                      kw.difficulty > 70 
                                        ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                                        : kw.difficulty > 40 
                                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' 
                                          : 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                                    }`}
                                    style={{ width: `${kw.difficulty}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 pr-4 align-middle text-right">
                               <button 
                                 onClick={() => toggleExpand(kw.keyword)}
                                 disabled={loadingExpansion === kw.keyword}
                                 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                   expandedKeywords.has(kw.keyword)
                                     ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                     : 'bg-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                                 }`}
                               >
                                 {loadingExpansion === kw.keyword ? (
                                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                 ) : (
                                   <Sparkles className="w-3.5 h-3.5" />
                                 )}
                                 {expandedKeywords.has(kw.keyword) ? '收起' : 'AI 洞察'}
                               </button>
                            </td>
                          </tr>
                          
                          {/* EXPANDED CONTENT */}
                          {expandedKeywords.has(kw.keyword) && (
                            <tr className="bg-slate-800/50 border-b border-slate-700/50 animate-fade-in">
                              <td colSpan={5} className="p-0">
                                <div className="p-5 border-l-2 border-indigo-500 ml-4 my-2 mr-4 bg-slate-900/50 rounded-r-lg shadow-inner">
                                  {expansionData[kw.keyword] ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-3 flex items-center gap-2">
                                          <Target className="w-3 h-3" />
                                          用戶真實搜尋意圖
                                        </h4>
                                        <p className="text-sm text-slate-300 mb-4 bg-slate-800/50 p-3 rounded border border-slate-700">
                                          "{expansionData[kw.keyword].user_question}"
                                        </p>

                                        <h4 className="text-xs uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                          <Lightbulb className="w-3 h-3" />
                                          內容切入策略
                                        </h4>
                                        <p className="text-sm text-slate-300">
                                          {expansionData[kw.keyword].content_angle}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="text-xs uppercase tracking-wider text-cyan-400 font-bold mb-3 flex items-center gap-2">
                                          <Hash className="w-3 h-3" />
                                          推薦延伸關鍵字
                                        </h4>
                                        <div className="flex flex-col gap-2">
                                          {expansionData[kw.keyword].variations.map((v, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
                                              {v}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center py-6 text-slate-500 gap-2">
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                      正在深入分析關鍵字...
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          沒有符合此篩選條件的關鍵字。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      </div>

      {/* SECTION 2: INSIGHTS DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-slate-800">
        
        {/* Market Summary - Spans 2 cols */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">市場洞察摘要</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-lg mb-6 flex-grow">
            {data.market_summary}
          </p>
          
          {/* Grounding Sources */}
          {data.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-700/50 mt-auto">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">資料來源 (Google Search)</h4>
              <div className="flex flex-wrap gap-2">
                {data.sources.map((source, idx) => {
                  if (!source.web) return null;
                  return (
                    <a 
                      key={idx}
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 hover:bg-slate-700 rounded-md text-xs text-slate-400 hover:text-blue-400 transition-colors border border-slate-700"
                    >
                      <span className="truncate max-w-[150px]">{source.web.title}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Audience & Topics Column */}
        <div className="space-y-6">
          {/* Audience Card */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-indigo-300">
                <Users className="w-5 h-5" />
                <h3 className="font-bold">目標受眾輪廓</h3>
             </div>
             <div className="mb-4">
                <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">主要人物誌</div>
                <div className="text-white font-medium text-lg">{data.audience_profile.persona}</div>
             </div>
             <div className="mb-4">
                <div className="text-sm text-slate-500 uppercase tracking-wider mb-1">購買階段</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30">
                  <Target className="w-3 h-3" />
                  <BuyingStageLabel stage={data.audience_profile.buying_stage} />
                </div>
             </div>
             <div>
                <div className="text-sm text-slate-500 uppercase tracking-wider mb-2">痛點分析</div>
                <ul className="space-y-2">
                  {data.audience_profile.pain_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400 mt-0.5">•</span>
                      {pt}
                    </li>
                  ))}
                </ul>
             </div>
          </div>

          {/* Topics Cloud */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-cyan-300">
                <Hash className="w-5 h-5" />
                <h3 className="font-bold">相關主題叢集</h3>
             </div>
             <div className="flex flex-wrap gap-2">
                {data.related_topics.map((topic, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm border border-slate-600 transition-colors cursor-default">
                    {topic}
                  </span>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: CONTENT STRATEGY (Moved to Bottom) */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
           <Lightbulb className="w-5 h-5 text-yellow-400" />
           內容策略建議
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {data.content_ideas.map((idea, idx) => (
             <div key={idx} className="bg-slate-800/60 border border-slate-700 p-5 rounded-xl hover:bg-slate-800 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                   <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900 text-xs text-slate-300 border border-slate-700">
                      <ContentIcon type={idea.type} />
                      <ContentTypeLabel type={idea.type} />
                   </div>
                   <div className="text-xs font-bold text-emerald-400">
                     影響力: {idea.impact_score}/10
                   </div>
                </div>
                <h4 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors">
                  {idea.title}
                </h4>
                <p className="text-xs text-slate-500">目標: <span className="text-slate-400">{idea.target_audience}</span></p>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
};

export default ResultsView;