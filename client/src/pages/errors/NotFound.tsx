import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center bg-white">
      <div className="relative mb-8">
        <div className="text-[120px] font-black leading-none tracking-tighter text-slate-100 select-none">
          404
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <FileQuestion className="h-16 w-16 text-slate-900" strokeWidth={1} />
        </div>
      </div>
      
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          Route Not Found
        </h1>
        <p className="text-[13px] font-medium leading-relaxed text-slate-500 uppercase tracking-wide">
          The requested engineering asset is missing or has been relocated within the architecture.
        </p>
      </div>

      <div className="mt-10 flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="h-10 px-6 border-slate-200 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
        >
          &larr; Return
        </Button>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="h-10 px-6 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
        >
          Command Center
        </Button>
      </div>
      
      <div className="mt-16 text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
        Status 404 &bull; Resource Missing
      </div>
    </div>
  );
}
