// src/app/page.tsx

'use client';

import { useProjectStore } from '@/store/useProjectStore';
import { SettingsPanel } from '@/components/SettingsPanel';
import { FoodGenerator } from '@/components/FoodGenerator';
import { StoryboardEditor } from '@/components/StoryboardEditor';
import { VideoRenderer } from '@/components/VideoRenderer';

export default function HomePage() {
  const { project, error, reset } = useProjectStore();

  const hasAllAssets =
    project &&
    project.scenes.length > 0 &&
    project.scenes.every((s) => s.imageUrl && s.ttsUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍳</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                레시피 숏폼 메이커
              </h1>
              <p className="text-sm text-gray-500">
                AI가 만드는 요리 숏폼 영상
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            🔄 처음부터 다시
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            ⚠️ {error}
          </div>
        )}

        <SettingsPanel />
        <FoodGenerator />
        <StoryboardEditor />

        {/* 모든 에셋 준비되면 영상 렌더러 표시 */}
        {hasAllAssets && <VideoRenderer />}
      </main>
    </div>
  );
}