import { useEffect } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';

export function CustomCSSInjector() {
  const { customCss } = useAppSettings();

  useEffect(() => {
    if (!customCss) {
      const existing = document.getElementById('app-custom-css');
      if (existing) existing.remove();
      return;
    }

    let styleTag = document.getElementById('app-custom-css') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'app-custom-css';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = customCss;
  }, [customCss]);

  return null;
}
