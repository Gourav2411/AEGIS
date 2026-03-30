import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export type AIProvider = 'gemini' | 'openai' | 'anthropic';

let currentProvider: AIProvider = (localStorage.getItem('ai_provider') as AIProvider) || 'gemini';
let customApiKey = localStorage.getItem('gemini_api_key') || '';

export const getCurrentProvider = () => currentProvider;

export const setAiProvider = (provider: AIProvider) => {
  currentProvider = provider;
  localStorage.setItem('ai_provider', provider);
};

export const setGeminiApiKey = (key: string) => {
  customApiKey = key;
  localStorage.setItem('gemini_api_key', key);
};

export const getEffectiveApiKey = () => {
  if (customApiKey === 'AI_STUDIO_ADMIN') {
    return process.env.GEMINI_API_KEY || 'missing-key';
  }
  const envKey = process.env.GEMINI_API_KEY;
  const validCustomKey = (customApiKey && customApiKey !== 'undefined' && customApiKey !== 'null') ? customApiKey : '';
  return validCustomKey || (envKey !== 'undefined' ? envKey : '') || 'missing-key';
};

// Helper to convert Gemini Type schema to standard JSON schema
function convertGeminiSchemaToJsonSchema(schema: any): any {
  if (!schema) return {};
  
  const result: any = {};
  
  if (schema.type === Type.OBJECT || schema.type === 'OBJECT') {
    result.type = "object";
    result.properties = {};
    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        result.properties[key] = convertGeminiSchemaToJsonSchema(value);
      }
    }
    if (schema.required) {
      result.required = schema.required;
    } else if (schema.properties) {
      result.required = Object.keys(schema.properties); // OpenAI strict mode requires all properties to be required
    }
    result.additionalProperties = false;
  } else if (schema.type === Type.ARRAY || schema.type === 'ARRAY') {
    result.type = "array";
    result.items = convertGeminiSchemaToJsonSchema(schema.items);
  } else if (schema.type === Type.STRING || schema.type === 'STRING') {
    result.type = "string";
    if (schema.description) result.description = schema.description;
  } else if (schema.type === Type.NUMBER || schema.type === 'NUMBER') {
    result.type = "number";
    if (schema.description) result.description = schema.description;
  } else if (schema.type === Type.INTEGER || schema.type === 'INTEGER') {
    result.type = "integer";
    if (schema.description) result.description = schema.description;
  } else if (schema.type === Type.BOOLEAN || schema.type === 'BOOLEAN') {
    result.type = "boolean";
    if (schema.description) result.description = schema.description;
  }
  
  return result;
}

export const generateStructuredContent = async (prompt: string, schema: any, systemInstruction?: string, useRAG?: boolean): Promise<any> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("API Key is missing. Please configure it in your environment variables or login.");
  }

  if (currentProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    const config: any = {
      responseMimeType: "application/json",
      responseSchema: schema,
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (useRAG) {
      config.tools = [{ googleSearch: {} }];
    }
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config,
      });
      return JSON.parse(response.text || "{}");
    } catch (error: any) {
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        throw new Error("Gemini API Quota Exceeded. Please check your plan and billing details, or try again later.");
      }
      throw error;
    }
  } 
  
  if (currentProvider === 'openai') {
    const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    
    // Convert Gemini schema to JSON schema
    const jsonSchema = convertGeminiSchemaToJsonSchema(schema);
    
    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "result",
          schema: jsonSchema,
          strict: true
        }
      }
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  }

  if (currentProvider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    
    const jsonSchema = convertGeminiSchemaToJsonSchema(schema);
    
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 4000,
      system: systemInstruction,
      messages: [{ role: "user", content: prompt }],
      tools: [{
        name: "return_result",
        description: "Return the result in the required JSON format.",
        input_schema: jsonSchema
      }],
      tool_choice: { type: "tool", name: "return_result" }
    });

    const toolCall = response.content.find(c => c.type === 'tool_use');
    if (toolCall && toolCall.type === 'tool_use') {
      return toolCall.input;
    }
    return {};
  }
};

export const chatWithProvider = async (message: string, useDeepThink: boolean, useDeepSearch: boolean, history: { role: string, parts: { text: string }[] }[], appContext?: string): Promise<string> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("API Key is missing.");
  }

  let systemInstruction = "You are Aegis, an advanced AI drug discovery assistant. You are helpful, scientific, concise, and communicate with a slightly robotic, highly intelligent tone. You assist users in understanding drug formulations, trials, and supply chains.";
  
  if (appContext) {
    systemInstruction += "\n\n" + appContext;
  }

  if (currentProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    const model = useDeepThink ? "gemini-3.1-pro-preview" : "gemini-2.5-flash-lite";
    const config: any = { systemInstruction };
    if (useDeepThink) config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    if (useDeepSearch) config.tools = [{ googleSearch: {} }];

    const chat = ai.chats.create({ model, config, history });
    try {
      const response = await chat.sendMessage({ message });
      return response.text || "I was unable to process that request.";
    } catch (error: any) {
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        throw new Error("Gemini API Quota Exceeded. Please check your plan and billing details, or try again later.");
      }
      throw error;
    }
  }

  if (currentProvider === 'openai') {
    const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
    const messages: any[] = [{ role: "system", content: systemInstruction }];
    
    for (const h of history) {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.parts.map(p => p.text).join('\n')
      });
    }
    messages.push({ role: "user", content: message });

    const response = await openai.chat.completions.create({
      model: useDeepThink ? "gpt-4o" : "gpt-4o-mini",
      messages: messages,
    });
    return response.choices[0].message.content || "I was unable to process that request.";
  }

  if (currentProvider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    const messages: any[] = [];
    
    for (const h of history) {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.parts.map(p => p.text).join('\n')
      });
    }
    messages.push({ role: "user", content: message });

    const response = await anthropic.messages.create({
      model: useDeepThink ? "claude-3-opus-20240229" : "claude-3-haiku-20240307",
      max_tokens: 4000,
      system: systemInstruction,
      messages: messages,
    });
    
    const textContent = response.content.find(c => c.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : "I was unable to process that request.";
  }

  return "Provider not supported.";
};

export const generateSpeechWithProvider = async (text: string): Promise<string | null> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') return null;

  try {
    if (currentProvider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    }

    if (currentProvider === 'openai') {
      const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: text,
      });
      const buffer = await mp3.arrayBuffer();
      // Convert ArrayBuffer to Base64 in browser
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }

    // Anthropic does not have TTS, fallback to null or browser TTS
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const generateClinicalTrialReport = async (
  formulation: any,
  trialResult: any,
  formData: any,
  trialParams?: any,
  qsarData?: any,
  dockingData?: any
): Promise<string> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("API Key is missing. Please configure it in the settings.");
  }

  const prompt = `Act as a Lead Clinical Investigator and Medical Writer. Generate a comprehensive, professional Computational Drug Candidate Hypothesis for the drug candidate ${formulation.name}.
  
  CRITICAL FRAMING: This is a computational hypothesis, NOT a clinical study report. Do not call it a CSR or IND. The correct framing is: "We used AI-assisted virtual screening to generate a prioritized drug candidate hypothesis for experimental validation." Include this exact disclaimer at the beginning of the document.
  
  The report should be formatted in Markdown and look like a real-life scientific document. Include the following sections, detailing a rigorous 5-stage plan for experimental validation:
  
  1. Title Page (Drug Name, Indication, Phase Hypothesis, Date)
  2. Synopsis (Brief summary of the drug and virtual screening results)
  3. Stage 0: Fixing the Foundation (SMILES validation, RDKit/ChemDraw 2D/3D structure generation, database checks against ChEMBL/PubChem, IP position and CAS registry)
  4. Stage 1: Computational Validation (Molecular Docking with MM-GBSA rescoring, Selectivity panel, MD Simulations, ADMET Prediction including hERG IC50 modeling, Off-Target Liability Screening)
  5. Stage 2: Synthesis and Early Characterization (Synthetic Route Design, Analytical Characterization including NMR/HRMS/HPLC, Physical-Chemical Properties measurement)
  6. Stage 3: In Vitro Biology (Biochemical Assays confirming IC50, Cell-Based Efficacy Assays, ADMET In Vitro Panel including CYP inhibition and hERG electrophysiology)
  7. Stage 4: In Vivo Preclinical Studies (PK Studies in Rodents, Efficacy in Xenograft Models, Regulatory Toxicology - GLP Studies)
  8. Stage 5: The Real IND Application (Module 2: Non-Clinical Overview, Module 3: CMC, Module 4: Non-Clinical Study Reports, Module 5: Clinical Protocol)
  
  Incorporate the following specific data into the relevant stages:
  - Target disease: ${formData.disease}, Cure Type: ${formData.cureType}, Receptor: ${formData.receptor}
  - Efficacy Evaluation: In-Silico Success: ${trialResult.inSilicoSuccess}%, In-Vitro Success: ${trialResult.inVitroSuccess}%
  - Viability Score: ${trialResult.overallViability}%, Statistical Confidence: ${trialResult.statisticalConfidence}%
  - Estimated Cost Savings: ${trialResult.costSavingsEstimate}, Estimated Time Saved: ${trialResult.timeSavedEstimate}
  - Subgroup Analysis: ${JSON.stringify(trialResult.subgroupAnalysis)}
  ${trialParams?.useSCA ? `- Synthetic Control Arm (SCA) Analysis: Detail how the virtual placebo group generated from EHR data accelerated the trial and reduced costs, replacing ${Number(trialParams.cohortSize) / 2} human subjects` : ''}
  ${trialParams?.useAdaptiveDesign ? `- Bayesian Adaptive Design Log: Detail how the trial pivoted early based on this log: ${trialResult.adaptiveDesignLog}` : ''}
  
  ${dockingData && !dockingData.error ? `CRITICAL DATA TO INCLUDE IN STAGE 1 (Molecular Docking):
  - Binding Energy: ${dockingData.bindingEnergy} kcal/mol
  - Spatial Fit Score: ${dockingData.spatialFitScore}/100
  - Interacting Residues: ${dockingData.interactingResidues?.join(', ') || 'N/A'}` : ''}

  ${qsarData && !qsarData.error ? `CRITICAL DATA TO INCLUDE IN STAGE 1 (ADMET/QSAR Prediction):
  - Toxicity (LD50): ${qsarData.toxicityLD50} mg/kg
  - Solubility: ${qsarData.solubility} mg/mL
  - Clearance Rate: ${qsarData.clearanceRate} mL/min/kg
  - LogP: ${qsarData.logP}` : ''}
  
  ${trialParams?.useRAG ? `CRITICAL INSTRUCTION: You MUST use the googleSearch tool to query PubChem, ChEMBL, and ClinicalTrials.gov for similar molecular structures and historical trial failures. Base your report strictly on empirical data from structurally similar compounds found in these databases. Cite the sources in the report.` : ''}
  
  Make the report highly detailed, scientific, and realistic. Use appropriate medical terminology. Do not include any JSON, just the Markdown text.`;

  try {
    if (currentProvider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: key });
      const config: any = {};
      if (trialParams?.useRAG) {
        config.tools = [{ googleSearch: {} }];
      }
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: config
      });
      return response.text || "Report generation failed.";
    } else if (currentProvider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      });
      return (response.content[0] as any).text || "Report generation failed.";
    } else {
      const openai = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
      return response.choices[0].message.content || "Report generation failed.";
    }
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      throw new Error("Gemini API Quota Exceeded. Please check your plan and billing details, or try again later.");
    }
    throw error;
  }
};
