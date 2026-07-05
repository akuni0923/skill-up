// src/components/AssetGenerator.tsx

'use client';

import { useProjectStore } from '@/store/useProjectStore';

export function AssetGenerator() {
  const { project, generateAssets, isLoading, settings } = useProjectStore();

  if (!project || project.scenes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🎨 이미지 & 음성 생성
      </h2>

      {/* 생성 전 미리보기 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {project.scenes.map((scene) => (
          <div key={scene.id} className="p-3 bg-gray-50 rounded-xl border">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {scene.order}
              </span>
              <span className="text-sm font-medium text-gray-700 truncate">{scene.subtitle}</span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-2">{scene.narration}</p>
          </div>
        ))}
      </div>

      {/* 설정 요약 */}
      <div className="p-4 bg-blue-50 rounded-xl mb-6">
        <div className="text-sm text-blue-700 space-y-1">
          <div>🎙️ 목소리: {settings.ttsVoice} / {settings.ttsTone} / {settings.ttsSpeed}x</div>
          <div>🖼️ 이미지 {project.scenes.length}장 + 음성 {project.scenes.length}개 생성 예정</div>
        </div>
      </div>

      <button
        onClick={generateAssets}
        disabled={isLoading}
        className="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 
                   hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl 
                   text-lg font-semibold shadow-lg transition-all
                   disabled:opacity-50"
      >
        {isLoading ? '🎨 생성 중...' : '🎨 이미지 & 음성 한번에 생성하기'}
      </button>
    </div>
  );
}