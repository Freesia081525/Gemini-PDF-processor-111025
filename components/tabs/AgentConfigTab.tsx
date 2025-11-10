
import React, { useContext } from 'react';
import { AppContext } from '../../AppContext';
import type { Agent } from '../../types';
import { SlidersHorizontal, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import yaml from 'js-yaml';


const AgentCard: React.FC<{ agent: Agent, isSelected: boolean, onSelect: (id: string, selected: boolean) => void }> = ({ agent, isSelected, onSelect }) => {
    const { updateAgent } = useContext(AppContext);
    const [isExpanded, setIsExpanded] = React.useState(false);

    const handleInputChange = (field: keyof Agent['model'], value: any) => {
        const updatedAgent = {
            ...agent,
            model: {
                ...agent.model,
                [field]: value
            }
        };
        updateAgent(updatedAgent);
    };

    const handlePromptChange = (value: string) => {
        updateAgent({ ...agent, prompt: value });
    };

    return (
        <div className="bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700 transition-all duration-300">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center space-x-4">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onSelect(agent.id, e.target.checked);
                        }}
                        className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-700"
                    />
                    <div>
                        <h3 className="font-bold">{agent.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agent.description}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                     <span className={`text-xs px-2 py-1 rounded-full ${agent.model.provider === 'gemini' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                        {agent.model.provider}
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-gray-200 dark:border-zinc-700 space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Model Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium">Provider</label>
                                <select value={agent.model.provider} onChange={(e) => handleInputChange('provider', e.target.value)} className="w-full mt-1 p-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm">
                                    <option value="auto">Auto</option>
                                    <option value="gemini">Gemini</option>
                                    <option value="openai">OpenAI</option>
                                </select>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Model Name</label>
                                <input type="text" value={agent.model.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full mt-1 p-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"/>
                            </div>
                             <div>
                                <label className="text-sm font-medium">Max Tokens</label>
                                <input type="number" value={agent.model.max_tokens} onChange={(e) => handleInputChange('max_tokens', Number(e.target.value))} className="w-full mt-1 p-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"/>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Temperature: {agent.model.temperature}</label>
                                <input type="range" min="0" max="1" step="0.05" value={agent.model.temperature} onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))} className="w-full mt-2"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">System Prompt</h4>
                        <textarea 
                            value={agent.prompt}
                            onChange={(e) => handlePromptChange(e.target.value)}
                            className="w-full h-40 p-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-gray-50 dark:bg-zinc-900/50 text-sm font-mono"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const AgentConfigTab: React.FC = () => {
    const { agentsConfig, setAgentsConfig, selectedAgentIds, setSelectedAgentIds, t } = useContext(AppContext);
    
    const handleSelectAgent = (id: string, selected: boolean) => {
        setSelectedAgentIds(prev =>
            selected ? [...prev, id] : prev.filter(agentId => agentId !== id)
        );
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const newConfig = yaml.load(content) as { version: number, agents: Agent[] };
                    if (newConfig && newConfig.agents && Array.isArray(newConfig.agents)) {
                        setAgentsConfig(newConfig);
                    } else {
                        alert("Invalid YAML structure.");
                    }
                } catch (error) {
                    console.error("Failed to parse YAML file", error);
                    alert("Failed to parse YAML file.");
                }
            };
            reader.readAsText(file);
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('select_agents')}</h2>
                <label htmlFor="yaml-upload" className="flex items-center space-x-2 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out cursor-pointer bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 border dark:border-zinc-600">
                    <Upload size={16} />
                    <span>Upload agents.yaml</span>
                    <input id="yaml-upload" type="file" accept=".yaml,.yml" className="sr-only" onChange={handleFileUpload} />
                </label>
            </div>
            {agentsConfig.agents.length > 0 ? (
                <div className="space-y-4">
                    {agentsConfig.agents.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            isSelected={selectedAgentIds.includes(agent.id)}
                            onSelect={handleSelectAgent}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 px-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                    <p>No agents configured. Please upload an `agents.yaml` file.</p>
                </div>
            )}
            
            {selectedAgentIds.length > 0 && (
                 <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-t dark:border-zinc-700">
                    <div className="max-w-6xl mx-auto text-center">
                        <p className="font-semibold">
                            {selectedAgentIds.length} agent(s) selected for the pipeline.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Proceed to the 'Agent Pipeline' tab to execute.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentConfigTab;
