import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'cookie_consent';

type ConsentStatus = 'accepted' | 'declined' | null;

function getStoredConsent(): ConsentStatus {
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === 'accepted' || val === 'declined') return val;
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show banner only if user hasn't made a choice yet
    if (!getStoredConsent()) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-4xl px-4 pb-4">
        <div className="rounded-xl border border-border bg-background p-4 shadow-lg sm:flex sm:items-center sm:gap-4">
          <div className="flex items-start gap-3 sm:flex-1">
            <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-sm text-muted-foreground">
              <p>
                We use cookies and local storage to enhance your experience,
                keep you logged in, and remember your preferences. By
                continuing, you agree to our use of these technologies.
              </p>
            </div>
            <button
              onClick={handleDecline}
              className="shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2 sm:mt-0 sm:shrink-0">
            <Button variant="ghost" size="sm" onClick={handleDecline}>
              Decline
            </Button>
            <Button size="sm" onClick={handleAccept}>
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
