import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Scale } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-8 sm:p-20 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <Scale className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Terms of Service</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Effective: April 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-[13px] leading-relaxed text-slate-600 space-y-6">
          <p>
             By accessing these engineering assets, you agree to abide by our system-level operational standards. Failure to comply can result in immediate token revocation.
          </p>

          <section className="space-y-3">
             <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">1. Proper Operations</h2>
             <p>
                Authorized personnel are granted a non-exclusive, non-transferable right to access the Dashboard modules and visualization assets through the provided authentication endpoints. 
             </p>
          </section>

          <section className="space-y-3">
             <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">2. Prohibited Telemetry</h2>
             <p>
                Injecting corrupt payloads, attempting database overflows, or bypassing RBAC guards through undocumented session routes is strictly prohibited.
             </p>
          </section>

          <section className="space-y-3">
             <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">3. Termination Policy</h2>
             <p>
                We reserve the surgical right to terminate access to the Command Center at any time if operational integrity is compromised or if security markers are triggered.
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
