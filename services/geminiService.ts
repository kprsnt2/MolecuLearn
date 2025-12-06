import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

export const analyzeDrugCandidates = async (query: string, language: Language = 'en'): Promise<AnalysisResult> => {
  // CRITICAL: We explicitly look for 'API_KEY' in uppercase. 
  // In Vercel, the Environment Variable name must be exactly 'API_KEY'.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("CRITICAL ERROR: process.env.API_KEY is undefined.");
    console.log("Current process.env:", process.env);
    throw new Error("System Configuration Error: API_KEY is missing. Please check your Vercel Environment Variables.");
  }

  // Initialize the API client
  const ai = new GoogleGenAI({ apiKey });
  
  const modelId = "gemini-2.5-flash"; // Using 2.5 Flash for reliable JSON schema adherence and speed

  // Stronger language instruction
  const languageInstruction = language === 'te' 
    ? "CRITICAL: The user speaks Telugu. You MUST translate ALL descriptive text values (mechanismOfAction, safetyProfile, sideEffects, improvementNotes) into Telugu. The field 'targetDrug' and 'name' can remain in English or be transliterated if a common Telugu name exists, but explanations must be in Telugu. Property keys must remain in English."
    : "Output in English.";

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
    
    IMPORTANT: Provide a valid SMILES string (Simplified Molecular Input Line Entry System) for 'smiles'. For the Novel Analog, construct a theoretically valid SMILES string representing your proposed modification.

    REMINDER: Output content in ${language === 'te' ? 'TELUGU' : 'ENGLISH'}.
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
                  smiles: { type: Type.STRING, description: "Valid SMILES string representation of the molecule structure" },
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
                required: ['name', 'type', 'chemicalFormula', 'smiles', 'mechanismOfAction', 'safetyScore', 'efficacyScore', 'improvementNotes', 'sideEffects']
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