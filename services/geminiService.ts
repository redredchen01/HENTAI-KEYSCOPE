import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, KeywordExpansion, GroundingChunk, UserSettings } from "../types";

const DEFAULT_SETTINGS: UserSettings = {
  targetMarket: 'Taiwan',
  language: 'Traditional Chinese',
  keywordCount: 30
};

// Robust helper to get API key in various environments (Node/Vite/Browser)
const getEnvApiKey = (): string | undefined => {
  try {
    // Check standard process.env (Node/Webpack)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // process might not be defined in strict browser envs
  }
  
  try {
    // Check Vite specific env (import.meta.env) - accessed securely via global if needed, 
    // but typically replaced at build time. 
    // For this snippet, we rely on the standard pattern or user input.
  } catch (e) {}

  return undefined;
};

// Helper to get authenticated client dynamically
const getClient = (userApiKey?: string) => {
  const envKey = getEnvApiKey();
  const key = envKey || userApiKey;
  
  if (!key) {
    throw new Error("MISSING_API_KEY");
  }
  
  return new GoogleGenAI({ apiKey: key });
};

// Helper to clean and parse JSON from LLM response
const parseGeminiJson = (text: string): any => {
  if (!text) return {};

  // 1. Try finding markdown JSON block
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```json([\s\S]*?)```/);
  if (jsonMatch) {
    const content = jsonMatch[1] || jsonMatch[0];
    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn("Markdown JSON parse failed, trying full text cleanup");
    }
  }

  // 2. Try finding the first '{' and last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonString = text.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Substring JSON parse failed", e);
    }
  }

  // 3. Last resort: try parsing the whole text
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Failed to parse structure data from AI response.");
  }
};

export const analyzeKeywords = async (seedKeyword: string, settings: UserSettings = DEFAULT_SETTINGS): Promise<AnalysisResult> => {
  const { targetMarket, language, keywordCount, apiKey } = settings;
  
  if (!seedKeyword) throw new Error("Keyword is required");

  // Get client with the correct key
  const ai = getClient(apiKey);

  const prompt = `
    Act as a Senior SEO Strategist and Content Marketing Manager specializing in the ${targetMarket} market (${language}).
    
    1. Perform a Google Search for "${seedKeyword}" to understand current trends, user intent, competitor content, and related long-tail queries in ${targetMarket}.
    2. Analyze the search results to build a comprehensive keyword research report.
    
    OUTPUT REQUIREMENTS:
    Return a SINGLE JSON object. Do not include markdown formatting outside the JSON. The JSON must follow this exact schema:

    {
      "market_summary": "A concise paragraph (3-4 sentences) describing the current search landscape, trends, and user sentiment for this topic in ${targetMarket}.",
      "audience_profile": {
        "persona": "Description of the primary person searching for this",
        "pain_points": ["Pain point 1", "Pain point 2", "Pain point 3"],
        "buying_stage": "Awareness" | "Consideration" | "Decision"
      },
      "related_topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
      "keywords": [
        {
          "keyword": "string (long tail keyword in ${language})",
          "category": "Questions" | "Long-tail" | "High Intent" | "Niche" | "Competitor",
          "intent": "Informational" | "Commercial" | "Transactional" | "Navigational",
          "volume": number (0-100 estimated relative volume),
          "difficulty": number (0-100 estimated competition),
          "reasoning": "Brief explanation of why this is a good opportunity (in ${language})"
        }
      ],
      "content_ideas": [
        {
          "title": "Catchy Title for a piece of content (in ${language})",
          "type": "Blog" | "Video" | "Social" | "Guide",
          "target_audience": "Who this specific piece is for",
          "impact_score": number (1-10 potential traffic impact)
        }
      ]
    }

    CONSTRAINTS:
    - **LANGUAGE**: All generated text (summaries, titles, reasonings, keywords) MUST be in **${language}** suitable for the target audience in ${targetMarket}.
    - **EXCEPTIONS**: Keep the specific ENUM values for 'intent', 'type', 'buying_stage', and 'category' in English/Code format so the application logic works correctly.
    - **KEYWORD QUANTITY**: You MUST generate at least **${keywordCount}** high-potential keywords.
    - **FOCUS**: Prioritize "Untapped" and "Long-tail" keywords that have reasonable volume but lower competition. Dig deep into specific user questions.
    - Generate 4 diverse content ideas (mix of Blog, Video, Guide).
    - Ensure data is based on the Google Search results performed.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    // Correctly map SDK grounding chunks to our type definition
    const sdkChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Map and filter chunks to ensure they match our GroundingChunk interface
    const sources: GroundingChunk[] = sdkChunks
      .map((chunk: any) => ({
        web: chunk.web ? {
          uri: chunk.web.uri || '',
          title: chunk.web.title || ''
        } : undefined
      }))
      .filter((s) => s.web && s.web.uri && s.web.title);

    const parsedData = parseGeminiJson(text);

    // Map to strictly typed result with fallbacks
    const result: AnalysisResult = {
      market_summary: parsedData.market_summary || "暫無市場摘要。",
      audience_profile: parsedData.audience_profile || { persona: "Unknown", pain_points: [], buying_stage: "Awareness" },
      keywords: Array.isArray(parsedData.keywords) ? parsedData.keywords : [],
      content_ideas: Array.isArray(parsedData.content_ideas) ? parsedData.content_ideas : [],
      related_topics: Array.isArray(parsedData.related_topics) ? parsedData.related_topics : [],
      sources: sources
    };

    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getKeywordDeepDive = async (keyword: string, settings: UserSettings = DEFAULT_SETTINGS): Promise<KeywordExpansion> => {
    const { targetMarket, language, apiKey } = settings;
    
    // Get client with the correct key
    const ai = getClient(apiKey);

    const prompt = `
      Focus on the keyword: "${keyword}" for the ${targetMarket} market (${language}).
      Provide a quick, deep-dive expansion.
      
      Return a SINGLE JSON object with this schema:
      {
        "variations": ["string (3-4 highly relevant long-tail variations or sub-topics)"],
        "user_question": "string (The core specific question the user is asking when searching this)",
        "content_angle": "string (A one-sentence unique angle to write about this to beat competitors)"
      }
      
      Language: ${language}.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Fast model is sufficient for this
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });
      
      const text = response.text || "{}";
      return JSON.parse(text) as KeywordExpansion;
    } catch (e) {
        console.error("Deep dive error", e);
        return {
            variations: [],
            user_question: "無法取得詳細分析",
            content_angle: "暫無建議"
        };
    }
}