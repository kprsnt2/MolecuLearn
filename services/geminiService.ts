import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

// NOTE: We do not initialize 'ai' here globally. 
// Initializing globally causes the app to crash (White/Blue screen) on load 
// if the environment variables are not yet ready or if 'process' is undefined in the browser.

export const analyzeDrugCandidates = async (query: string, language: Language = 'en'): Promise<AnalysisResult> => {
  // 1. Safe access to API Key to prevent ReferenceError: process is not defined
  let apiKey = "";
  try {
    // Check if process exists (standard Node/CRA/Webpack env)
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || "";
    } 
  } catch (e) {
    console.warn("Could not access process.env", e);
  }

  // 2. Throw a clear error if key is missing, rather than crashing
  if (!apiKey) {
    throw new Error("API Key is missing. Please set the 'API_KEY' environment variable in your Vercel project settings.");
  }

  // 3. Initialize the client lazily
  const ai = new GoogleGenAI({ apiKey });
  
  const modelId = "gemini-2.5-flash"; // Using 2.5 Flash for reliable JSON schema adherence and speed

  const languageInstruction = language === 'te' 
    ? "Translate all descriptive text values (targetDrug, name, mechanismOfAction, safetyProfile, sideEffects, improvementNotes) into Telugu language. Keep property keys in English."
    : "Keep all text in English.";

  const prompt = `
    You are an expert computational medicinal chemist and pharmacologist. 
    The user is searching for drug alternatives based on the query: "${query}".
    
    ${languageInstruction}

    Your task is to:
    1. Analyze the query.
       - If the query is a **Symptom** or **Condition** (e.g., "Headache", "High Blood Pressure"), identify the most common "Standard of Care" drug for it (e.g., "Ibuprofen" or "Lisinopril") and treat that as the "Original Drug".
       - If the query is a **Drug Name**, use it directly as the "Original Drug".
       
    2. Propose 4 distinct candidates based on that identified "Original Drug":
       - Candidate 1: The Original Drug itself (for baseline comparison).
       - Candidate 2: An existing FDA-approved alternative drug with a similar mechanism but potentially better safety.
       - Candidate 3: A Theoretical Novel Analog (invent a plausible chemical name or derivative) that modifies the structure to reduce toxicity (e.g., removing a toxic metabolite group).
       - Candidate 4: A Natural Compound or dietary supplement that exhibits similar (albeit likely weaker) activity.

    For the 'efficacyScore' and 'safetyScore', estimate a value between 0 and 100 based on clinical literature or chemical properties.
    Ensure 'improvementNotes' highlights specifically why the alternative might be better (e.g., "Lack of hepatotoxic N-acetyl-p-benzoquinone imine metabolite").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful, precise scientific assistant for drug discovery.",
        temperature: 0.3, // Low temperature for factual/consistent results
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetDrug: { type: Type.STRING, description: "The name of the identified Original Drug (even if user entered a symptom)" },
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['Original', 'Existing Alternative', 'Novel Analog', 'Natural Compound'] },
                  chemicalFormula: { type: Type.STRING },
                  molecularWeight: { type: Type.STRING },
                  mechanismOfAction: { type: Type.STRING },
                  safetyProfile: { type: Type.STRING },
                  sideEffects: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING } 
                  },
                  efficacyScore: { type: Type.NUMBER },
                  safetyScore: { type: Type.NUMBER },
                  improvementNotes: { type: Type.STRING }
                },
                required: ['name', 'type', 'chemicalFormula', 'mechanismOfAction', 'safetyScore', 'efficacyScore', 'improvementNotes', 'sideEffects']
              }
            }
          },
          required: ['targetDrug', 'candidates']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};