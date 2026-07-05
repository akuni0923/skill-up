// src/types/index.ts

export interface RecipeProject {
  id: string;
  userId?: string;
  foodName: string;
  description: string;
  category?: string;
  scenes: Scene[];
  settings: ProjectSettings;
  status: ProjectStatus;
  outputVideoUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id: string;
  order: number;
  narration: string; // TTS로 읽을 텍스트
  subtitle: string; // 화면에 표시할 자막
  imagePrompt: string; // 이미지 생성 프롬프트
  imageUrl?: string; // 생성된 이미지 URL
  ttsUrl?: string; // 생성된 TTS 오디오 URL
  duration: number; // 씬 지속 시간(초)
}

export interface ProjectSettings {
  totalScenes: number; // 씬 개수 (3~10)
  ttsVoice: TTSVoice; // 목소리 종류
  ttsTone: TTSTone; // 목소리 톤
  ttsSpeed: number; // 빠르기 (0.5 ~ 2.0)
  subtitleStyle: SubtitleStyle;
  aspectRatio: "9:16" | "1:1"; // 숏폼 비율
}

export type TTSVoice = "male-1" | "male-2" | "female-1" | "female-2" | "child";
export type TTSTone =
  | "friendly"
  | "professional"
  | "energetic"
  | "calm"
  | "cute";
export type SubtitleStyle =
  | "bold-center"
  | "bottom"
  | "typewriter"
  | "highlight";

export type ProjectStatus =
  | "idle"
  | "generating-recipe"
  | "generating-storyboard"
  | "generating-assets" // TTS + 이미지 생성 중
  | "editing"
  | "rendering"
  | "completed"
  | "error";

export interface GenerationProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}
