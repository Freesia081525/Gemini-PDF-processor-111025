
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { runAgent } from '../../services/llmService';
import type { PipelineResult } from '../../types';
import { ArrowDown } from 'lucide-react';

const PipelineStep: React.FC<{ agentId: string, step: number, isLast: boolean, onExecute: () => Promise<void> }> = ({ agentId, step, isLast, onExecute }) => {
    const { agentsConfig, pipelineResults, parsedText } = useContext(AppContext);
    const [isExecuting, setIsExecuting] = useState(false);
    
    const agent = agentsConfig.agents.find(a => a.id === agentId);
    const result = pipelineResults.find(r => r.agent_id === agentId);

    const prevResult = step > 1 ? pipelineResults.find(r => r.step === step - 1) : null;
    const input = step === 1 ? parsedText : (prevResult?.output || '');
    
    const handleExecute = async () => {
        setIsExecuting(true);
        await onExecute();
        setIsExecuting(false);
    };

    if (!agent) return null;

    return (
        <div>
            <div className="p-4 sm:p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700 relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                    {step}
                </div>
                <h3 className="text-lg font-bold ml-6">{agent.name}</h3>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="font-semibold">Input</label>
                        <textarea
                            value={input}
                            readOnly
                            className="w-full h-32 p-2 mt-1 border border-gray-300 dark:border-zinc-600 rounded-md bg-gray-50 dark:bg-zinc-900/50 text-sm"
                        />
                    </div>
                    <div>
                        <label className="font-semibold">Output</label>
                         <textarea
                            value={result?.output || ''}
                            readOnly
                            placeholder={isExecuting ? "Executing..." : "Output will appear here..."}
                            className="w-full h-32 p-2 mt-1 border border-gray-300 dark:border-zinc-600 rounded-md bg-gray-50 dark:bg-zinc-900/50 text-sm"
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                     <button onClick={handleExecute} disabled={isExecuting || !input} className="py-2 px-4 text-sm font-medium rounded-lg transition-all bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isExecuting ? 'Executing...' : '▶️ Execute Step'}
                    </button>
                    {result && (
                        <div className="flex space-x-4 text-sm">
                            <span className={`px-2 py-1 rounded-full ${result.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                {result.status}
                            </span>
                             {result.latency !== undefined && <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-zinc-700">{result.latency.toFixed(2)}s</span>}
                        </div>
                    )}
                </div>
                 {result?.error && <p className="text-red-500 text-sm mt-2">{result.error}</p>}
            </div>
            {!isLast && <div className="flex justify-center my-4"><ArrowDown className="text-gray-400 dark:text-zinc-500"/></div>}
        </div>
    );
};

const PipelineTab: React.FC = () => {
    const {
        selectedAgentIds,
        agentsConfig,
        apiKeys,
        parsedText,
        pipelineResults,
        updateSinglePipelineResult,
        clearPipelineResults
    } = useContext(AppContext);

    const [isAllExecuting, setIsAllExecuting] = useState(false);

    useEffect(() => {
        // When selected agents change, clear old results
        clearPipelineResults();
        const initialResults: PipelineResult[] = selectedAgentIds.map((id, index) => {
            const agent = agentsConfig.agents.find(a => a.id === id)!;
            return {
                step: index + 1,
                agent_id: id,
                agent_name: agent.name,
                input: '',
                output: '',
                timestamp: 0,
                status: 'pending'
            };
        });
        initialResults.forEach(updateSinglePipelineResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAgentIds, agentsConfig]);

    const executeStep = async (agentId: string) => {
        const agent = agentsConfig.agents.find(a => a.id === agentId);
        const result = pipelineResults.find(r => r.agent_id === agentId);

        if (!agent || !result) return;
        
        const prevResult = result.step > 1 ? pipelineResults.find(r => r.step === result.step - 1) : null;
        const input = result.step === 1 ? parsedText : (prevResult?.output || '');

        if (!input) {
            updateSinglePipelineResult({ ...result, status: 'error', error: 'Input is empty.' });
            return;
        }

        try {
            const { output, latency, provider } = await runAgent(agent, input, apiKeys);
            updateSinglePipelineResult({
                ...result,
                input,
                output,
                latency,
                provider,
                timestamp: Date.now(),
                status: 'completed'
            });
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            updateSinglePipelineResult({ ...result, input, status: 'error', error: errorMsg, timestamp: Date.now() });
            throw e; // re-throw to stop sequence execution
        }
    };
    
    const executeAll = async () => {
        setIsAllExecuting(true);
        for (const agentId of selectedAgentIds) {
            try {
                await executeStep(agentId);
            } catch (e) {
                console.error(`Execution stopped at agent ${agentId}`, e);
                break; // Stop if any step fails
            }
        }
        setIsAllExecuting(false);
    };


    if (selectedAgentIds.length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md"><p>Please select agents in the 'Agent Configuration' tab first.</p></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold">Execution Pipeline</h2>
                 <button onClick={executeAll} disabled={isAllExecuting} className="py-2 px-6 text-sm font-bold rounded-lg transition-all bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400">
                     {isAllExecuting ? 'Executing...' : '🚀 Execute All'}
                 </button>
            </div>
            {selectedAgentIds.map((id, index) => (
                <PipelineStep
                    key={id}
                    agentId={id}
                    step={index + 1}
                    isLast={index === selectedAgentIds.length - 1}
                    onExecute={() => executeStep(id)}
                />
            ))}
        </div>
    );
};

export default PipelineTab;
