import { useEffect } from 'react';
import { useAppSettings } from './useAppSettings';

export function useDocumentTitle(title: string) {
  const { siteName } = useAppSettings();

  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${siteName}` : siteName;
    return () => { document.title = prev; };
  }, [title, siteName]);
}
