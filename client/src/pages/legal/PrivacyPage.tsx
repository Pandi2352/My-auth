import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-8 sm:p-20 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Shield className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Privacy Policy</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Last updated: April 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-[13px] leading-relaxed text-slate-600 space-y-6">
          <p>
            This surgical Privacy Policy describes how your information is architected, stored, and protected within our modular ecosystem.
          </p>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">1. Data Architecture</h2>
            <p>
              We collect minimal engineering telemetry required for authentication and audit auditability. Your data is sharded across our MongoDB clusters with industry-standard encryption.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">2. Security Modules</h2>
            <p>
              Our security perimeter is built using NestJS guards and JWT-based rotational token management. We do not sell your telemetry to third-party data aggregators.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">3. Rights of Access</h2>
            <p>
              You have the right to request a full dump of your metadata or an immediate hard-delete from all production nodes.
            </p>
          </section>
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Platform Engineering Team</p>
           <Button variant="outline" onClick={() => navigate(-1)} className="text-[11px] font-black uppercase tracking-widest px-6">&larr; Return</Button>
        </div>
      </div>
    </div>
  );
}
