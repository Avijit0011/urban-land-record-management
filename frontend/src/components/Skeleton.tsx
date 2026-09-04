import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-md ${className}`} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox
        key={i}
        className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 ${className}`}>
    <div className="flex items-center justify-between">
      <SkeletonBox className="h-4 w-1/3" />
      <SkeletonBox className="h-6 w-6 rounded-full" />
    </div>
    <SkeletonBox className="h-8 w-1/2" />
    <SkeletonBox className="h-3 w-3/4" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <SkeletonBox className="h-4 w-48" />
      <SkeletonBox className="h-7 w-24 rounded-lg" />
    </div>
    <div className="space-y-3">
      <div className="flex gap-4 bg-slate-100 p-2.5 rounded-md">
        {Array.from({ length: cols }).map((_, c) => (
          <SkeletonBox key={c} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2 px-1 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonMap: React.FC = () => (
  <div className="w-full h-[calc(100vh-10rem)] bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between border-b border-slate-200 pb-3 z-10">
      <SkeletonBox className="h-5 w-40" />
      <div className="flex gap-2">
        <SkeletonBox className="h-8 w-24 rounded-md" />
        <SkeletonBox className="h-8 w-24 rounded-md" />
      </div>
    </div>
    <div className="absolute inset-0 bg-slate-100/60 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <SkeletonBox className="h-4 w-44 mx-auto" />
        <SkeletonBox className="h-3 w-64 mx-auto" />
      </div>
    </div>
    <div className="flex justify-between z-10 pt-3 border-t border-slate-200">
      <SkeletonBox className="h-4 w-32" />
      <SkeletonBox className="h-4 w-48" />
    </div>
  </div>
);
