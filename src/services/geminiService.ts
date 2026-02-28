import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FormulationResult {
  name: string;
  compoundId: string;
  mechanismOfAction: string;
  activeIngredients: string[];
  closestMedicines: {
    name: string;
    manufacturer: string;
    priceEstimate: string;
    similarityScore: number;
  }[];
}

export interface TrialResult {
  inSilicoSuccess: number;
  inVitroSuccess: number;
  toxicityProfile: string;
  sideEffects: string[];
  overallViability: number;
  humanTrialEliminationPotential: string;
  longTermEfficacy: string;
  pharmacokineticProfile: string;
  patientAdherenceScore: number;
}

export interface PackagingResult {
  primaryPackaging: string;
  secondaryPackaging: string;
  temperatureControl: string;
  distributionPlan: string;
  vialType: string;
  stopperType: string;
  sealType: string;
}

export const generateFormulation = async (
  disease: string,
  cureRequired: string,
  category: string,
  receptors: string
): Promise<FormulationResult> => {
  const prompt = `Act as an advanced AI drug discovery system. Generate a novel drug formulation for the following parameters:
Disease: ${disease}
Cure Required: ${cureRequired}
Category: ${category}
Target Receptors: ${receptors}

Provide a novel drug name, a unique alphanumeric compound ID (e.g., AEGIS-742X), its mechanism of action, a list of active synthetic ingredients, and identify the 3 closest existing medicines globally with their estimated pricing and similarity score.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Novel drug name" },
          compoundId: { type: Type.STRING, description: "A unique alphanumeric compound identifier (e.g., AEGIS-742X)" },
          mechanismOfAction: { type: Type.STRING },
          activeIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          closestMedicines: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                manufacturer: { type: Type.STRING },
                priceEstimate: { type: Type.STRING },
                similarityScore: { type: Type.NUMBER, description: "0-100 score" },
              },
              required: ["name", "manufacturer", "priceEstimate", "similarityScore"],
            },
          },
        },
        required: ["name", "compoundId", "mechanismOfAction", "activeIngredients", "closestMedicines"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const simulateTrial = async (formulationName: string, mechanism: string): Promise<TrialResult> => {
  const prompt = `Act as an advanced AI drug trial simulator. Simulate in-silico and in-vitro trials for the novel drug "${formulationName}" with mechanism: "${mechanism}".
Focus on eliminating human trials by providing highly accurate synthetic trial data.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          inSilicoSuccess: { type: Type.NUMBER, description: "Percentage 0-100" },
          inVitroSuccess: { type: Type.NUMBER, description: "Percentage 0-100" },
          toxicityProfile: { type: Type.STRING },
          sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
          overallViability: { type: Type.NUMBER, description: "Percentage 0-100" },
          humanTrialEliminationPotential: { type: Type.STRING, description: "Explanation of how this eliminates human trials" },
          longTermEfficacy: { type: Type.STRING },
          pharmacokineticProfile: { type: Type.STRING },
          patientAdherenceScore: { type: Type.NUMBER, description: "Percentage 0-100" },
        },
        required: ["inSilicoSuccess", "inVitroSuccess", "toxicityProfile", "sideEffects", "overallViability", "humanTrialEliminationPotential", "longTermEfficacy", "pharmacokineticProfile", "patientAdherenceScore"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generatePackaging = async (formulationName: string, category: string): Promise<PackagingResult> => {
  const prompt = `Act as an advanced pharmaceutical supply chain AI. Design a complete packaging and distribution plan for the novel drug "${formulationName}" (Category: ${category}).
Specify exact vial types, stoppers, seals, temperature requirements, and a global distribution strategy.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryPackaging: { type: Type.STRING },
          secondaryPackaging: { type: Type.STRING },
          temperatureControl: { type: Type.STRING },
          distributionPlan: { type: Type.STRING },
          vialType: { type: Type.STRING },
          stopperType: { type: Type.STRING },
          sealType: { type: Type.STRING },
        },
        required: ["primaryPackaging", "secondaryPackaging", "temperatureControl", "distributionPlan", "vialType", "stopperType", "sealType"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};
