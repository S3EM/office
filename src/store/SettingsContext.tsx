import React, { createContext, useContext, useEffect, useState } from 'react';

interface Settings {
  geminiApiKey: string;
  appsScriptUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: '',
    appsScriptUrl: '',
  });

  useEffect(() => {
    const savedApiKey = localStorage.getItem('deputy_gemini_key') || '';
    const savedUrl = localStorage.getItem('deputy_apps_script_url') || '';
    
    setSettings({
      geminiApiKey: savedApiKey,
      appsScriptUrl: savedUrl,
    });
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      if (newSettings.geminiApiKey !== undefined) {
        localStorage.setItem('deputy_gemini_key', newSettings.geminiApiKey);
      }
      if (newSettings.appsScriptUrl !== undefined) {
        localStorage.setItem('deputy_apps_script_url', newSettings.appsScriptUrl);
      }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
