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
  return customApiKey || process.env.GEMINI_API_KEY || 'missing-key';
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
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config,
    });
    return JSON.parse(response.text || "{}");
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

export const chatWithProvider = async (message: string, useDeepThink: boolean, useDeepSearch: boolean, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("API Key is missing.");
  }

  const systemInstruction = "You are Aegis, an advanced AI drug discovery assistant. You are helpful, scientific, concise, and communicate with a slightly robotic, highly intelligent tone. You assist users in understanding drug formulations, trials, and supply chains.";

  if (currentProvider === 'gemini') {
    const ai = new GoogleGenAI({ apiKey: key });
    const model = useDeepThink ? "gemini-3.1-pro-preview" : "gemini-2.5-flash-lite";
    const config: any = { systemInstruction };
    if (useDeepThink) config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    if (useDeepSearch) config.tools = [{ googleSearch: {} }];

    const chat = ai.chats.create({ model, config, history });
    const response = await chat.sendMessage({ message });
    return response.text || "I was unable to process that request.";
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
  trialParams?: any
): Promise<string> => {
  const key = getEffectiveApiKey();
  if (key === 'missing-key') {
    throw new Error("API Key is missing. Please configure it in the settings.");
  }

  const prompt = `Act as a Lead Clinical Investigator and Medical Writer. Generate a comprehensive, professional Clinical Study Report (CSR) for the drug candidate ${formulation.name}.
  
  The report should be formatted in Markdown and look like a real-life clinical trial document. Include the following sections:
  1. Title Page (Drug Name, Indication, Phase, Date)
  2. Synopsis (Brief summary of the drug and trial results)
  3. Investigational Plan (Based on the target disease: ${formData.disease}, Cure Type: ${formData.cureType}, Receptor: ${formData.receptor})
  4. Formulation Details (Mechanism of Action, Target Receptors, Molecular Weight, LogP, etc.)
  5. Efficacy Evaluation (In-Silico Success: ${trialResult.inSilicoSuccess}%, In-Vitro Success: ${trialResult.inVitroSuccess}%, Long-Term Efficacy)
  6. Safety Evaluation (Toxicity Profile, Side Effects, Clearance Mechanism)
  7. Pharmacokinetic Profile (Absorption, Distribution, Metabolism, Excretion)
  8. Discussion and Overall Conclusions (Viability Score: ${trialResult.overallViability}%, Human Trial Elimination Potential)
  ${trialParams?.useSCA ? `9. Synthetic Control Arm (SCA) Analysis (Detail how the virtual placebo group generated from EHR data accelerated the trial and reduced costs, replacing ${Number(trialParams.cohortSize) / 2} human subjects)` : ''}
  ${trialParams?.useAdaptiveDesign ? `10. Bayesian Adaptive Design Log (Detail how the trial pivoted early, such as dropping failing dosages or narrowing the target demographic, based on this log: ${trialResult.adaptiveDesignLog})` : ''}
  
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
  } catch (error) {
    console.error("Report Generation Error:", error);
    throw error;
  }
};
