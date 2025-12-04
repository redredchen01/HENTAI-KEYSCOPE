
export interface KeywordMetric {
  keyword: string;
  category?: string; // New field for grouping (e.g., Question, Long-tail)
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  volume: number; // 0-100 relative index
  difficulty: number; // 0-100 relative index
  reasoning: string;
}

export interface ContentIdea {
  title: string;
  type: 'Blog' | 'Video' | 'Social' | 'Guide';
  target_audience: string;
  impact_score: number; // 1-10
}

export interface AudienceProfile {
  persona: string;
  pain_points: string[];
  buying_stage: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface KeywordExpansion {
  variations: string[];
  content_angle: string;
  user_question: string;
}

export interface UserSettings {
  targetMarket: string;
  language: string;
  keywordCount: number;
  apiKey?: string; // Add API Key field
}

export interface AnalysisResult {
  market_summary: string;
  audience_profile: AudienceProfile;
  keywords: KeywordMetric[];
  content_ideas: ContentIdea[];
  related_topics: string[];
  sources: GroundingChunk[];
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  data: AnalysisResult | null;
  lastSearched: string;
}
