
import React, { useState, useContext, useCallback } from 'react';
import { AppContext } from '../../AppContext';
import { Upload, FileText, Type } from 'lucide-react';
import { parsePdfToText, parsePdfWithLLM, parsePlainText } from '../../services/parsingService';

const UploadTab: React.FC = () => {
    const { parsedText, setParsedText, apiKeys } = useContext(AppContext);
    const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
    const [ocrMethod, setOcrMethod] = useState<'standard' | 'advanced'>('standard');
    const [ocrProvider, setOcrProvider] = useState<'gemini' | 'openai'>('gemini');
    const [ocrModel, setOcrModel] = useState({ gemini: 'gemini-2.5-flash', openai: 'gpt-4o' });
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsLoading(true);
        setError('');
        setProgress(0);
        setProgressText('Starting processing...');
        
        const parsedChunks: string[] = [];

        try {
            // FIX: Use a standard for-loop to iterate through the FileList to ensure proper typing.
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type === 'application/pdf') {
                    if (ocrMethod === 'advanced') {
                        const modelToUse = ocrProvider === 'gemini' ? ocrModel.gemini : ocrModel.openai;
                        parsedChunks.push(await parsePdfWithLLM(file, ocrProvider, modelToUse, apiKeys, (p, t) => {
                            setProgress(p);
                            setProgressText(t);
                        }));
                    } else {
                        setProgressText(`Parsing ${file.name} with standard method...`);
                        parsedChunks.push(await parsePdfToText(file));
                        setProgress(1);
                    }
                } else {
                    setProgressText(`Parsing ${file.name}...`);
                    parsedChunks.push(await parsePlainText(file));
                    setProgress(1);
                }
            }
            setParsedText(parsedChunks.join('\n\n---\nFile Separator\n---\n\n'));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setError(`Failed to process files: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setProgress(0);
            setProgressText('');
        }
    };

    const estimateTokens = useCallback((text: string) => Math.max(1, Math.round(text.length / 4)), []);
    
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold mb-4">OCR & Parsing Settings</h2>
                <div className="space-y-4">
                    <p className="text-sm font-medium">PDF OCR Method</p>
                    <div className="flex space-x-4">
                       <button onClick={() => setOcrMethod('standard')} className={`flex-1 py-2 px-4 rounded-md text-sm border ${ocrMethod === 'standard' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent dark:border-zinc-600'}`}>Standard (Fast)</button>
                       <button onClick={() => setOcrMethod('advanced')} className={`flex-1 py-2 px-4 rounded-md text-sm border ${ocrMethod === 'advanced' ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent dark:border-zinc-600'}`}>Advanced (LLM)</button>
                    </div>
                     {ocrMethod === 'advanced' && (
                        <div className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-md space-y-2">
                           <p className="text-xs text-yellow-600 dark:text-yellow-400">Advanced OCR uses vision models and requires API credits. It is slower but better for scanned or complex PDFs.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">LLM Provider</label>
                                    <select value={ocrProvider} onChange={(e) => setOcrProvider(e.target.value as 'gemini' | 'openai')} className="w-full mt-1 p-2 bg-white dark:bg-zinc-600 border border-gray-300 dark:border-zinc-500 rounded-md text-sm">
                                        <option value="gemini">Gemini</option>
                                        <option value="openai">OpenAI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Vision Model Name</label>
                                    <input type="text" value={ocrProvider === 'gemini' ? ocrModel.gemini : ocrModel.openai} onChange={(e) => setOcrModel(prev => ({ ...prev, [ocrProvider]: e.target.value }))} className="w-full mt-1 p-2 bg-white dark:bg-zinc-600 border border-gray-300 dark:border-zinc-500 rounded-md text-sm"/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                 <div className="flex space-x-4 mb-4 border-b dark:border-zinc-700">
                    <button onClick={() => setInputMethod('upload')} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 ${inputMethod === 'upload' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><FileText size={16}/><span>Upload Files</span></button>
                    <button onClick={() => setInputMethod('paste')} className={`flex items-center space-x-2 py-2 px-4 text-sm font-medium border-b-2 ${inputMethod === 'paste' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><Type size={16}/><span>Paste Text</span></button>
                </div>
                
                {inputMethod === 'upload' ? (
                    <div>
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-zinc-700 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg p-10 text-center hover:border-blue-400 dark:hover:border-blue-500 transition">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
                                    Click to upload or drag and drop
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, TXT, MD files</p>
                            </div>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} multiple disabled={isLoading}/>
                        </label>
                    </div>
                ) : (
                    <textarea 
                        className="w-full h-48 p-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700"
                        placeholder="Paste your text here..."
                        value={parsedText}
                        onChange={(e) => setParsedText(e.target.value)}
                    />
                )}
                
                {isLoading && (
                    <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                        </div>
                        <p className="text-sm text-center mt-2 text-gray-600 dark:text-gray-300">{progressText}</p>
                    </div>
                )}
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>

            {parsedText && (
                <div className="p-6 bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
                    <h3 className="font-bold mb-2">Preview Parsed Text</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated Tokens: {estimateTokens(parsedText)}</p>
                    <textarea 
                        className="w-full h-48 p-2 border border-gray-300 dark:border-zinc-600 rounded-md bg-gray-50 dark:bg-zinc-900"
                        value={parsedText.substring(0, 5000) + (parsedText.length > 5000 ? '...' : '')}
                        readOnly
                    />
                </div>
            )}
        </div>
    );
};

export default UploadTab;