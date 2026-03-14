import { useState, useEffect } from 'react';
import { Button } from './Button';
import api from '@/lib/api/client';
import { SOCIAL } from '@/lib/api/endpoints';

interface EnabledProvider {
  _id: string;
  provider: string;
  display_name: string;
  icon_url?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const PROVIDER_COLORS: Record<string, string> = {
  google: 'hover:bg-red-50 hover:border-red-200 hover:text-red-700',
  github: 'hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
  microsoft: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700',
  facebook: 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700',
  apple: 'hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900',
  twitter: 'hover:bg-sky-50 hover:border-sky-200 hover:text-sky-700',
  linkedin: 'hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800',
};

export function SocialLoginButtons() {
  const [providers, setProviders] = useState<EnabledProvider[]>([]);

  useEffect(() => {
    api
      .get(SOCIAL.PROVIDERS)
      .then((res) => {
        const data = res.data.data;
        setProviders(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  if (providers.length === 0) return null;

  const handleSocialLogin = (provider: string) => {
    // Redirect to backend OAuth initiation endpoint
    window.location.href = `${API_BASE}/auth/social/${provider}`;
  };

  const cols = providers.length >= 3 ? 'grid-cols-3' : providers.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500 dark:bg-background dark:text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className={`mt-6 grid ${cols} gap-3`}>
        {providers.map((p) => (
          <Button
            key={p._id}
            type="button"
            variant="outline"
            className={`w-full py-2 gap-2 transition-colors ${PROVIDER_COLORS[p.provider] || ''}`}
            onClick={() => handleSocialLogin(p.provider)}
          >
            {p.icon_url ? (
              <img src={p.icon_url} alt="" className="h-4 w-4" />
            ) : (
              <ProviderIcon provider={p.provider} />
            )}
            {p.display_name}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  // Simple SVG icons for common providers
  const size = 'h-4 w-4';

  switch (provider) {
    case 'github':
      return (
        <svg className={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
    case 'google':
      return (
        <svg className={size} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 'microsoft':
      return (
        <svg className={size} viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z" />
          <path fill="#00A4EF" d="M1 13h10v10H1z" />
          <path fill="#7FBA00" d="M13 1h10v10H13z" />
          <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
      );
    default:
      return <span className="h-4 w-4 rounded-full bg-primary/20 inline-block" />;
  }
}
