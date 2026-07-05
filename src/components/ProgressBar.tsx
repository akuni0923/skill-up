// src/components/ProgressBar.tsx

'use client';

import { GenerationProgress } from '@/types';

export function ProgressBar({ progress }: { progress: GenerationProgress }) {
  const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-700">{progress.message}</span>
        <span className="text-sm text-blue-500">
          {progress.current}/{progress.total}
        </span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(5, percent)}%` }}
        />
      </div>
    </div>
  );
}