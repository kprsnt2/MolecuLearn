
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language, UserProfile } from "../types";

export const analyzeDrugCandidates = async (
  query: string, 
  language: Language = 'en',
  profile: UserProfile | null = null
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-pro-preview";

  const profileContext = profile ? `
    USER PROFILE:
    - Age: ${profile.age}
    - Conditions: ${profile.conditions.join(', ')}
    - Allergies: ${profile.allergies.join(', ')}
    - Current Meds: ${profile.currentMedications.join(', ')}
  ` : "No specific profile.";

  const languageInstruction = language === 'te' 
    ? "Translate everything into simple Telugu that an average person can understand."
    : "Use simple English (Grade 6 level). Avoid all complex medical jargon.";

  const prompt = `
    ACT AS: A friendly Family Doctor who explains things simply.
    QUERY: "${query}"
    
    ${profileContext}
    ${languageInstruction}

    CRITICAL RULES FOR LANGUAGE:
    - Instead of "Hepatotoxicity", say "Liver damage".
    - Instead of "Contraindicated", say "Dangerous for you".
    - Instead of "Metabolite", say "Waste product".
    - Instead of "Hypertension", say "High Blood Pressure".
    - Make the 'reason' and 'recommendation' very clear and scary if it's a 'Critical' warning, so the user knows to stop.

    SAFETY SCORE RULE:
    - 'safetyScore' MUST be a whole number between 0 and 100. (e.g., 95, not 0.95).

    The response MUST be valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: "You are a personalized medical safety assistant. Use extremely simple language. Explain medical risks like you are talking to a worried family member, not a scientist. Ensure all safety scores are whole numbers out of 100.",
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetDrug: { type: Type.STRING },
            profileCheckSummary: { type: Type.STRING, description: "A very simple summary: Is this safe for them or not?" },
            candidates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  chemicalFormula: { type: Type.STRING },
                  molecularWeight: { type: Type.STRING },
                  smiles: { type: Type.STRING },
                  mechanismOfAction: { type: Type.STRING, description: "How it works in simple words." },
                  sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  efficacyScore: { type: Type.NUMBER },
                  safetyScore: { type: Type.NUMBER, description: "A whole number from 0 to 100." },
                  improvementNotes: { type: Type.STRING },
                  personalSafetyWarnings: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        severity: { type: Type.STRING, enum: ['Critical', 'Moderate', 'Low'] },
                        reason: { type: Type.STRING, description: "WHY it is dangerous in simple words." },
                        recommendation: { type: Type.STRING, description: "WHAT to do now in simple words." }
                      }
                    }
                  }
                },
                required: ['name', 'type', 'smiles', 'personalSafetyWarnings', 'safetyScore']
              }
            }
          },
          required: ['targetDrug', 'candidates', 'profileCheckSummary']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};
