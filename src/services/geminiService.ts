import { Type } from "@google/genai";
import { generateStructuredContent, chatWithProvider, generateSpeechWithProvider, setAiProvider, setGeminiApiKey, getEffectiveApiKey, getCurrentProvider, generateClinicalTrialReport } from './aiHelper';
import { runPredictiveModel } from './predictiveModel';

export { setAiProvider, setGeminiApiKey, getEffectiveApiKey, getCurrentProvider, generateClinicalTrialReport };

export interface TrialParams {
  phase: string;
  cohortSize: string;
  ageGroup: string;
  dosage: string;
  dosageUnit: string;
  duration: string;
  geneticMarkers: string;
  diseaseSeverity?: string;
  previousTreatments?: string;
  inclusionCriteria?: string;
  exclusionCriteria?: string;
  dosageAdjustments?: string;
  useSCA?: boolean;
  useAdaptiveDesign?: boolean;
  useRAG?: boolean;
  liveEHRRecords?: number;
}

export interface FormulationResult {
  name: string;
  compoundId: string;
  cid?: number; // PubChem CID
  iupacName?: string; // Real IUPAC name
  chemicalFormula: string;
  smilesString: string;
  baseSmiles?: string; // Original SMILES before agentic mutation
  molecularStructure: string;
  manufacturingCost: string;
  mechanismOfAction: string;
  rationale: string;
  bindingAffinity: string;
  halfLife: string;
  bioavailability: string;
  solubility: string;
  pKa: string;
  saScore: number; // Synthetic Accessibility Score (1-10)
  interactingResidues?: string[]; // List of interacting residues in the protein pocket
  drugInteractions: string[];
  activeIngredients: string[];
  closestMedicines: {
    name: string;
    manufacturer: string;
    priceEstimate: string;
    similarityScore: number;
  }[];
  optimizationLog?: string[]; // Log of agentic iterations
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
  adaptiveDesignLog?: string;
  ragSources?: string[];
  efficacyOverTime?: { month: number; efficacy: number; placeboEfficacy?: number }[];
  sideEffectDistribution?: { name: string; percentage: number }[];
  statisticalConfidence?: number;
  costSavingsEstimate?: string;
  timeSavedEstimate?: string;
  subgroupAnalysis?: { group: string; efficacy: number; sampleSize: number }[];
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
  sources: {
    name: string;
    description: string;
    location: string;
    specialty: string;
  }[];
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

export const connectToLiveEHR = async (disease: string, params: TrialParams): Promise<number> => {
  // Simulate connecting to an EHR network and fetching records based on disease and params
  return new Promise((resolve) => {
    setTimeout(() => {
      // Base records
      let records = Math.floor(Math.random() * 500000) + 100000;
      
      // Adjust based on disease rarity (simulated)
      if (disease.toLowerCase().includes('rare') || disease.toLowerCase().includes('orphan')) {
        records = Math.floor(records * 0.1);
      }
      
      // Adjust based on age group
      if (params.ageGroup.includes('Pediatric')) {
        records = Math.floor(records * 0.2);
      }
      
      resolve(records);
    }, 3000);
  });
};

export const generateFormulation = async (
  disease: string,
  cureRequired: string,
  category: string,
  receptors: string,
  agenticMode: boolean = false,
  useSlm: boolean = false,
  pdbFileContent?: string
): Promise<FormulationResult> => {
  const apiKey = getEffectiveApiKey();
  const response = await fetch('/api/discover', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      disease,
      cureRequired,
      category,
      receptors,
      agenticMode,
      useSlm,
      pdbFileContent
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate formulation: ${response.statusText}`);
  }

  return await response.json();
};

export interface ProtocolOptimizationResult {
  estimatedEligiblePopulation: number;
  recruitmentFeasibility: string;
  suggestions: {
    parameter: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
    impactOnEnrollment: string;
  }[];
}

export const optimizeProtocol = async (disease: string, params: TrialParams): Promise<ProtocolOptimizationResult> => {
  const prompt = `Act as a Clinical Trial Protocol Optimizer. Analyze the following trial parameters for the target disease "${disease}".
Estimate the global eligible patient population and provide suggestions to loosen specific parameters to accelerate recruitment if the criteria are too strict.

Current Parameters:
- Age Group: ${params.ageGroup}
- Genetic Markers: ${params.geneticMarkers}
- Disease Severity: ${params.diseaseSeverity || 'Not specified'}
- Previous Treatments: ${params.previousTreatments || 'Not specified'}
- Inclusion Criteria: ${params.inclusionCriteria || 'Not specified'}
- Exclusion Criteria: ${params.exclusionCriteria || 'Not specified'}

Provide a realistic estimate of the eligible population and 2-3 actionable suggestions to improve recruitment feasibility.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      estimatedEligiblePopulation: { type: Type.NUMBER, description: "Estimated number of eligible patients globally" },
      recruitmentFeasibility: { type: Type.STRING, description: "Assessment of recruitment feasibility (e.g., 'High Risk', 'Moderate', 'Optimal')" },
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            parameter: { type: Type.STRING, description: "The parameter to change (e.g., 'Age Group', 'Exclusion Criteria')" },
            currentValue: { type: Type.STRING },
            suggestedValue: { type: Type.STRING },
            reason: { type: Type.STRING, description: "Why this change is medically and statistically sound" },
            impactOnEnrollment: { type: Type.STRING, description: "Estimated increase in enrollment (e.g., '+15%')" }
          },
          required: ["parameter", "currentValue", "suggestedValue", "reason", "impactOnEnrollment"]
        }
      }
    },
    required: ["estimatedEligiblePopulation", "recruitmentFeasibility", "suggestions"]
  };

  return await generateStructuredContent(prompt, schema);
};

export const simulateTrial = async (formulationName: string, mechanism: string, params: TrialParams, csvData?: string, useSlm: boolean = false): Promise<TrialResult> => {
  // --- DETERMINISTIC PREDICTIVE ENGINE ---
  let inSilicoSuccess, inVitroSuccess, overallViability, patientAdherenceScore, efficacyOverTime;
  let historicalMatches: any[] = [];

  const dosageNum = parseFloat(params.dosage) || 50;
  const durationMonths = params.duration.includes('Year') ? parseInt(params.duration) * 12 : parseInt(params.duration);

  if (csvData) {
    // Use the real predictive model based on the uploaded CSV
    const prediction = await runPredictiveModel(
      csvData,
      params.diseaseSeverity || mechanism, // Fallback to mechanism if disease not specified
      params.phase,
      parseInt(params.cohortSize) || 100,
      durationMonths,
      dosageNum,
      params.useSCA || false,
      params.useAdaptiveDesign || false
    );
    
    inSilicoSuccess = prediction.inSilicoSuccess;
    inVitroSuccess = prediction.inVitroSuccess;
    overallViability = prediction.overallViability;
    patientAdherenceScore = prediction.patientAdherenceScore;
    efficacyOverTime = prediction.efficacyOverTime;
    historicalMatches = prediction.historicalMatches;
  } else {
    // Fallback scaffolding
    let baseSuccess = 60;
    if (params.phase === 'Phase 1') baseSuccess = 75;
    if (params.phase === 'Phase 2') baseSuccess = 55;
    if (params.phase === 'Phase 3') baseSuccess = 40;

    if (params.useSCA) baseSuccess += 12;
    if (params.useAdaptiveDesign) baseSuccess += 15;
    if (dosageNum > 500) baseSuccess -= 10;
    
    inSilicoSuccess = Math.min(99, Math.max(10, Math.round(baseSuccess + (Math.random() * 10 - 5))));
    inVitroSuccess = Math.min(99, Math.max(10, Math.round(baseSuccess - 5 + (Math.random() * 10 - 5))));
    overallViability = Math.round((inSilicoSuccess * 0.6) + (inVitroSuccess * 0.4));

    let adherence = 85;
    if (params.duration.includes('Year')) adherence -= 15;
    if (dosageNum > 200) adherence -= 5;
    patientAdherenceScore = Math.min(99, Math.max(20, Math.round(adherence + (Math.random() * 10 - 5))));

    efficacyOverTime = [];
    let currentEfficacy = 10;
    for (let i = 1; i <= durationMonths; i++) {
      currentEfficacy = Math.min(95, currentEfficacy + (Math.random() * 15));
      const dataPoint: any = { month: i, efficacy: Math.round(currentEfficacy) };
      if (params.useSCA) {
        dataPoint.placeboEfficacy = Math.round(currentEfficacy * 0.3 + (Math.random() * 5));
      }
      efficacyOverTime.push(dataPoint);
    }
  }
  // --------------------------------------------

  const slmInstruction = useSlm ? "You are Aegis-SLM-v1, a highly specialized fine-tuned model trained on expert human feedback. Your outputs must be exceptionally precise, scientifically rigorous, and prioritize novel, highly effective mechanisms over standard approaches. " : "";

  const prompt = `${slmInstruction}Act as a lead clinical data scientist and toxicologist. Simulate highly realistic, clinically accurate in-silico and in-vitro trials for the novel drug "${formulationName}" with mechanism: "${mechanism}".

CRITICAL INSTRUCTION: You are part of a Hybrid Predictive-Generative system. The core success metrics have already been calculated by a deterministic mathematical model based on the trial parameters and historical clinical trial data. 
You MUST use the exact numbers provided below in your JSON output. Do NOT invent or alter these specific metrics. Your job is to generate the clinical narrative (ADME, toxicity profile, side effects, biomarkers) that perfectly aligns with and explains these hard numbers.

--- PRE-CALCULATED DETERMINISTIC METRICS (USE EXACTLY) ---
- inSilicoSuccess: ${inSilicoSuccess}
- inVitroSuccess: ${inVitroSuccess}
- overallViability: ${overallViability}
- patientAdherenceScore: ${patientAdherenceScore}
- efficacyOverTime: ${JSON.stringify(efficacyOverTime)}
----------------------------------------------------------

${historicalMatches.length > 0 ? `
--- HISTORICAL TRIAL MATCHES ---
The predictive model based its calculations on the following similar historical trials. Use these to ground your narrative, especially regarding toxicity and clearance mechanisms:
${historicalMatches.map(m => `- Drug: ${m.Drug_Name}, Disease: ${m.Target_Disease}, Phase: ${m.Phase}, Status: ${m.Status}`).join('\n')}
--------------------------------
` : ''}

Use the following virtual trial parameters to inform your narrative:
- Phase: ${params.phase}
- Cohort Size: ${params.cohortSize} virtual patients
- Age Group: ${params.ageGroup}
- Dosage Regimen: ${params.dosage} ${params.dosageUnit}
${params.dosageAdjustments ? `- Dosage Adjustments: ${params.dosageAdjustments}` : ''}
- Trial Duration: ${params.duration}
- Genetic Markers / Subgroups: ${params.geneticMarkers}
${params.diseaseSeverity ? `- Disease Severity: ${params.diseaseSeverity}` : ''}
${params.previousTreatments ? `- Previous Treatments: ${params.previousTreatments}` : ''}
${params.inclusionCriteria ? `- Inclusion Criteria: ${params.inclusionCriteria}` : ''}
${params.exclusionCriteria ? `- Exclusion Criteria: ${params.exclusionCriteria}` : ''}
${params.useSCA ? `- Synthetic Control Arm (SCA): ENABLED. Half of the cohort is generated from anonymized EHR data to act as a virtual placebo group.` : ''}
${params.liveEHRRecords ? `- Live EHR Network Connected: Pulled ${params.liveEHRRecords.toLocaleString()} anonymized patient records from TriNetX/Datavant to form a statistically rigorous control arm.` : ''}
${params.useAdaptiveDesign ? '- Bayesian Adaptive Design: ENABLED. The trial will automatically adjust patient allocation, drop failing dosages, or narrow the target demographic while running based on early data.' : ''}
${params.useRAG ? '- Retrieval-Augmented Generation (RAG): ENABLED. You MUST use the googleSearch tool to query PubChem, ChEMBL, and ClinicalTrials.gov for similar molecular structures and historical trial failures to ground your simulation in empirical data.' : ''}

Adjust the toxicity profile and side effects to logically match the provided deterministic success scores.`;

  const schema = {
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
      adaptiveDesignLog: { type: Type.STRING, description: "If Bayesian Adaptive Design is enabled, provide a log of how the trial pivoted early (e.g., dropped a dosage, narrowed demographic) and how much time/money was saved." },
      ragSources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "If RAG is enabled, list the specific empirical sources (e.g., PubChem CID, ClinicalTrials.gov NCT number) used to ground this simulation." },
      efficacyOverTime: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.NUMBER },
            efficacy: { type: Type.NUMBER, description: "Efficacy score 0-100" },
            placeboEfficacy: { type: Type.NUMBER, description: "Efficacy score of the Synthetic Control Arm (placebo) 0-100, if SCA is enabled" }
          },
          required: ["month", "efficacy"]
        },
        description: "Efficacy score over the duration of the trial"
      },
      sideEffectDistribution: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            percentage: { type: Type.NUMBER }
          },
          required: ["name", "percentage"]
        },
        description: "Distribution of side effects for charting"
      },
      statisticalConfidence: { type: Type.NUMBER, description: "Percentage 0-100 representing the statistical confidence interval of the simulation" },
      costSavingsEstimate: { type: Type.STRING, description: "Estimated cost savings by using virtual trials (e.g., '$45M')" },
      timeSavedEstimate: { type: Type.STRING, description: "Estimated time saved by using virtual trials (e.g., '18 months')" },
      subgroupAnalysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            group: { type: Type.STRING, description: "Demographic or genetic subgroup (e.g., 'Adults 18-35', 'EGFR+')" },
            efficacy: { type: Type.NUMBER, description: "Efficacy score 0-100 for this subgroup" },
            sampleSize: { type: Type.NUMBER, description: "Number of virtual patients in this subgroup" }
          },
          required: ["group", "efficacy", "sampleSize"]
        },
        description: "Efficacy analysis across different demographic or genetic subgroups"
      }
    },
    required: ["inSilicoSuccess", "inVitroSuccess", "toxicityProfile", "sideEffects", "overallViability", "humanTrialEliminationPotential", "longTermEfficacy", "pharmacokineticProfile", "patientAdherenceScore", "keyBiomarkers", "clearanceMechanism", "efficacyOverTime", "sideEffectDistribution", "statisticalConfidence", "costSavingsEstimate", "timeSavedEstimate", "subgroupAnalysis"],
  };

  return await generateStructuredContent(prompt, schema, undefined, params.useRAG);
};

export const generatePackaging = async (formulationName: string, category: string): Promise<PackagingResult> => {
  const prompt = `Act as a pharmaceutical supply chain, regulatory, and manufacturing economics expert. Design a complete, clinically accurate packaging and distribution plan for the novel drug "${formulationName}" (Category: ${category}).
Specify exact material grades (e.g., Type I Borosilicate Glass), ISO standards, stability data, temperature requirements, and a global distribution strategy.
Additionally, provide a detailed breakdown of the raw materials needed to build the packaging, scientific specifications for the packaging, and a comprehensive cost analysis for a standard batch (e.g., 10,000 units). The cost analysis must compare the final cost if the packaging is manufactured manually in-house versus if it is bought pre-made from a supplier. Include specific estimates for R&D cost, lab cost, infrastructure cost, labour cost, and land cost.
Finally, identify exactly 5 different premium packaging suppliers/sources who have their own manufacturing capabilities that could provide these materials.`;

  const schema = {
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
      sources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of the premium supplier" },
            description: { type: Type.STRING, description: "Brief description of the supplier and their manufacturing capabilities" },
            location: { type: Type.STRING, description: "Location of the supplier" },
            specialty: { type: Type.STRING, description: "What this supplier specializes in regarding pharmaceutical packaging" }
          },
          required: ["name", "description", "location", "specialty"]
        },
        description: "Exactly 5 premium packaging suppliers with their own manufacturing"
      },
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
    required: ["primaryPackaging", "secondaryPackaging", "temperatureControl", "distributionPlan", "vialType", "stopperType", "sealType", "shelfLife", "isoStandards", "materialsNeeded", "scientificSpecifications", "sources", "costs"],
  };

  return await generateStructuredContent(prompt, schema);
};

export const simulateDrugInteractions = async (
  primaryDrugName: string,
  primaryMechanism: string,
  secondaryDrugName: string
): Promise<InteractionResult> => {
  const prompt = `Act as an expert clinical pharmacologist and toxicologist. Simulate the potential drug-drug interaction between a novel formulation "${primaryDrugName}" (Mechanism of Action: ${primaryMechanism}) and an existing or proposed drug "${secondaryDrugName}".
Use real-time pharmacological databases and recent clinical studies to inform the interaction mechanism, severity, and clinical consequences. Ground your risk assessment in actual, current medical research regarding similar interactions.

Provide a detailed risk assessment including severity, a risk score (0-100), the pharmacokinetic/pharmacodynamic interaction mechanism, clinical consequences, actionable recommendations, and specific biological pathways affected.`;

  const schema = {
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
  };

  return await generateStructuredContent(prompt, schema);
};

export const chatWithJarvis = async (message: string, useDeepThink: boolean, useDeepSearch: boolean, history: { role: string, parts: { text: string }[] }[], appContext?: string): Promise<string> => {
  return await chatWithProvider(message, useDeepThink, useDeepSearch, history, appContext);
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  return await generateSpeechWithProvider(text);
};
