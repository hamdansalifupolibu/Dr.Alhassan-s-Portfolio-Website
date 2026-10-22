/**
 * LoadingSpinner.jsx
 * A simple centered emerald spinner for loading states.
 */

export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-16 w-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeClasses[size] ?? sizeClasses.md} animate-spin rounded-full border-slate-700 border-t-emerald-500`}
      />
      <p className="text-sm text-slate-400 animate-pulse">Loading…</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center py-20">
      {spinner}
    </div>
  );
}
