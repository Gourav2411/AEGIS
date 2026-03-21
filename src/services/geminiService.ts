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
  agenticMode: boolean = false
): Promise<FormulationResult> => {
  // Step 1: Ask Gemini to identify a real compound
  const identificationPrompt = `Act as an expert computational chemist and pharmacologist. Based on the following parameters, identify ONE real, existing chemical compound or drug that is used, heavily researched, or highly relevant for this condition.
Disease: ${disease}
Cure Required: ${cureRequired}
Category: ${category}
Target Receptors: ${receptors}

Return a JSON object with a single field 'compoundName' containing the exact name of the chemical compound (e.g., "Osimertinib", "Imatinib", "Aspirin").`;

  const idSchema = {
    type: Type.OBJECT,
    properties: {
      compoundName: { type: Type.STRING }
    },
    required: ["compoundName"]
  };

  const idResult = await generateStructuredContent(identificationPrompt, idSchema);
  const compoundName = idResult.compoundName;

  // Step 2: Query PubChem for real data
  let pubchemData: any = null;
  try {
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(compoundName)}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`);
    if (response.ok) {
      const data = await response.json();
      if (data.PropertyTable?.Properties?.length > 0) {
        pubchemData = data.PropertyTable.Properties[0];
      }
    }
  } catch (error) {
    console.warn("PubChem API fetch failed:", error);
  }

  // Step 3: Generate the full formulation profile using the real data
  let prompt = `Act as an expert computational chemist and pharmacologist. We are analyzing the real compound "${compoundName}" for the following parameters:
Disease: ${disease}
Cure Required: ${cureRequired}
Category: ${category}
Target Receptors: ${receptors}

${pubchemData ? `
Use the following REAL empirical data from PubChem for this compound:
- IUPAC Name: ${pubchemData.IUPACName || 'N/A'}
- Chemical Formula: ${pubchemData.MolecularFormula || 'N/A'}
- SMILES: ${pubchemData.CanonicalSMILES || 'N/A'}
- Molecular Weight: ${pubchemData.MolecularWeight || 'N/A'} g/mol
` : 'No PubChem data was found. Please provide the most accurate known chemical formula and SMILES string for this compound.'}

Provide a detailed clinical profile. Use the real chemical formula and SMILES string if provided above. Generate a unique alphanumeric compound ID (e.g., AEGIS-742X) for our internal tracking. Provide the estimated manufacturing cost per dose, its mechanism of action, a detailed rationale explaining exactly WHY this specific molecular structure and mechanism target the specified disease, binding affinity (e.g., Ki or IC50), estimated half-life, bioavailability, solubility, pKa, predicted drug-drug interactions, a list of active synthetic ingredients, and identify the 3 closest existing medicines globally with their estimated pricing and similarity score.`;

  if (agenticMode) {
    prompt = `Act as an autonomous AI drug discovery agent (Aegis 2035). You are tasked with optimizing a base compound into a NOVEL, mathematically superior derivative through a high-throughput agentic loop.
Base Compound Identified: "${compoundName}"
Disease: ${disease}
Target Receptors: ${receptors}

${pubchemData ? `
Base Empirical Data:
- SMILES: ${pubchemData.CanonicalSMILES || 'N/A'}
- Molecular Weight: ${pubchemData.MolecularWeight || 'N/A'} g/mol
` : ''}

AGENTIC LOOP INSTRUCTIONS:
1. Simulate the generation of 10,000 initial molecular candidates based on the base compound.
2. Run a simulated high-throughput in-silico screening to select the top 1% (100 candidates).
3. Analyze the base compound's SMILES string and its known binding deficiencies or toxicity risks.
4. Perform an in-silico quantum-mechanical mutation on the top candidates (e.g., adding a fluorine atom to improve metabolic stability, modifying a functional group to increase binding affinity to ${receptors} and reduce toxicity).
5. Re-simulate binding affinities and finalize the single most mathematically perfect molecule.
6. Generate the NOVEL SMILES string for this optimized derivative.
7. Provide a detailed clinical profile for this NEW, optimized compound.
8. Include an 'optimizationLog' array detailing the specific iterative steps you took in this loop (e.g., "Generated 10,000 variants", "Screened top 1%", "Mutated SMILES to reduce hepatotoxicity", "Finalized AEGIS-X").

Provide the estimated manufacturing cost per dose, its mechanism of action, a detailed rationale explaining exactly WHY this specific mutated molecular structure is superior, binding affinity (e.g., Ki or IC50), estimated half-life, bioavailability, solubility, pKa, predicted drug-drug interactions, a list of active synthetic ingredients, and identify the 3 closest existing medicines globally with their estimated pricing and similarity score.`;
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: agenticMode ? "The name of the novel derivative (e.g., 'Fluoro-Osimertinib Analog')" : "The real drug/compound name" },
      compoundId: { type: Type.STRING, description: "A unique alphanumeric compound identifier (e.g., AEGIS-742X)" },
      chemicalFormula: { type: Type.STRING, description: "Chemical formula (e.g. C22H28FN3O6S)" },
      smilesString: { type: Type.STRING, description: "Valid SMILES string representing the molecular structure" },
      molecularStructure: { type: Type.STRING, description: "Text description of the molecular structure" },
      manufacturingCost: { type: Type.STRING, description: "Estimated manufacturing cost per dose (e.g. $1.25/dose)" },
      mechanismOfAction: { type: Type.STRING, description: "Detailed clinical mechanism of action" },
      rationale: { type: Type.STRING, description: "Detailed scientific explanation of WHY this specific molecular structure and mechanism of action target the specified disease/condition." },
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
      optimizationLog: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Log of agentic iterations (only if agenticMode is true)" }
    },
    required: ["name", "compoundId", "chemicalFormula", "smilesString", "molecularStructure", "manufacturingCost", "mechanismOfAction", "rationale", "bindingAffinity", "halfLife", "bioavailability", "solubility", "pKa", "drugInteractions", "activeIngredients", "closestMedicines"],
  };

  const result = await generateStructuredContent(prompt, schema);
  
  // Inject PubChem data into the final result if available AND NOT in agentic mode
  // In agentic mode, the compound is novel, so we don't want to overwrite its SMILES with the base compound's SMILES
  if (pubchemData && !agenticMode) {
    return {
      ...result,
      cid: pubchemData.CID,
      iupacName: pubchemData.IUPACName,
      chemicalFormula: pubchemData.MolecularFormula || result.chemicalFormula,
      smilesString: pubchemData.CanonicalSMILES || result.smilesString,
    };
  } else if (pubchemData && agenticMode) {
    return {
      ...result,
      baseSmiles: pubchemData.CanonicalSMILES
    };
  }

  return result;
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

export const simulateTrial = async (formulationName: string, mechanism: string, params: TrialParams, csvData?: string): Promise<TrialResult> => {
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

  const prompt = `Act as a lead clinical data scientist and toxicologist. Simulate highly realistic, clinically accurate in-silico and in-vitro trials for the novel drug "${formulationName}" with mechanism: "${mechanism}".

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
