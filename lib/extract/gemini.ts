import { GoogleGenAI } from '@google/genai';
import { getExtractionPrompt } from './prompts';
import { parseAndValidate } from './parse';
import { getMockExtraction } from './mock';

export interface ExtractionInput {
  fileName: string;
  docType: string;
  mimeType: string;
  base64Data?: string;
}

export interface ExtractionOutput {
  success: boolean;
  docType: string;
  extractedData: Record<string, any>;
  confidenceNotes?: string;
  source: 'GEMINI' | 'DEMO_MOCK';
  rawOutput?: string;
}

export async function extractDocumentData(input: ExtractionInput): Promise<ExtractionOutput> {
  const { fileName, docType, mimeType, base64Data } = input;
  const isDemoMode = process.env.DEMO_MODE === 'true';
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If Demo mode is explicitly set OR API key is missing, use realistic mock extraction
  if (isDemoMode || !apiKey) {
    const mock = getMockExtraction(fileName, docType);
    return {
      success: true,
      docType: mock.docType,
      extractedData: mock.data,
      confidenceNotes: mock.confidenceNotes,
      source: 'DEMO_MOCK',
    };
  }

  // Attempt multimodal extraction via Gemini API
  const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
  const prompt = getExtractionPrompt(docType);

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents: any[] = [{ text: prompt }];

    if (base64Data) {
      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg',
        },
      });
    }

    // Attempt 1
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
    });

    const textOutput = response.text || '';
    const parsed = parseAndValidate(textOutput, docType);

    if (parsed.success) {
      return {
        success: true,
        docType,
        extractedData: parsed.data,
        confidenceNotes: parsed.data.confidenceNotes || 'Extracted via Google Gemini multimodal model.',
        source: 'GEMINI',
        rawOutput: textOutput,
      };
    }

    // Retry once on malformed JSON
    const retryResponse = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: prompt },
        {
          text: `CRITICAL RETRY: Your previous output was not valid JSON (${parsed.error}). Here was your output: "${textOutput}". Fix the JSON and respond ONLY with the valid JSON object.`,
        },
      ],
    });

    const retryText = retryResponse.text || '';
    const retryParsed = parseAndValidate(retryText, docType);

    if (retryParsed.success) {
      return {
        success: true,
        docType,
        extractedData: retryParsed.data,
        confidenceNotes: retryParsed.data.confidenceNotes || 'Extracted via Gemini (corrected on retry).',
        source: 'GEMINI',
        rawOutput: retryText,
      };
    }

    // Fall back safely to mock if Gemini failed to format JSON
    const fallbackMock = getMockExtraction(fileName, docType);
    return {
      success: true,
      docType,
      extractedData: fallbackMock.data,
      confidenceNotes: `Gemini JSON parse error, used fallback schema. Notes: ${fallbackMock.confidenceNotes}`,
      source: 'DEMO_MOCK',
    };
  } catch (error: any) {
    console.error('Gemini extraction error:', error?.message || error);
    // Graceful fallback to mock so app is always reliable during demos
    const fallbackMock = getMockExtraction(fileName, docType);
    return {
      success: true,
      docType,
      extractedData: fallbackMock.data,
      confidenceNotes: `Offline fallback (${error?.message || 'Gemini error'}). ${fallbackMock.confidenceNotes}`,
      source: 'DEMO_MOCK',
    };
  }
}
