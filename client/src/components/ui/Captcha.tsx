import { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export interface CaptchaHandle {
  getToken: () => string | null;
  reset: () => void;
}

interface CaptchaProps {
  onChange?: (token: string | null) => void;
}

export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(
  ({ onChange }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      getToken: () => recaptchaRef.current?.getValue() ?? null,
      reset: () => recaptchaRef.current?.reset(),
    }));

    if (!SITE_KEY) return null;

    return (
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={SITE_KEY}
          onChange={onChange}
        />
      </div>
    );
  },
);

Captcha.displayName = 'Captcha';

export function isCaptchaEnabled(): boolean {
  return !!SITE_KEY;
}
