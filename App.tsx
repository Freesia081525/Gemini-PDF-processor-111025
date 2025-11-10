
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

import { AGENTS } from './constants';
import { performOcrOnPages, runAgent } from './services/geminiService';
import type { Agent, PageData, AnalysisResult } from './types';
import { ProcessingState } from './types';
import { FileIcon, BrainCircuitIcon, CheckCircleIcon, XCircleIcon, SparklesIcon, ChevronDownIcon, LoaderIcon } from './components/Icons';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPages, setPdfPages] = useState<PageData[]>([]);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<Set<number>>(new Set());
  const [ocrText, setOcrText] = useState<string>('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>(ProcessingState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const statusMap = {
    [ProcessingState.IDLE]: { text: 'Awaiting Document', Icon: FileIcon, color: 'text-gray-400' },
    [ProcessingState.RENDERING_PDF]: { text: 'Rendering PDF...', Icon: LoaderIcon, color: 'text-blue-400 animate-spin' },
    [ProcessingState.PERFORMING_OCR]: { text: 'Performing OCR...', Icon: LoaderIcon, color: 'text-purple-400 animate-spin' },
    [ProcessingState.ANALYZING]: { text: 'Running Agents...', Icon: BrainCircuitIcon, color: 'text-yellow-400 animate-pulse-fast' },
    [ProcessingState.COMPLETE]: { text: 'Analysis Complete', Icon: CheckCircleIcon, color: 'text-green-400' },
    [ProcessingState.ERROR]: { text: 'An Error Occurred', Icon: XCircleIcon, color: 'text-red-400' },
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPdfPages([]);
      setSelectedPageNumbers(new Set());
      setOcrText('');
      setResults([]);
      setError(null);
      setProcessingState(ProcessingState.RENDERING_PDF);

      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const typedArray = new Uint8Array(fileReader.result as ArrayBuffer);
          const pdf = await (window as any).pdfjsLib.getDocument(typedArray).promise;
          const pagesData: PageData[] = [];
          const newSelectedPages = new Set<number>();

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              pagesData.push({ pageNumber: i, imageDataUrl: canvas.toDataURL('image/png') });
              newSelectedPages.add(i);
            }
          }
          setPdfPages(pagesData);
          setSelectedPageNumbers(newSelectedPages);
          setProcessingState(ProcessingState.IDLE);
        };
        fileReader.readAsArrayBuffer(selectedFile);
      } catch (err) {
        console.error("Error processing PDF:", err);
        setError("Failed to load or render the PDF file.");
        setProcessingState(ProcessingState.ERROR);
      }
    } else {
        setError("Please upload a valid PDF file.");
    }
  }, []);
  
  const togglePageSelection = (pageNumber: number) => {
    setSelectedPageNumbers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageNumber)) {
        newSet.delete(pageNumber);
      } else {
        newSet.add(pageNumber);
      }
      return newSet;
    });
  };

  const handleOcr = async () => {
    const pagesToProcess = pdfPages.filter(p => selectedPageNumbers.has(p.pageNumber));
    if (pagesToProcess.length === 0) {
      setError("Please select at least one page for OCR.");
      return;
    }
    setError(null);
    setProcessingState(ProcessingState.PERFORMING_OCR);
    try {
      const text = await performOcrOnPages(pagesToProcess);
      setOcrText(text);
      setProcessingState(ProcessingState.IDLE);
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown OCR error occurred.";
      setError(errorMessage);
      setProcessingState(ProcessingState.ERROR);
    }
  };

  const toggleAgentSelection = (agent: Agent) => {
    setSelectedAgents(prev => 
      prev.some(a => a.name === agent.name)
        ? prev.filter(a => a.name !== agent.name)
        : [...prev, agent]
    );
  };
  
  const handleRunAnalysis = async () => {
    if (!ocrText) {
        setError("Please perform OCR on the document first.");
        return;
    }
    if (selectedAgents.length === 0) {
        setError("Please select at least one agent to run.");
        return;
    }
    setError(null);
    setProcessingState(ProcessingState.ANALYZING);
    setResults([]);

    const analysisPromises = selectedAgents.map(async (agent) => {
        const startTime = Date.now();
        let fullOutput = '';
        try {
            for await (const chunk of runAgent(agent, ocrText)) {
                fullOutput += chunk;
                // For a live streaming UI update, you'd set state here
            }
            const latency = (Date.now() - startTime) / 1000;
            return {
                agentName: agent.name,
                output: fullOutput,
                latency,
                provider: 'Gemini',
                model: agent.model
            };
        } catch (err) {
            console.error(`Error with agent ${agent.name}:`, err);
            return {
                agentName: agent.name,
                output: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
                latency: (Date.now() - startTime) / 1000,
                provider: 'System',
                model: agent.model
            };
        }
    });

    const settledResults = await Promise.all(analysisPromises);
    setResults(settledResults);
    setProcessingState(ProcessingState.COMPLETE);
  };
  
  const dashboardData = useMemo(() => {
    const latencyData = results.map(r => ({ name: r.agentName, latency: r.latency, provider: r.provider }));
    const radarData = results.map(r => ({
      subject: r.agentName,
      length: r.output.length,
      fullMark: Math.max(...results.map(res => res.output.length), 1) * 1.2,
    }));
    return { latencyData, radarData };
  }, [results]);

  const CurrentStatus = statusMap[processingState];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <BrainCircuitIcon className="h-10 w-10 text-purple-400" />
            <h1 className="text-3xl font-bold tracking-tighter text-white">Agentic Document Processor</h1>
          </div>
          <div className="flex items-center space-x-3 px-4 py-2 bg-gray-800 rounded-lg">
            <CurrentStatus.Icon className={`h-6 w-6 ${CurrentStatus.color}`} />
            <span className="font-medium">{CurrentStatus.text}</span>
          </div>
        </header>

        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">{error}</div>}

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Configuration */}
          <div className="flex flex-col space-y-8">
            {/* 1. Upload */}
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><span className="text-purple-400 mr-2">1.</span> Upload PDF</h2>
              <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-850 hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileIcon className="w-10 h-10 mb-3 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-400">{file ? <span className="font-semibold text-green-400">{file.name}</span> : 'Click to upload or drag and drop'}</p>
                          <p className="text-xs text-gray-500">PDF only</p>
                      </div>
                      <input id="dropzone-file" ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                  </label>
              </div>
            </div>

            {/* 2. Select Pages */}
            {pdfPages.length > 0 && (
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                <h2 className="text-xl font-semibold mb-4"><span className="text-purple-400 mr-2">2.</span> Select Pages for OCR ({selectedPageNumbers.size}/{pdfPages.length})</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto pr-2">
                  {pdfPages.map(page => (
                    <div key={page.pageNumber} onClick={() => togglePageSelection(page.pageNumber)} className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedPageNumbers.has(page.pageNumber) ? 'border-purple-500 ring-2 ring-purple-500' : 'border-gray-700 hover:border-purple-600'}`}>
                      <img src={page.imageDataUrl} alt={`Page ${page.pageNumber}`} className="w-full h-auto" />
                      <div className="absolute top-1 right-1 bg-gray-900/80 rounded-full h-5 w-5 flex items-center justify-center">
                        <div className={`h-3 w-3 rounded-full ${selectedPageNumbers.has(page.pageNumber) ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">{page.pageNumber}</div>
                    </div>
                  ))}
                </div>
                 <button onClick={handleOcr} disabled={processingState === ProcessingState.PERFORMING_OCR || selectedPageNumbers.size === 0} className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                   {processingState === ProcessingState.PERFORMING_OCR ? <><LoaderIcon className="animate-spin mr-2 h-5 w-5" /> Performing OCR...</> : 'Perform OCR on Selected Pages'}
                </button>
              </div>
            )}
            
            {/* 3. Select Agents */}
            {ocrText && (
               <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-semibold mb-4"><span className="text-purple-400 mr-2">3.</span> Configure Analysis</h2>
                  <div className="space-y-2">
                     <h3 className="font-semibold text-gray-300">Select Agents ({selectedAgents.length}/{AGENTS.length})</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AGENTS.map(agent => (
                        <button key={agent.name} onClick={() => toggleAgentSelection(agent)} className={`p-3 text-left rounded-lg transition-colors text-sm ${selectedAgents.some(a => a.name === agent.name) ? 'bg-purple-800/50 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
                          {agent.name} <span className="text-xs text-gray-400">({agent.model})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleRunAnalysis} disabled={processingState === ProcessingState.ANALYZING || selectedAgents.length === 0} className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center">
                      {processingState === ProcessingState.ANALYZING ? <><BrainCircuitIcon className="animate-pulse-fast mr-2 h-5 w-5" /> Analyzing...</> : <><SparklesIcon className="mr-2 h-5 w-5" /> Run Analysis</>}
                  </button>
               </div>
            )}
          </div>
          
          {/* Right Column: Results */}
          <div className="flex flex-col space-y-8">
            {ocrText && (
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4">Extracted Text (OCR)</h2>
                    <textarea readOnly value={ocrText} className="w-full h-48 bg-gray-850 p-3 rounded-lg text-gray-300 text-sm border border-gray-700 focus:ring-purple-500 focus:border-purple-500" />
                </div>
            )}

            {results.length > 0 && (
              <>
                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-semibold mb-4">Agent Outputs</h2>
                  <div className="space-y-4">
                    {results.map(result => (
                      <div key={result.agentName} className="bg-gray-850 p-4 rounded-lg border border-gray-700">
                        <h3 className="font-bold text-purple-400">{result.agentName}</h3>
                        <p className="text-xs text-gray-400 mb-2">Model: {result.model} | Latency: {result.latency.toFixed(2)}s</p>
                        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-gray-300">{result.output}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-semibold mb-4">Analysis Dashboard</h2>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-80">
                      <div>
                        <h3 className="text-center font-semibold mb-2">Agent Latency (seconds)</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.latencyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" tick={{ fill: '#A0AEC0', fontSize: 10 }} />
                            <YAxis tick={{ fill: '#A0AEC0', fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748' }} />
                            <Legend wrapperStyle={{fontSize: "12px"}}/>
                            <Bar dataKey="latency" fill="#8B5CF6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                          <h3 className="text-center font-semibold mb-2">Output Verbosity (character count)</h3>
                          <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dashboardData.radarData}>
                              <PolarGrid stroke="#4A5568"/>
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#A0AEC0', fontSize: 10 }}/>
                              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={{ fill: 'transparent' }}/>
                              <Radar name="Length" dataKey="length" stroke="#34D399" fill="#34D399" fillOpacity={0.6} />
                              <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748' }}/>
                          </RadarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
                </div>
              </>
            )}

            {!file && (
                <div className="flex flex-col items-center justify-center text-center p-10 bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-800 h-full">
                    <SparklesIcon className="w-16 h-16 text-gray-600 mb-4 animate-bounce-slow" />
                    <h3 className="text-xl font-bold text-gray-400">Your Document Analysis Awaits</h3>
                    <p className="text-gray-500 mt-2">Upload a PDF to begin the process. The AI agents are ready to assist.</p>
                </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
