// src/components/SettingsPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { TTSVoice, TTSTone } from '@/types';
import { getKoreanVoices } from '@/lib/tts/browserTTS';

const VOICE_OPTIONS: { value: TTSVoice; label: string; emoji: string }[] = [
  { value: 'female-1', label: '여성 1', emoji: '👩' },
  { value: 'female-2', label: '여성 2', emoji: '👩‍🦰' },
  { value: 'male-1', label: '남성 1', emoji: '👨' },
  { value: 'male-2', label: '남성 2', emoji: '👨‍🦱' },
  { value: 'child', label: '중성', emoji: '🧒' },
];

const TONE_OPTIONS: { value: TTSTone; label: string; emoji: string }[] = [
  { value: 'friendly', label: '친근한', emoji: '😊' },
  { value: 'professional', label: '전문적인', emoji: '👨‍🍳' },
  { value: 'energetic', label: '에너지틱', emoji: '🔥' },
  { value: 'calm', label: '차분한', emoji: '😌' },
  { value: 'cute', label: '귀여운', emoji: '🥰' },
];

export function SettingsPanel() {
  const { settings, setSettings, project } = useProjectStore();
  const [isOpen, setIsOpen] = useState(true);
  const [availableVoices, setAvailableVoices] = useState(0);

  // 브라우저 로드 후 한국어 음성 개수 체크
  useEffect(() => {
    const loadVoices = () => {
      const voices = getKoreanVoices();
      setAvailableVoices(voices.length);
    };

    loadVoices();
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const hasScenes = project && project.scenes.length > 0;

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* 토글 헤더 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <span className="font-semibold text-gray-800">설정</span>
          <span className="text-xs text-gray-400 ml-2">
            {settings.totalScenes}씬 · {settings.ttsVoice} · {settings.ttsSpeed.toFixed(1)}x · {settings.aspectRatio}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-6 border-t">
          {/* 한국어 음성 정보 */}
          {availableVoices === 0 && (
            <div className="pt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
              ⚠️ 한국어 음성이 없습니다. Mac 시스템 설정 → 손쉬운 사용 → 말하기 콘텐츠에서 다운로드해주세요.
            </div>
          )}
          {availableVoices > 0 && (
            <div className="pt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              ✅ 한국어 음성 {availableVoices}개 사용 가능
            </div>
          )}

          {/* 씬 개수 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📐 씬 개수: <span className="text-orange-500 font-bold">{settings.totalScenes}개</span>
              {hasScenes && <span className="ml-2 text-xs text-gray-400">(스토리보드 생성 후 변경 불가)</span>}
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={settings.totalScenes}
              onChange={(e) => setSettings({ totalScenes: parseInt(e.target.value) })}
              disabled={!!hasScenes}
              className="w-full accent-orange-500 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3개 (15초)</span>
              <span>5개 (25초)</span>
              <span>10개 (50초)</span>
            </div>
          </div>

          {/* TTS 목소리 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎙️ 목소리 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {VOICE_OPTIONS.map((voice) => (
                <button
                  key={voice.value}
                  onClick={() => setSettings({ ttsVoice: voice.value })}
                  className={`p-3 rounded-xl border-2 text-center transition-all
                    ${
                      settings.ttsVoice === voice.value
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-2xl mb-1">{voice.emoji}</div>
                  <div className="text-xs font-medium">{voice.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* TTS 말투 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🎭 말투 스타일
              {hasScenes && <span className="ml-2 text-xs text-gray-400">(스토리보드 재생성 시 반영)</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSettings({ ttsTone: tone.value })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${
                      settings.ttsTone === tone.value
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tone.emoji} {tone.label}
                </button>
              ))}
            </div>
          </div>

          {/* TTS 속도 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ⚡ 말하기 속도: <span className="text-orange-500 font-bold">{settings.ttsSpeed.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={settings.ttsSpeed}
              onChange={(e) => setSettings({ ttsSpeed: parseFloat(e.target.value) })}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>🐢 느리게 (0.5x)</span>
              <span>보통 (1.0x)</span>
              <span>빠르게 (2.0x) 🐇</span>
            </div>
          </div>

          {/* 화면 비율 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              📱 화면 비율
              {hasScenes && <span className="ml-2 text-xs text-gray-400">(이미지 재생성 시 반영)</span>}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({ aspectRatio: '9:16' })}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all
                  ${
                    settings.aspectRatio === '9:16'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-2xl mb-1">📱</div>
                <div className="font-medium text-sm">세로 (9:16)</div>
                <div className="text-xs text-gray-500">릴스/숏츠/틱톡</div>
              </button>
              <button
                onClick={() => setSettings({ aspectRatio: '1:1' })}
                className={`flex-1 p-4 rounded-xl border-2 text-center transition-all
                  ${
                    settings.aspectRatio === '1:1'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <div className="text-2xl mb-1">⬜</div>
                <div className="font-medium text-sm">정사각 (1:1)</div>
                <div className="text-xs text-gray-500">인스타 피드</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}