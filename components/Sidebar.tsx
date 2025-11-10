
import React, { useContext } from 'react';
import { AppContext } from '../AppContext';
import { ANIMAL_THEMES } from '../constants';
import { Sun, Moon, Languages, KeyRound, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

const Sidebar: React.FC = () => {
  const {
    themeMode, setThemeMode,
    themeStyle, setThemeStyle,
    language, setLanguage,
    t,
    apiKeys, setApiKeys,
    providerHealth
  } = useContext(AppContext);

  const theme = ANIMAL_THEMES[themeStyle] || ANIMAL_THEMES['Ferrari'];

  const HealthIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'OK': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <HelpCircle className="h-5 w-5 text-yellow-500" />;
    }
  };
  
  return (
    <aside className="w-64 bg-white dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 flex flex-col p-4 space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold flex items-center" style={{color: theme.primary}}>{theme.emoji} {t('settings')}</h2>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('theme')}</h3>
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label htmlFor="themeStyle" className="text-sm font-medium">{t('theme')}</label>
                <div className="flex items-center space-x-2">
                    <Sun className={`h-5 w-5 cursor-pointer ${themeMode === 'light' ? 'text-yellow-500' : 'text-gray-400'}`} onClick={() => setThemeMode('light')} />
                    <div onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')} className="relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors duration-300 bg-gray-200 dark:bg-zinc-600">
                        <span className={`inline-block w-4 h-4 transform transition-transform duration-300 bg-white rounded-full ${themeMode === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <Moon className={`h-5 w-5 cursor-pointer ${themeMode === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} onClick={() => setThemeMode('dark')} />
                </div>
            </div>
          <select
            id="themeStyle"
            value={themeStyle}
            onChange={(e) => setThemeStyle(e.target.value)}
            className="w-full p-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"
          >
            {Object.keys(ANIMAL_THEMES).map(name => (
              <option key={name} value={name}>{ANIMAL_THEMES[name].emoji} {name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center"><Languages className="h-4 w-4 mr-2"/>{t('language')}</h3>
        <div className="flex space-x-2">
            <button onClick={() => setLanguage('en')} className={`flex-1 text-sm py-1 px-2 rounded-md ${language === 'en' ? 'text-white' : ''}`} style={{backgroundColor: language === 'en' ? theme.primary : 'transparent', border: `1px solid ${theme.primary}`}}>English</button>
            <button onClick={() => setLanguage('zh')} className={`flex-1 text-sm py-1 px-2 rounded-md ${language === 'zh' ? 'text-white' : ''}`} style={{backgroundColor: language === 'zh' ? theme.primary : 'transparent', border: `1px solid ${theme.primary}`}}>中文</button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center"><KeyRound className="h-4 w-4 mr-2"/>{t('api_keys')}</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium block">Gemini API Key</label>
          <input
            type="password"
            placeholder="Enter Gemini API Key"
            value={apiKeys.gemini}
            onChange={(e) => setApiKeys(prev => ({...prev, gemini: e.target.value}))}
            className="w-full p-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium block">OpenAI API Key</label>
          <input
            type="password"
            placeholder="Enter OpenAI API Key"
            value={apiKeys.openai}
            onChange={(e) => setApiKeys(prev => ({...prev, openai: e.target.value}))}
            className="w-full p-2 bg-gray-50 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md text-sm"
          />
        </div>
      </div>

       <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider Health</h3>
        <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between">
                <span>Gemini</span>
                <div className="flex items-center space-x-2">
                  <span>{providerHealth.gemini}</span>
                  <HealthIcon status={providerHealth.gemini} />
                </div>
            </li>
            <li className="flex items-center justify-between">
                <span>OpenAI</span>
                 <div className="flex items-center space-x-2">
                  <span>{providerHealth.openai}</span>
                  <HealthIcon status={providerHealth.openai} />
                </div>
            </li>
        </ul>
      </div>

      <div className="mt-auto text-center text-xs text-gray-400 dark:text-gray-500">
        <p>AI Agent Pipeline v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
