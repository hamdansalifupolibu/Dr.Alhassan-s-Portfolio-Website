import { Loader2 } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-emerald-500">
      <Loader2 className="w-10 h-10 animate-spin" />
      <span className="text-xs font-mono text-slate-400">Loading resources…</span>
    </div>
  );
}
