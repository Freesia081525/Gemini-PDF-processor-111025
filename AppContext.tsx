
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Agent, PipelineResult, ApiKeys, Translation } from './types';
import { DEFAULT_SAMPLE_AGENTS, TRANSLATIONS } from './constants';
import yaml from 'js-yaml';

interface AppContextType {
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  themeStyle: string;
  setThemeStyle: (style: string) => void;
  language: 'en' | 'zh';
  setLanguage: (lang: 'en' | 'zh') => void;
  t: (key: keyof Translation['en']) => string;
  apiKeys: ApiKeys;
  setApiKeys: React.Dispatch<React.SetStateAction<ApiKeys>>;
  providerHealth: Record<string, 'OK' | 'Error' | 'Not Configured'>;
  setProviderHealth: React.Dispatch<React.SetStateAction<Record<string, 'OK' | 'Error' | 'Not Configured'>>>;
  
  parsedText: string;
  setParsedText: (text: string) => void;
  
  agentsConfig: { version: number; agents: Agent[] };
  setAgentsConfig: (config: { version: number; agents: Agent[] }) => void;
  updateAgent: (updatedAgent: Agent) => void;

  selectedAgentIds: string[];
  setSelectedAgentIds: React.Dispatch<React.SetStateAction<string[]>>;

  pipelineResults: PipelineResult[];
  setPipelineResults: React.Dispatch<React.SetStateAction<PipelineResult[]>>;
  updateSinglePipelineResult: (result: PipelineResult) => void;
  clearPipelineResults: () => void;
}

export const AppContext = createContext<AppContextType>(null!);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [themeStyle, setThemeStyle] = useState<string>('Ferrari');
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ gemini: '', openai: '' });
  const [providerHealth, setProviderHealth] = useState<Record<string, 'OK' | 'Error' | 'Not Configured'>>({
      gemini: 'Not Configured',
      openai: 'Not Configured',
  });
  
  const [parsedText, setParsedText] = useState<string>('');
  const [agentsConfig, setAgentsConfig] = useState<{ version: number; agents: Agent[] }>(() => {
    try {
      const parsed = yaml.load(DEFAULT_SAMPLE_AGENTS) as { version: number; agents: Agent[] };
      return parsed || { version: 1, agents: [] };
    } catch (e) {
      console.error("Failed to parse default agents YAML:", e);
      return { version: 1, agents: [] };
    }
  });

  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [pipelineResults, setPipelineResults] = useState<PipelineResult[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  const t = (key: keyof Translation['en']) => {
    return TRANSLATIONS[language][key] || key;
  };

  const updateAgent = (updatedAgent: Agent) => {
    setAgentsConfig(prevConfig => {
      const newAgents = prevConfig.agents.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      );
      return { ...prevConfig, agents: newAgents };
    });
  };

  const updateSinglePipelineResult = (result: PipelineResult) => {
    setPipelineResults(prev => {
        const existingIndex = prev.findIndex(r => r.agent_id === result.agent_id);
        if (existingIndex > -1) {
            const newResults = [...prev];
            newResults[existingIndex] = result;
            return newResults;
        } else {
            const sortedResults = [...prev, result].sort((a, b) => a.step - b.step);
            return sortedResults;
        }
    });
  };
  
  const clearPipelineResults = () => {
    setPipelineResults([]);
  }

  const value = {
    themeMode, setThemeMode,
    themeStyle, setThemeStyle,
    language, setLanguage,
    t,
    apiKeys, setApiKeys,
    providerHealth, setProviderHealth,
    parsedText, setParsedText,
    agentsConfig, setAgentsConfig,
    updateAgent,
    selectedAgentIds, setSelectedAgentIds,
    pipelineResults, setPipelineResults,
    updateSinglePipelineResult,
    clearPipelineResults
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
