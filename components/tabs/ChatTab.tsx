
import React, { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../../AppContext';
import { getOpenAIChatCompletion } from '../../services/llmService';
import type { ChatMessage } from '../../types';
import { Send, User, Bot, Loader } from 'lucide-react';
import { ANIMAL_THEMES } from '../../constants';


const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const { themeStyle } = useContext(AppContext);
    const theme = ANIMAL_THEMES[themeStyle] || ANIMAL_THEMES['Ferrari'];
    const isUser = message.role === 'user';
    
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
             {!isUser && (
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: theme.primary }}>
                    <Bot size={20} />
                </div>
            )}
            <div
                className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${
                    isUser
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-gray-100 dark:bg-zinc-700 rounded-bl-none'
                }`}
            >
                <p className="text-sm break-words">{message.content}</p>
            </div>
            {isUser && (
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-zinc-600">
                    <User size={20} />
                </div>
            )}
        </div>
    );
};

const ChatTab: React.FC = () => {
    const { apiKeys } = useContext(AppContext);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: input };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            if (!apiKeys.openai) {
                throw new Error("OpenAI API Key is not set. Please add it in the settings sidebar.");
            }
            const assistantResponse = await getOpenAIChatCompletion(newMessages, apiKeys.openai);
            setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            setError(errorMessage);
             setMessages(prev => [...prev.slice(0, -1)]); // remove user message if api call fails
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto bg-white dark:bg-zinc-800/50 rounded-lg shadow-md border border-gray-200 dark:border-zinc-700">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p>Start a new chat with OpenAI.</p>
                        <p className="text-xs mt-2">Make sure your OpenAI API key is set in the sidebar.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
                {isLoading && (
                     <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-white bg-gray-400">
                            <Loader size={20} className="animate-spin" />
                        </div>
                        <div className="max-w-md px-4 py-3 rounded-2xl bg-gray-100 dark:bg-zinc-700 rounded-bl-none">
                            <p className="text-sm italic">Thinking...</p>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
             {error && (
                <div className="p-4 border-t border-gray-200 dark:border-zinc-700 text-red-500 text-sm">
                    Error: {error}
                </div>
            )}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 p-2 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatTab;

