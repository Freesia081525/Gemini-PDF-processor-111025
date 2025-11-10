
import { GoogleGenAI } from "@google/genai";
import type { Agent, ApiKeys, ChatMessage } from '../types';

interface AgentExecutionResult {
    output: string;
    latency: number;
    provider: 'gemini' | 'openai';
}

export async function runAgent(agent: Agent, userInput: string, apiKeys: ApiKeys): Promise<AgentExecutionResult> {
    const { model, prompt } = agent;
    const provider = model.provider === 'auto' ? (apiKeys.gemini ? 'gemini' : 'openai') : model.provider;

    const startTime = Date.now();

    if (provider === 'gemini') {
        if (!apiKeys.gemini) throw new Error("Gemini API key is not configured.");
        try {
            // Using process.env.API_KEY is a placeholder as per instructions.
            // In a real client-side app, we pass the key from state.
            const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
            
            const fullPrompt = `${prompt}\n\n---\n\n${userInput}`;

            const response = await ai.models.generateContent({
                model: model.name,
                contents: fullPrompt,
                config: {
                    temperature: model.temperature,
                    maxOutputTokens: model.max_tokens,
                }
            });
            const output = response.text;
            const latency = (Date.now() - startTime) / 1000;
            return { output, latency, provider };

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    } else if (provider === 'openai') {
        if (!apiKeys.openai) throw new Error("OpenAI API key is not configured.");
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKeys.openai}`
                },
                body: JSON.stringify({
                    model: model.name,
                    messages: [
                        { role: "system", content: prompt },
                        { role: "user", content: userInput }
                    ],
                    temperature: model.temperature,
                    max_tokens: model.max_tokens
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error.message}`);
            }

            const data = await response.json();
            const output = data.choices[0].message.content;
            const latency = (Date.now() - startTime) / 1000;
            return { output, latency, provider };

        } catch (error) {
            console.error("OpenAI API Error:", error);
            throw error;
        }
    } else {
        throw new Error(`Unsupported provider: ${provider}`);
    }
}


export async function getOpenAIChatCompletion(messages: ChatMessage[], apiKey: string, model: string = 'gpt-4o-mini') {
    if (!apiKey) throw new Error("OpenAI API key is not configured.");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content as string;
}
