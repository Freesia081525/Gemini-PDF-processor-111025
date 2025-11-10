
import { Agent } from './types';

export const AGENTS: Agent[] = [
  {
    name: "Document Summarizer",
    prompt: "Provide a concise summary of this document, accurately capturing its core arguments and main findings.",
    model: "gemini-2.5-flash",
  },
  {
    name: "Keyword Extractor",
    prompt: "Extract the most important keywords and technical terms from the document. Present them as a comma-separated list.",
    model: "gemini-2.5-flash",
  },
  {
    name: "Sentiment Analyzer",
    prompt: "Analyze the overall sentiment of the document. Classify it as Positive, Negative, or Neutral, and provide a brief explanation for your reasoning.",
    model: "gemini-2.5-pro",
  },
  {
    name: "Action Item Identifier",
    prompt: "List all specific action items, tasks, and to-dos mentioned in the document. If there are none, state that explicitly.",
    model: "gemini-2.5-pro",
  },
  {
    name: "Risk Assessment",
    prompt: "Conduct a thorough risk assessment based on the document's content. Identify potential risks, underlying assumptions, and uncertainties. Formulate challenging questions about the content.",
    model: "gemini-2.5-pro",
  },
];

export const MODELS: Agent['model'][] = ["gemini-2.5-flash", "gemini-2.5-pro"];
