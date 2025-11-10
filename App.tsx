
import React, { useState, useMemo, useCallback } from 'react';
import { AppContext, AppProvider } from './AppContext';
import Sidebar from './components/Sidebar';
import UploadTab from './components/tabs/UploadTab';
import AgentConfigTab from './components/tabs/AgentConfigTab';
import PipelineTab from './components/tabs/PipelineTab';
import DashboardTab from './components/tabs/DashboardTab';
import ReportsTab from './components/tabs/ReportsTab';
import ChatTab from './components/tabs/ChatTab';
import { FileText, Settings, Play, LayoutDashboard, Download, MessageSquare } from 'lucide-react';
import { ANIMAL_THEMES } from './constants';
import type { Tab } from './types';


const TABS: Tab[] = [
  { id: 'upload', label: 'Upload & Parse', icon: FileText },
  { id: 'config', label: 'Agent Configuration', icon: Settings },
  { id: 'pipeline', label: 'Agent Pipeline', icon: Play },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reports', label: 'Reports', icon: Download },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
];


const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'upload':
        return <UploadTab />;
      case 'config':
        return <AgentConfigTab />;
      case 'pipeline':
        return <PipelineTab />;
      case 'dashboard':
        return <DashboardTab />;
      case 'reports':
        return <ReportsTab />;
      case 'chat':
        return <ChatTab />;
      default:
        return <UploadTab />;
    }
  }, [activeTab]);

  return (
     <AppContext.Consumer>
      {({ themeStyle, themeMode }) => {
        const theme = ANIMAL_THEMES[themeStyle] || ANIMAL_THEMES['Ferrari'];
        const primaryColor = theme.primary;
        
        return (
          <div className={`${themeMode} font-['Roboto',_sans-serif] flex h-screen bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200`}>
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
              <header className="bg-white dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-700 p-4 shadow-sm">
                 <h1 className="text-xl md:text-2xl font-bold text-center" style={{ color: primaryColor }}>
                  {theme.emoji} AI Agent Pipeline
                </h1>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  A YAML-driven multi-agent pipeline with an interactive dashboard
                </p>
              </header>
              
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex justify-center space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto pb-2">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center space-x-2 px-3 py-2 text-sm sm:text-base font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800`}
                      style={{
                        backgroundColor: activeTab === tab.id ? primaryColor : 'transparent',
                        color: activeTab === tab.id ? 'white' : (themeMode === 'dark' ? '#E0E0E0' : '#212121'),
                        borderColor: primaryColor,
                        borderWidth: activeTab !== tab.id ? '1px' : '1px',
                        boxShadow: activeTab === tab.id ? `0 0 10px ${primaryColor}` : 'none'
                      }}
                    >
                      <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {renderTabContent()}
              </div>
            </main>
          </div>
        );
      }}
    </AppContext.Consumer>
  );
};


const App: React.FC = () => (
  <AppProvider>
    <AppContent />
  </AppProvider>
);

export default App;
