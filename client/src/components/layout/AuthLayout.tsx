import type { ReactNode } from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Hexagon } from 'lucide-react';

import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { siteName, logoUrl } = useAppSettings();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center text-white">
              <Hexagon className="h-6 w-6" />
            </div>
          )}
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground tracking-tight">
          {siteName}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-card py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100 dark:border-border">
          {children}
        </div>
        
        <footer className="mt-8 flex justify-center items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <Link to="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
           <span className="text-slate-200">&bull;</span>
           <Link to="/terms" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
        </footer>
      </div>
    </div>
  );
}
