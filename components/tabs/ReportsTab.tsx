
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { Download } from 'lucide-react';

const ReportsTab: React.FC = () => {
    const { pipelineResults } = useContext(AppContext);

    const completedResults = useMemo(() => pipelineResults.filter(r => r.status === 'completed'), [pipelineResults]);

    const generateMarkdownReport = () => {
        let report = `# AI Agent Pipeline Report\n\n**Generated:** ${new Date().toISOString()}\n\n---\n\n`;
        completedResults.forEach(result => {
            report += `## Step ${result.step}: ${result.agent_name}\n\n`;
            report += `**Agent ID:** \`${result.agent_id}\`\n`;
            report += `**Timestamp:** ${new Date(result.timestamp).toLocaleString()}\n`;
            report += `**Latency:** ${result.latency?.toFixed(2)}s\n\n`;
            report += `### Output\n\n\`\`\`\n${result.output}\n\`\`\`\n\n---\n\n`;
        });
        return report;
    };

    const generateJsonReport = () => {
        return JSON.stringify({
            reportGenerated: new Date().toISOString(),
            results: completedResults
        }, null, 2);
    };

    const generateCsvReport = () => {
        if (completedResults.length === 0) return "";
        
        const headers = Object.keys(completedResults[0]).join(',');
        const rows = completedResults.map(row => {
            return Object.values(row).map(value => {
                const strValue = String(value).replace(/"/g, '""');
                return `"${strValue}"`;
            }).join(',');
        });
        
        return [headers, ...rows].join('\n');
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (completedResults.length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md"><p>No completed pipeline results to report. Please execute the pipeline first.</p></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold mb-4">Download Reports</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => downloadFile(generateMarkdownReport(), 'report.md', 'text/markdown')} className="flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        <Download size={20} /><span>Markdown Report</span>
                    </button>
                    <button onClick={() => downloadFile(generateJsonReport(), 'report.json', 'application/json')} className="flex items-center justify-center space-x-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                        <Download size={20} /><span>JSON Report</span>
                    </button>
                    <button onClick={() => downloadFile(generateCsvReport(), 'report.csv', 'text/csv')} className="flex items-center justify-center space-x-2 p-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
                        <Download size={20} /><span>CSV Report</span>
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold mb-4">Report Preview</h2>
                <pre className="p-4 bg-gray-100 dark:bg-zinc-900 rounded-md max-h-96 overflow-auto text-sm">
                    <code>
                        {generateMarkdownReport()}
                    </code>
                </pre>
            </div>
        </div>
    );
};

export default ReportsTab;
