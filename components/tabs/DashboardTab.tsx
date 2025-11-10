
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Line } from 'recharts';

const KPICard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border-l-4" style={{borderColor: color}}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="text-2xl font-bold mt-1" style={{color: color}}>{value}</p>
    </div>
);

const AgentNetworkGraph: React.FC = () => {
    const { pipelineResults } = useContext(AppContext);

    if (!pipelineResults || pipelineResults.length === 0) return null;

    return (
        <div className="flex items-center justify-center space-x-2 md:space-x-4 p-4 overflow-x-auto">
            {pipelineResults.map((result, index) => (
                <React.Fragment key={result.agent_id}>
                    <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-xs p-2 shadow-lg">
                           {result.agent_name}
                        </div>
                         <span className={`mt-2 text-xs px-2 py-1 rounded-full ${result.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : (result.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300')}`}>
                           {result.status}
                        </span>
                    </div>
                    {index < pipelineResults.length - 1 && (
                        <div className="flex-1 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full min-w-[20px] md:min-w-[50px]"></div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};


const DashboardTab: React.FC = () => {
    const { parsedText, pipelineResults, selectedAgentIds, themeMode } = useContext(AppContext);

    const estimateTokens = (text: string) => Math.max(1, Math.round((text || '').length / 4));

    const completedResults = useMemo(() => pipelineResults.filter(r => r.status === 'completed'), [pipelineResults]);

    const kpiData = useMemo(() => {
        const inputTokens = estimateTokens(parsedText);
        const outputTokens = completedResults.reduce((sum, r) => sum + estimateTokens(r.output), 0);
        const completionRate = selectedAgentIds.length > 0 ? (completedResults.length / selectedAgentIds.length) * 100 : 0;
        const totalLatency = completedResults.reduce((sum, r) => sum + (r.latency || 0), 0);
        return { inputTokens, outputTokens, completionRate, totalLatency };
    }, [parsedText, completedResults, selectedAgentIds]);
    
    const performanceData = useMemo(() => 
        completedResults.map(r => ({
            name: r.agent_name,
            input: estimateTokens(r.input),
            output: estimateTokens(r.output),
        })),
    [completedResults]);

    const latencyData = useMemo(() => {
        const dataByProvider: { [key: string]: number } = {};
        completedResults.forEach(r => {
            if (r.provider && r.latency) {
                dataByProvider[r.provider] = (dataByProvider[r.provider] || 0) + r.latency;
            }
        });
        return Object.entries(dataByProvider).map(([name, value]) => ({ name, value }));
    }, [completedResults]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (selectedAgentIds.length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md"><p>No agents selected. Please configure a pipeline first.</p></div>;
    }
    
    if (pipelineResults.filter(r => r.status !== 'pending').length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md"><p>Execute agents in the pipeline to see dashboard metrics.</p></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Input Tokens" value={kpiData.inputTokens} color="#3b82f6" />
                <KPICard title="Output Tokens" value={kpiData.outputTokens} color="#22c55e" />
                <KPICard title="Completion Rate" value={`${kpiData.completionRate.toFixed(0)}%`} color="#f97316" />
                <KPICard title="Total Latency" value={`${kpiData.totalLatency.toFixed(1)}s`} color="#a855f7" />
            </div>

            <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md">
                <h3 className="font-bold mb-4">Pipeline Flow</h3>
                <AgentNetworkGraph />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md">
                    <h3 className="font-bold mb-4">Agent Performance (Tokens)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
                            <XAxis dataKey="name" stroke={themeMode === 'dark' ? '#a1a1aa' : '#6b7280'} fontSize={12} />
                            <YAxis stroke={themeMode === 'dark' ? '#a1a1aa' : '#6b7280'} fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: themeMode === 'dark' ? '#27272a' : '#fff', border: `1px solid ${themeMode === 'dark' ? '#52525b' : '#e5e7eb'}` }} />
                            <Legend />
                            <Bar dataKey="input" fill="#8884d8" name="Input Tokens" />
                            <Bar dataKey="output" fill="#82ca9d" name="Output Tokens" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="p-4 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md">
                    <h3 className="font-bold mb-4">Latency by Provider</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={latencyData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {latencyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: themeMode === 'dark' ? '#27272a' : '#fff', border: `1px solid ${themeMode === 'dark' ? '#52525b' : '#e5e7eb'}` }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
