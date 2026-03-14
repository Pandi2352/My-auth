import { useState, useEffect } from 'react';
import api from '@/lib/api/client';
import { SETTINGS } from '@/lib/api/endpoints';

interface AppSettings {
  siteName: string;
  logoUrl: string;
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
    return { siteName: 'Admin', logoUrl: '' };
  });

  useEffect(() => {
    // Skip fetch if memory cache is fresh
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL) return;

    api.get(SETTINGS.LIST)
      .then((res) => {
        const list = Array.isArray(res.data.data) ? res.data.data : [];
        const map: Record<string, any> = list.reduce((m: any, s: any) => ({ ...m, [s.key]: s.value }), {});
        const data: AppSettings = {
          siteName: map['app.site_name'] || 'Admin',
          logoUrl: map['app.logo_url'] || '',
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
