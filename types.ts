
import type { LucideIcon } from 'lucide-react';

export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  emoji: string;
}

export interface Translation {
  en: {
    title: string;
    subtitle: string;
    settings: string;
    theme: string;
    language: string;
    api_keys: string;
    upload_parse: string;
    summary: string;
    checklist: string;
    agents: string;
    dashboard: string;
    reports: string;
    agent_config: string;
    select_agents: string;
    agent_pipeline: string;
    execute: string;
    input: string;
    output: string;
    modify: string;
    next: string;
    completion_rate: string;
    tokens: string;
    latency: string;
    generate: string;
    download: string;
    light: string;
    dark: string;
  };
  zh: Translation['en'];
}

export interface ApiKeys {
    gemini: string;
    openai: string;
}

export interface Agent {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    model: {
        provider: 'gemini' | 'openai' | 'auto';
        name: string;
        temperature: number;
        max_tokens: number;
    };
    prompt: string;
}

export interface PipelineResult {
    step: number;
    agent_id: string;
    agent_name: string;
    input: string;
    output: string;
    timestamp: number;
    latency?: number;
    status: 'pending' | 'completed' | 'error';
    error?: string;
    provider?: string;
}

export interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
