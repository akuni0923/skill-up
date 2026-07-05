// src/components/SceneEditor.tsx

'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Scene } from '@/types';

export function SceneEditor() {
  const {
    project,
    updateScene,
    addScene,
    removeScene,
    regenerateSceneImage,
    regenerateSceneTTS,
  } = useProjectStore();

  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  if (!project) return null;

  const playAudio = (sceneId: string, audioUrl: string) => {
    const audio = new Audio(audioUrl);
    setPlayingAudio(sceneId);
    audio.play();
    audio.onended = () => setPlayingAudio(null);
  };

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          ✏️ 씬 편집
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            총 {project.scenes.length}씬 · 약 {totalDuration}초
          </span>
          <button
            onClick={addScene}
            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600"
          >
            + 씬 추가
          </button>
        </div>
      </div>

      {/* 타임라인 미리보기 */}
      <div className="flex gap-1 mb-6 p-3 bg-gray-50 rounded-xl overflow-x-auto">
        {project.scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={() => setActiveScene(activeScene === scene.id ? null : scene.id)}
            className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all
              ${activeScene === scene.id ? 'ring-2 ring-orange-500 scale-105' : 'hover:scale-102'}
            `}
            style={{ width: `${Math.max(60, scene.duration * 20)}px`, height: '80px' }}
          >
            {scene.imageUrl ? (
              <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                ?
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5">
              <span className="text-white text-[10px] font-bold">{scene.order}</span>
            </div>
          </button>
        ))}
      </div>

      {/* 씬 카드 목록 */}
      <div className="space-y-4">
        {project.scenes.map((scene) => (
          <SceneCard
            key={scene.id}
            scene={scene}
            isActive={activeScene === scene.id}
            isPlayingAudio={playingAudio === scene.id}
            onToggle={() => setActiveScene(activeScene === scene.id ? null : scene.id)}
            onUpdate={(updates) => updateScene(scene.id, updates)}
            onRemove={() => removeScene(scene.id)}
            onPlayAudio={() => scene.ttsUrl && playAudio(scene.id, scene.ttsUrl)}
            onRegenerateImage={() => regenerateSceneImage(scene.id)}
            onRegenerateTTS={() => regenerateSceneTTS(scene.id)}
            canRemove={project.scenes.length > 2}
          />
        ))}
      </div>
    </div>
  );
}

function SceneCard({
  scene,
  isActive,
  isPlayingAudio,
  onToggle,
  onUpdate,
  onRemove,
  onPlayAudio,
  onRegenerateImage,
  onRegenerateTTS,
  canRemove,
}: {
  scene: Scene;
  isActive: boolean;
  isPlayingAudio: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Scene>) => void;
  onRemove: () => void;
  onPlayAudio: () => void;
  onRegenerateImage: () => Promise<void>;
  onRegenerateTTS: () => Promise<void>;
  canRemove: boolean;
}) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  return (
    <div className={`border-2 rounded-2xl overflow-hidden transition-all
      ${isActive ? 'border-orange-400 shadow-lg' : 'border-gray-200'}`}
    >
      {/* 씬 헤더 */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-4 hover:bg-gray-50 transition"
      >
        {/* 썸네일 */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
          {scene.imageUrl ? (
            <img src={scene.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🖼️</div>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {scene.order}
            </span>
            <span className="font-semibold text-gray-800">{scene.subtitle || '자막 없음'}</span>
            <span className="text-xs text-gray-400">{scene.duration}초</span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{scene.narration}</p>
        </div>

        {/* 오디오 재생 */}
        {scene.ttsUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayAudio();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition
              ${isPlayingAudio ? 'bg-orange-500 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {isPlayingAudio ? '⏸' : '▶'}
          </button>
        )}

        <span className="text-gray-400">{isActive ? '▲' : '▼'}</span>
      </button>

      {/* 확장 편집 영역 */}
      {isActive && (
        <div className="px-4 pb-4 space-y-4 border-t bg-gray-50/50">
          {/* 나레이션 편집 */}
          <div className="pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              🎙️ 나레이션 (TTS 텍스트)
            </label>
            <textarea
              value={scene.narration}
              onChange={(e) => onUpdate({ narration: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* 자막 편집 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              💬 화면 자막
            </label>
            <input
              type="text"
              value={scene.subtitle}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              maxLength={20}
              className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">{scene.subtitle.length}/20자</p>
          </div>

          {/* 이미지 프롬프트 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              🖼️ 이미지 프롬프트
            </label>
            <textarea
              value={scene.imagePrompt}
              onChange={(e) => onUpdate({ imagePrompt: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* 지속 시간 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              ⏱️ 지속 시간: {scene.duration}초
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={scene.duration}
              onChange={(e) => onUpdate({ duration: parseInt(e.target.value) })}
              className="w-full accent-orange-500"
            />
          </div>

          {/* 액션 버튼들 */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={async () => {
                setIsRegenerating(true);
                await onRegenerateImage();
                setIsRegenerating(false);
              }}
              disabled={isRegenerating}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              🖼️ 이미지 다시 생성
            </button>
            <button
              onClick={async () => {
                setIsRegenerating(true);
                await onRegenerateTTS();
                setIsRegenerating(false);
              }}
              disabled={isRegenerating}
              className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 disabled:opacity-50"
            >
              🔊 음성 다시 생성
            </button>
            {canRemove && (
              <button
                onClick={onRemove}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 ml-auto"
              >
                🗑️ 씬 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}