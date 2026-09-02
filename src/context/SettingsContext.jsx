import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    platform_name: 'EventGen'
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/system/settings');
      if (res.success && res.settings) {
        setSettings(prev => ({
          ...prev,
          ...res.settings
        }));
        if (res.settings.platform_name) {
          document.title = `${res.settings.platform_name} — Pass & Barcode Platform`;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch system settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformName = async (newName) => {
    const cleanName = String(newName).trim() || 'EventGen';
    const res = await api.put('/system/settings', { platform_name: cleanName });
    if (res.success) {
      setSettings(prev => ({
        ...prev,
        platform_name: cleanName
      }));
      document.title = `${cleanName} — Pass & Barcode Platform`;
      return res;
    }
    throw new Error(res.message || 'Failed to update platform name');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        platformName: settings.platform_name || 'EventGen',
        settings,
        loading,
        refreshSettings: fetchSettings,
        updatePlatformName
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
