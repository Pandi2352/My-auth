import { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  bgColor: string;
  checks: { label: string; met: boolean }[];
}

function evaluateStrength(password: string): StrengthResult {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = checks.filter((c) => c.met).length;

  if (score <= 1) return { score, label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-500', checks };
  if (score === 2) return { score, label: 'Weak', color: 'text-orange-500', bgColor: 'bg-orange-500', checks };
  if (score === 3) return { score, label: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-500', checks };
  if (score === 4) return { score, label: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-500', checks };
  return { score, label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500', checks };
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => evaluateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < strength.score ? strength.bgColor : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-semibold ${strength.color}`}>{strength.label}</span>
      </div>

      {/* Criteria checklist */}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {strength.checks.map((check) => (
          <li key={check.label} className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                check.met ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <span className={check.met ? 'text-foreground' : 'text-muted-foreground'}>
              {check.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
