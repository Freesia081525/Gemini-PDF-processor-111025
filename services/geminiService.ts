
import { GoogleGenAI } from "@google/genai";
import type { Agent, PageData } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please set your API key.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_HERE" });

function base64ToPart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64.split(',')[1],
      mimeType,
    },
  };
}

export async function performOcrOnPages(pages: PageData[]): Promise<string> {
  if (pages.length === 0) {
    return "";
  }
  const model = 'gemini-2.5-flash-image';
  
  const imageParts = pages.map(page => base64ToPart(page.imageDataUrl, 'image/png'));
  
  const prompt = `You are an expert OCR system. Extract all text from the following document pages in the order they are provided. Combine the text into a single, coherent document.
  Pages are provided sequentially. Do not add any commentary or formatting beyond the extracted text itself.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }, ...imageParts] }
    });
    return response.text;
  } catch (error) {
    console.error("Error during OCR:", error);
    throw new Error("Failed to perform OCR on the document pages.");
  }
}


export async function* runAgent(
  agent: Agent,
  documentText: string,
): AsyncGenerator<string, void, unknown> {
  const model = agent.model;
  
  const systemInstruction = "You are a meticulous, multilingual document analyst AI. Follow the user's instructions precisely. Be concise but complete. Prioritize correctness and faithfulness to the source document.";
  const userPrompt = `${agent.prompt}\n\n--- DOCUMENT CONTENT ---\n${documentText}`;
  
  try {
    const response = await ai.models.generateContentStream({
      model,
      contents: { parts: [{ text: userPrompt }] },
      config: {
        systemInstruction,
      }
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch (error) {
    console.error(`Error running agent "${agent.name}":`, error);
    throw new Error(`Agent "${agent.name}" failed to execute.`);
  }
}
