import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsent } from './components/ui/CookieConsent';
import { SidebarProvider } from './contexts/SidebarContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SidebarProvider>
          <Toaster position="top-right" richColors />
          <App />
          <CookieConsent />
        </SidebarProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
