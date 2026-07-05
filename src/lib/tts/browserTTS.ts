// src/lib/tts/browserTTS.ts

export interface BrowserTTSOptions {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  lang?: string;
}

// 한국어 음성 목록 가져오기
export function getKoreanVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  const voices = window.speechSynthesis.getVoices();
  return voices.filter((v) => v.lang.startsWith('ko'));
}

// 전체 음성 목록
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return [];
  return window.speechSynthesis.getVoices();
}

// 브라우저 TTS 재생
export function speakText(options: BrowserTTSOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

    // 진행 중인 TTS 정지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(options.text);
    utterance.lang = options.lang || 'ko-KR';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // 한국어 목소리 매핑
    const koreanVoices = getKoreanVoices();
    if (koreanVoices.length > 0) {
      const voiceMap: Record<string, number> = {
        'female-1': 0,
        'female-2': 1,
        'male-1': 2,
        'male-2': 3,
        'child': 0,
      };
      const voiceIndex = voiceMap[options.voice || 'female-1'] || 0;
      utterance.voice = koreanVoices[voiceIndex % koreanVoices.length];
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(new Error(`TTS 에러: ${e.error}`));

    window.speechSynthesis.speak(utterance);
  });
}

// TTS 정지
export function stopSpeaking(): void {
  if (typeof window !== 'undefined') {
    window.speechSynthesis.cancel();
  }
}

// 브라우저 TTS 지원 여부 확인
export function isBrowserTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// 사용 가능한 한국어 목소리 개수
export function getKoreanVoiceCount(): number {
  return getKoreanVoices().length;
}