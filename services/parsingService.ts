
import type { ApiKeys } from '../types';
import { GoogleGenAI } from '@google/genai';

// This function needs to be in the global scope for pdf.js
declare global {
    interface Window {
        pdfjsWorker: string;
        pdfjsLib: any;
    }
}

async function getPdfDoc(file: File) {
    const pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = window.pdfjsWorker;
    const arrayBuffer = await file.arrayBuffer();
    return pdfjsLib.getDocument(arrayBuffer).promise;
}

export async function parsePdfToText(file: File): Promise<string> {
    try {
        const pdf = await getPdfDoc(file);
        const numPages = pdf.numPages;
        const textParts: string[] = [];

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            textParts.push(pageText);
        }
        return textParts.join('\n\n---\nPage Separator\n---\n\n');
    } catch (e) {
        console.error("Standard PDF parsing error:", e);
        return `Error parsing PDF: ${e instanceof Error ? e.message : String(e)}`;
    }
}

function canvasToDataURL(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

export async function parsePdfWithLLM(
    file: File, 
    provider: 'gemini' | 'openai', 
    modelName: string, 
    apiKeys: ApiKeys, 
    onProgress: (progress: number, text: string) => void
): Promise<string> {
    
    const apiKey = provider === 'gemini' ? apiKeys.gemini : apiKeys.openai;
    if (!apiKey) {
        throw new Error(`API key for ${provider} is not configured.`);
    }

    try {
        const pdf = await getPdfDoc(file);
        const numPages = pdf.numPages;
        const extractedTextParts: string[] = [];

        for (let i = 1; i <= numPages; i++) {
            onProgress(i / numPages, `Processing page ${i} of ${numPages}...`);
            
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (!context) {
                extractedTextParts.push(`\n[--- OCR failed for page ${i}: could not get canvas context ---]\n`);
                continue;
            }

            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const base64Image = canvasToDataURL(canvas);
            const promptText = "Extract all text from this document page, maintaining the original structure and reading order as best as possible.";

            let pageText = '';
            
            if (provider === 'gemini') {
                const ai = new GoogleGenAI({ apiKey });
                const imagePart = {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    },
                };
                const textPart = { text: promptText };
                
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: { parts: [imagePart, textPart] }
                });
                pageText = response.text;
            } else { // openai
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: [{
                            role: "user",
                            content: [
                                { type: "text", text: promptText },
                                { type: "image_url", image_url: { "url": `data:image/jpeg;base64,${base64Image}` } }
                            ]
                        }],
                        max_tokens: 4096,
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`OpenAI API Error for page ${i}: ${errorData.error.message}`);
                }
                const data = await response.json();
                pageText = data.choices[0].message.content;
            }

            extractedTextParts.push(pageText);
        }
        onProgress(1, "Processing complete.");
        return extractedTextParts.join('\n\n---\nPage Separator\n---\n\n');

    } catch (e) {
        console.error("LLM-based OCR error:", e);
        onProgress(1, `Error during OCR: ${e instanceof Error ? e.message : String(e)}`);
        throw e;
    }
}


export function parsePlainText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            resolve(event.target?.result as string);
        };
        reader.onerror = (error) => {
            reject(error);
        };
        reader.readAsText(file);
    });
}
