// src/components/StoryboardEditor.tsx

'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { speakText, stopSpeaking, isBrowserTTSSupported } from '@/lib/tts/browserTTS';

export function StoryboardEditor() {
  const {
    project,
    generateStoryboard,
    generateImages,
    generateTTS,
    updateScene,
    isLoading,
    settings,
  } = useProjectStore();

  const [playingSceneId, setPlayingSceneId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  if (!project) return null;

  const hasImages = project.scenes.some((s) => s.imageUrl);
  const hasTTS = project.scenes.some((s) => s.ttsUrl);

  const playScene = async (sceneId: string, narration: string) => {
    if (playingSceneId === sceneId) {
      stopSpeaking();
      setPlayingSceneId(null);
      return;
    }

    setPlayingSceneId(sceneId);
    try {
      await speakText({
        text: narration,
        voice: settings.ttsVoice,
        rate: settings.ttsSpeed,
        lang: 'ko-KR',
      });
    } catch (err) {
      console.error('TTS 재생 실패:', err);
    } finally {
      setPlayingSceneId(null);
    }
  };

  const playAll = async () => {
    if (playingSceneId === 'all') {
      stopSpeaking();
      setPlayingSceneId(null);
      return;
    }

    setPlayingSceneId('all');
    try {
      for (const scene of project.scenes) {
        await speakText({
          text: scene.narration,
          voice: settings.ttsVoice,
          rate: settings.ttsSpeed,
          lang: 'ko-KR',
        });
      }
    } catch (err) {
      console.error('전체 재생 실패:', err);
    } finally {
      setPlayingSceneId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📝 스토리보드
      </h2>

      {project.scenes.length === 0 ? (
        <div>
          <p className="text-gray-500 mb-4">
            <span className="font-semibold text-orange-500">{project.foodName}</span> 레시피를{' '}
            <span className="font-semibold text-orange-500">{settings.totalScenes}개</span> 씬으로
            만들어봐요.
          </p>
          <button
            onClick={generateStoryboard}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500
                       text-white rounded-2xl text-lg font-semibold shadow-lg
                       hover:from-orange-600 hover:to-amber-600 transition-all
                       disabled:opacity-50"
          >
            {isLoading ? '📝 스토리보드 만드는 중...' : '📝 스토리보드 자동 생성'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 생성 버튼들 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={generateImages}
              disabled={isLoading}
              className="py-3 bg-gradient-to-r from-blue-500 to-purple-500
                         text-white rounded-xl font-semibold shadow-md
                         hover:from-blue-600 hover:to-purple-600 transition-all
                         disabled:opacity-50"
            >
              {isLoading
                ? '🎨 생성 중...'
                : hasImages
                ? '🎨 이미지 다시 생성'
                : '🎨 이미지 생성'}
            </button>

            <button
              onClick={generateTTS}
              disabled={isLoading}
              className="py-3 bg-gradient-to-r from-pink-500 to-rose-500
                         text-white rounded-xl font-semibold shadow-md
                         hover:from-pink-600 hover:to-rose-600 transition-all
                         disabled:opacity-50"
            >
              {isLoading
                ? '🎙️ 준비 중...'
                : hasTTS
                ? '🎙️ TTS 다시 준비'
                : '🎙️ TTS 준비'}
            </button>
          </div>

          {!isBrowserTTSSupported() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
              ⚠️ 이 브라우저는 TTS를 지원하지 않습니다. Chrome, Safari, Edge를 사용해주세요.
            </div>
          )}

          {/* 전체 재생 버튼 */}
          {hasTTS && (
            <button
              onClick={playAll}
              className={`w-full py-3 rounded-xl font-semibold shadow-md transition-all
                ${
                  playingSceneId === 'all'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
            >
              {playingSceneId === 'all' ? '⏹ 전체 재생 정지' : '▶ 전체 씬 순차 재생'}
            </button>
          )}

          {/* 씬 목록 */}
          {project.scenes.map((scene) => (
            <div
              key={scene.id}
              className={`p-4 bg-gray-50 rounded-xl border transition-all
                ${playingSceneId === scene.id ? 'ring-2 ring-pink-400 bg-pink-50' : ''}
                ${editingSceneId === scene.id ? 'ring-2 ring-blue-400' : ''}`}
            >
              <div className="flex gap-4">
                {/* 이미지 */}
                <div className="w-24 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center">
                  {scene.imageUrl ? (
                    <img
                      src={scene.imageUrl}
                      alt={scene.subtitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>

                {/* 텍스트 영역 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {scene.order}
                    </span>

                    {editingSceneId === scene.id ? (
                      <input
                        type="text"
                        value={scene.subtitle}
                        onChange={(e) => updateScene(scene.id, { subtitle: e.target.value })}
                        maxLength={20}
                        className="flex-1 px-2 py-1 border rounded text-sm font-semibold"
                        placeholder="자막 (15자 이내)"
                      />
                    ) : (
                      <span className="font-semibold text-gray-800">{scene.subtitle}</span>
                    )}

                    <span className="ml-auto text-xs text-gray-400">{scene.duration}초</span>
                  </div>

                  {editingSceneId === scene.id ? (
                    <textarea
                      value={scene.narration}
                      onChange={(e) => updateScene(scene.id, { narration: e.target.value })}
                      rows={3}
                      className="w-full px-2 py-1 border rounded text-sm mb-2 resize-none"
                      placeholder="나레이션"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>🎙️</strong> {scene.narration}
                    </p>
                  )}

                  {/* 액션 버튼들 */}
                  <div className="flex gap-2 flex-wrap">
                    {scene.ttsUrl && (
                      <button
                        onClick={() => playScene(scene.id, scene.narration)}
                        disabled={playingSceneId === 'all'}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                          ${
                            playingSceneId === scene.id
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                          }
                          disabled:opacity-50`}
                      >
                        {playingSceneId === scene.id ? '⏹ 정지' : '▶ 재생'}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setEditingSceneId(editingSceneId === scene.id ? null : scene.id)
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${
                          editingSceneId === scene.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                    >
                      {editingSceneId === scene.id ? '✅ 완료' : '✏️ 편집'}
                    </button>

                    {/* 지속 시간 조절 */}
                    {editingSceneId === scene.id && (
                      <div className="flex items-center gap-2 ml-auto">
                        <label className="text-xs text-gray-500">시간:</label>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          value={scene.duration}
                          onChange={(e) =>
                            updateScene(scene.id, { duration: parseInt(e.target.value) })
                          }
                          className="w-24 accent-orange-500"
                        />
                        <span className="text-xs font-medium">{scene.duration}초</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}