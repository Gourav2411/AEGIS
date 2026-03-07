import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

let customApiKey = localStorage.getItem('gemini_api_key') || '';

export const setGeminiApiKey = (key: string) => {
  customApiKey = key;
  localStorage.setItem('gemini_api_key', key);
};

const getEffectiveApiKey = () => {
  if (customApiKey === 'AI_STUDIO_ADMIN') {
    return process.env.GEMINI_API_KEY || 'missing-key';
  }
  return customApiKey || process.env.GEMINI_API_KEY || 'missing-key';
};

const getAiInstance = () => {
  return new GoogleGenAI({ apiKey: getEffectiveApiKey() });
};

export interface TrialParams {
  phase: string;
  cohortSize: string;
  ageGroup: string;
  dosage: string;
  dosageUnit: string;
  duration: string;
  geneticMarkers: string;
}

export interface FormulationResult {
  name: string;
  compoundId: string;
  chemicalFormula: string;
  molecularStructure: string;
  manufacturingCost: string;
  mechanismOfAction: string;
  rationale: string;
  bindingAffinity: string;
  halfLife: string;
  bioavailability: string;
  solubility: string;
  pKa: string;
  drugInteractions: string[];
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
  pharmacokineticProfile: {
    absorption: string;
    distribution: string;
    metabolism: string;
    excretion: string;
  };
  patientAdherenceScore: number;
  keyBiomarkers: string[];
  clearanceMechanism: string;
}

export interface PackagingResult {
  primaryPackaging: string;
  secondaryPackaging: string;
  temperatureControl: string;
  distributionPlan: string;
  vialType: string;
  stopperType: string;
  sealType: string;
  shelfLife: string;
  isoStandards: string[];
  materialsNeeded: string[];
  scientificSpecifications: string[];
  costs: {
    manualBatchCost: string;
    boughtBatchCost: string;
    rdCost: string;
    labCost: string;
    infraCost: string;
    labourCost: string;
    landCost: string;
  };
}

export interface InteractionResult {
  severity: 'Low' | 'Moderate' | 'High' | 'Severe';
  riskScore: number;
  interactionMechanism: string;
  clinicalConsequences: string;
  recommendation: string;
  affectedPathways: string[];
}

export const generateFormulation = async (
  disease: string,
  cureRequired: string,
  category: string,
  receptors: string
): Promise<FormulationResult> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment variables or login.");
  }

  const prompt = `Act as an expert computational chemist and pharmacologist. Generate a highly realistic, clinically accurate novel drug formulation for the following parameters:
Disease: ${disease}
Cure Required: ${cureRequired}
Category: ${category}
Target Receptors: ${receptors}

Use real-time, publicly available clinical trial data and current drug discovery research to inform the mechanism of action, target receptors, and closest existing medicines. Ensure the generated compound is novel but grounded in actual, recent scientific literature.

Provide a novel drug name, a unique alphanumeric compound ID (e.g., AEGIS-742X), its chemical formula, its molecular structure (a chemically valid SMILES string adhering to Lipinski's Rule of Five where applicable), the estimated manufacturing cost per dose, its mechanism of action, a detailed rationale explaining exactly WHY this specific molecular structure and mechanism were chosen to target and cure the specified disease, binding affinity (e.g., Ki or IC50), estimated half-life, bioavailability, solubility, pKa, predicted drug-drug interactions, a list of active synthetic ingredients, and identify the 3 closest existing medicines globally with their estimated pricing and similarity score.`;

  const response = await getAiInstance().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Novel drug name" },
          compoundId: { type: Type.STRING, description: "A unique alphanumeric compound identifier (e.g., AEGIS-742X)" },
          chemicalFormula: { type: Type.STRING, description: "Chemical formula (e.g. C22H28FN3O6S)" },
          molecularStructure: { type: Type.STRING, description: "Valid SMILES string representing the molecular structure" },
          manufacturingCost: { type: Type.STRING, description: "Estimated manufacturing cost per dose (e.g. $1.25/dose)" },
          mechanismOfAction: { type: Type.STRING, description: "Detailed clinical mechanism of action" },
          rationale: { type: Type.STRING, description: "Detailed scientific explanation of WHY this specific molecular structure and mechanism of action were chosen to target and cure the specified disease/condition." },
          bindingAffinity: { type: Type.STRING, description: "Binding affinity (e.g., Ki = 4.2 nM or IC50 = 12 nM)" },
          halfLife: { type: Type.STRING, description: "Estimated half-life (e.g., 14.5 hours)" },
          bioavailability: { type: Type.STRING, description: "Estimated bioavailability (e.g., 78% oral)" },
          solubility: { type: Type.STRING, description: "Aqueous solubility (e.g., 0.15 mg/mL at pH 7.4)" },
          pKa: { type: Type.STRING, description: "Acid dissociation constant (e.g., 8.2 (basic))" },
          drugInteractions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Predicted drug-drug interactions (e.g., CYP3A4 inhibitors)" },
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
        required: ["name", "compoundId", "chemicalFormula", "molecularStructure", "manufacturingCost", "mechanismOfAction", "rationale", "bindingAffinity", "halfLife", "bioavailability", "solubility", "pKa", "drugInteractions", "activeIngredients", "closestMedicines"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const simulateTrial = async (formulationName: string, mechanism: string, params: TrialParams): Promise<TrialResult> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment variables or login.");
  }

  const prompt = `Act as a lead clinical data scientist and toxicologist. Simulate highly realistic, clinically accurate in-silico and in-vitro trials for the novel drug "${formulationName}" with mechanism: "${mechanism}".
Focus on eliminating human trials by providing highly accurate synthetic trial data, including specific biomarkers tracked and clearance mechanisms.

Use real-world clinical trial data and recent pharmacological studies for similar drugs to inform the success rates, toxicity profiles, and side effects. Ground your simulation in actual, current medical research.

Use the following virtual trial parameters:
- Phase: ${params.phase}
- Cohort Size: ${params.cohortSize} virtual patients
- Age Group: ${params.ageGroup}
- Dosage Regimen: ${params.dosage} ${params.dosageUnit}
- Trial Duration: ${params.duration}
- Genetic Markers / Subgroups: ${params.geneticMarkers}

Adjust the efficacy, toxicity, and adherence scores based on these specific parameters.`;

  const response = await getAiInstance().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          inSilicoSuccess: { type: Type.NUMBER, description: "Percentage 0-100" },
          inVitroSuccess: { type: Type.NUMBER, description: "Percentage 0-100" },
          toxicityProfile: { type: Type.STRING, description: "Detailed clinical toxicity profile (e.g., hepatotoxicity risk, hERG inhibition)" },
          sideEffects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of side effects with estimated frequencies (e.g., Nausea (12%))" },
          overallViability: { type: Type.NUMBER, description: "Percentage 0-100" },
          humanTrialEliminationPotential: { type: Type.STRING, description: "Explanation of how this eliminates human trials" },
          longTermEfficacy: { type: Type.STRING, description: "Projected long-term efficacy based on synthetic models" },
          pharmacokineticProfile: {
            type: Type.OBJECT,
            description: "Detailed PK profile (ADME)",
            properties: {
              absorption: { type: Type.STRING, description: "Absorption characteristics (e.g., bioavailability, Tmax)" },
              distribution: { type: Type.STRING, description: "Distribution characteristics (e.g., volume of distribution, protein binding)" },
              metabolism: { type: Type.STRING, description: "Metabolism characteristics (e.g., primary metabolic pathways, enzymes)" },
              excretion: { type: Type.STRING, description: "Excretion characteristics (e.g., half-life, clearance routes)" }
            },
            required: ["absorption", "distribution", "metabolism", "excretion"]
          },
          patientAdherenceScore: { type: Type.NUMBER, description: "Percentage 0-100 based on dosing regimen and side effects" },
          keyBiomarkers: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific clinical biomarkers tracked for efficacy/safety" },
          clearanceMechanism: { type: Type.STRING, description: "Primary clearance mechanism (e.g., Hepatic CYP3A4, Renal)" },
        },
        required: ["inSilicoSuccess", "inVitroSuccess", "toxicityProfile", "sideEffects", "overallViability", "humanTrialEliminationPotential", "longTermEfficacy", "pharmacokineticProfile", "patientAdherenceScore", "keyBiomarkers", "clearanceMechanism"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generatePackaging = async (formulationName: string, category: string): Promise<PackagingResult> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment variables or login.");
  }

  const prompt = `Act as a pharmaceutical supply chain, regulatory, and manufacturing economics expert. Design a complete, clinically accurate packaging and distribution plan for the novel drug "${formulationName}" (Category: ${category}).
Specify exact material grades (e.g., Type I Borosilicate Glass), ISO standards, stability data, temperature requirements, and a global distribution strategy.
Additionally, provide a detailed breakdown of the raw materials needed to build the packaging, scientific specifications for the packaging, and a comprehensive cost analysis for a standard batch (e.g., 10,000 units). The cost analysis must compare the final cost if the packaging is manufactured manually in-house versus if it is bought pre-made from a supplier. Include specific estimates for R&D cost, lab cost, infrastructure cost, labour cost, and land cost.`;

  const response = await getAiInstance().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryPackaging: { type: Type.STRING, description: "Specific primary packaging materials" },
          secondaryPackaging: { type: Type.STRING, description: "Specific secondary packaging materials" },
          temperatureControl: { type: Type.STRING, description: "Exact temperature requirements (e.g., 2-8°C)" },
          distributionPlan: { type: Type.STRING, description: "Cold chain or standard distribution strategy" },
          vialType: { type: Type.STRING, description: "Specific vial type/grade" },
          stopperType: { type: Type.STRING, description: "Specific stopper material (e.g., FluroTec coated bromobutyl)" },
          sealType: { type: Type.STRING, description: "Specific seal type" },
          shelfLife: { type: Type.STRING, description: "Estimated shelf life under recommended storage (e.g., 24 months)" },
          isoStandards: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant ISO standards for packaging/distribution" },
          materialsNeeded: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of raw materials needed to build the packaging" },
          scientificSpecifications: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of scientific specifications for the packaging" },
          costs: {
            type: Type.OBJECT,
            properties: {
              manualBatchCost: { type: Type.STRING, description: "Final cost for each batch if made manually in-house" },
              boughtBatchCost: { type: Type.STRING, description: "Final cost for each batch if bought pre-made" },
              rdCost: { type: Type.STRING, description: "R&D cost" },
              labCost: { type: Type.STRING, description: "Lab cost" },
              infraCost: { type: Type.STRING, description: "Infrastructure cost" },
              labourCost: { type: Type.STRING, description: "Labour cost" },
              landCost: { type: Type.STRING, description: "Land cost" }
            },
            required: ["manualBatchCost", "boughtBatchCost", "rdCost", "labCost", "infraCost", "labourCost", "landCost"]
          }
        },
        required: ["primaryPackaging", "secondaryPackaging", "temperatureControl", "distributionPlan", "vialType", "stopperType", "sealType", "shelfLife", "isoStandards", "materialsNeeded", "scientificSpecifications", "costs"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const simulateDrugInteractions = async (
  primaryDrugName: string,
  primaryMechanism: string,
  secondaryDrugName: string
): Promise<InteractionResult> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment variables or login.");
  }

  const prompt = `Act as an expert clinical pharmacologist and toxicologist. Simulate the potential drug-drug interaction between a novel formulation "${primaryDrugName}" (Mechanism of Action: ${primaryMechanism}) and an existing or proposed drug "${secondaryDrugName}".
Use real-time pharmacological databases and recent clinical studies to inform the interaction mechanism, severity, and clinical consequences. Ground your risk assessment in actual, current medical research regarding similar interactions.

Provide a detailed risk assessment including severity, a risk score (0-100), the pharmacokinetic/pharmacodynamic interaction mechanism, clinical consequences, actionable recommendations, and specific biological pathways affected.`;

  const response = await getAiInstance().models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, description: "Severity level: 'Low', 'Moderate', 'High', or 'Severe'" },
          riskScore: { type: Type.NUMBER, description: "Risk score from 0 to 100 (100 being most dangerous)" },
          interactionMechanism: { type: Type.STRING, description: "Detailed explanation of how the drugs interact (PK/PD)" },
          clinicalConsequences: { type: Type.STRING, description: "Potential adverse events or changes in efficacy" },
          recommendation: { type: Type.STRING, description: "Clinical recommendation (e.g., 'Contraindicated', 'Monitor closely', 'Adjust dosage')" },
          affectedPathways: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of biological pathways or enzymes affected (e.g., 'CYP3A4 inhibition')" },
        },
        required: ["severity", "riskScore", "interactionMechanism", "clinicalConsequences", "recommendation", "affectedPathways"],
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithJarvis = async (message: string, useDeepThink: boolean, useDeepSearch: boolean, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in your environment variables or login.");
  }

  const model = useDeepThink ? "gemini-3.1-pro-preview" : "gemini-2.5-flash-lite";
  const config: any = {
    systemInstruction: "You are Aegis, an advanced AI drug discovery assistant. You are helpful, scientific, concise, and communicate with a slightly robotic, highly intelligent tone. You assist users in understanding drug formulations, trials, and supply chains.",
  };

  if (useDeepThink) {
    config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
  }

  if (useDeepSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  const chat = getAiInstance().chats.create({
    model: model,
    config: config,
    history: history
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I was unable to process that request.";
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await getAiInstance().models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

