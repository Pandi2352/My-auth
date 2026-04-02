import { useState, useEffect } from 'react';
import api from '@/lib/api/client';
import { SETTINGS } from '@/lib/api/endpoints';

interface AppSettings {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  customCss: string;
}

const CACHE_KEY = 'app_settings_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let memoryCache: { data: AppSettings; timestamp: number } | null = null;

export function useAppSettings(): AppSettings {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Check memory cache first
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) {
      return memoryCache.data;
    }
    // Then localStorage cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          memoryCache = parsed;
          return parsed.data;
        }
      }
    } catch {}
    return { 
      siteName: 'Admin', 
      logoUrl: '', 
      faviconUrl: '',
      primaryColor: '#0f172a',
      accentColor: '#6366f1',
      customCss: '' 
    };
  });

  useEffect(() => {
    // Skip fetch if memory cache is fresh
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) return;

    api.get(SETTINGS.PUBLIC_CONFIG)
      .then((res) => {
        const data: AppSettings = {
          siteName: res.data.site_name || 'Admin',
          logoUrl: res.data.logo_url || '',
          faviconUrl: res.data.favicon_url || '',
          primaryColor: res.data.primary_color || '#0f172a',
          accentColor: res.data.accent_color || '#6366f1',
          customCss: res.data.custom_css || '',
        };
        setSettings(data);
        const cache = { data, timestamp: Date.now() };
        memoryCache = cache;
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      })
      .catch(() => {});
  }, []);

  return settings;
}
