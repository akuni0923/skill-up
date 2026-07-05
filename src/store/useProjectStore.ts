// src/store/useProjectStore.ts

import { create } from "zustand";
import { RecipeProject, ProjectSettings, Scene } from "@/types";
import { v4 as uuid } from "uuid";

interface ProjectState {
  project: RecipeProject | null;
  isLoading: boolean;
  error: string | null;
  settings: ProjectSettings;

  setSettings: (settings: Partial<ProjectSettings>) => void;
  generateFoodName: () => Promise<void>;
  generateStoryboard: () => Promise<void>;
  generateImages: () => Promise<void>;
  generateTTS: () => Promise<void>;
  generateAssets: () => Promise<void>;
  addScene: () => void;
  removeScene: (sceneId: string) => void;
  regenerateSceneImage: (sceneId: string) => Promise<void>;
  regenerateSceneTTS: (sceneId: string) => Promise<void>;
  updateScene: (sceneId: string, updates: Partial<Scene>) => void;
  reset: () => void;
}

const defaultSettings: ProjectSettings = {
  totalScenes: 5,
  ttsVoice: "female-1",
  ttsTone: "friendly",
  ttsSpeed: 1.0,
  subtitleStyle: "bold-center",
  aspectRatio: "9:16",
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  isLoading: false,
  error: null,
  settings: defaultSettings,

  setSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  generateFoodName: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/generate/food-name", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "음식 이름 생성 실패");

      const project: RecipeProject = {
        id: uuid(),
        foodName: data.foodName,
        description: data.description,
        category: data.category,
        scenes: [],
        settings: get().settings,
        status: "generating-recipe",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({ project, isLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  generateStoryboard: async () => {
    const { project, settings } = get();
    if (!project) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/generate/storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodName: project.foodName,
          description: project.description,
          totalScenes: settings.totalScenes,
          tone: settings.ttsTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "스토리보드 생성 실패");

      set((state) => ({
        project: state.project
          ? {
              ...state.project,
              scenes: data.scenes,
              status: "generating-storyboard",
            }
          : null,
        isLoading: false,
      }));
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  generateImages: async () => {
    const { project, settings } = get();
    if (!project || project.scenes.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const updatedScenes: Scene[] = [];

      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];

        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: scene.imagePrompt,
            aspectRatio: settings.aspectRatio,
          }),
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || `씬 ${i + 1} 이미지 생성 실패`);

        updatedScenes.push({ ...scene, imageUrl: data.imageUrl });

        set((state) => ({
          project: state.project
            ? {
                ...state.project,
                scenes: [
                  ...updatedScenes,
                  ...state.project.scenes.slice(updatedScenes.length),
                ],
              }
            : null,
        }));
      }

      set({ isLoading: false });
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  generateTTS: async () => {
    const { project, settings } = get();
    if (!project || project.scenes.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const updatedScenes: Scene[] = [];

      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];

        const res = await fetch("/api/generate/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: scene.narration,
            voice: settings.ttsVoice,
            speed: settings.ttsSpeed,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `씬 ${i + 1} TTS 생성 실패`);

        updatedScenes.push({
          ...scene,
          ttsUrl: data.audioUrl || "browser-tts",
          duration: data.duration || scene.duration,
        });
      }

      set((state) => ({
        project: state.project
          ? { ...state.project, scenes: updatedScenes }
          : null,
        isLoading: false,
      }));
    } catch (err: any) {
      console.error(err);
      set({ error: err.message, isLoading: false });
    }
  },

  generateAssets: async () => {
    const { generateImages, generateTTS } = get();

    await generateImages();
    await generateTTS();
  },

  addScene: () => {
    const { project, settings } = get();
    if (!project) return;

    const nextOrder = project.scenes.length + 1;
    const newScene: Scene = {
      id: uuid(),
      order: nextOrder,
      narration: "새로운 씬 내용을 입력하세요.",
      subtitle: `씬 ${nextOrder}`,
      imagePrompt: "맛있어 보이는 음식 장면",
      duration: 3,
    };

    set((state) => ({
      project: state.project
        ? { ...state.project, scenes: [...state.project.scenes, newScene] }
        : null,
    }));
  },

  removeScene: (sceneId) => {
    set((state) => {
      if (!state.project) return state;
      const remainingScenes = state.project.scenes
        .filter((scene) => scene.id !== sceneId)
        .map((scene, index) => ({ ...scene, order: index + 1 }));

      return {
        project: { ...state.project, scenes: remainingScenes },
      };
    });
  },

  regenerateSceneImage: async (sceneId) => {
    const { project, settings } = get();
    if (!project) return;

    const scene = project.scenes.find((scene) => scene.id === sceneId);
    if (!scene) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: scene.imagePrompt,
          aspectRatio: settings.aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "이미지 다시 생성 실패");

      set((state) => ({
        project: state.project
          ? {
              ...state.project,
              scenes: state.project.scenes.map((s) =>
                s.id === sceneId ? { ...s, imageUrl: data.imageUrl } : s,
              ),
            }
          : null,
      }));
    } catch (err: any) {
      console.error(err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  regenerateSceneTTS: async (sceneId) => {
    const { project, settings } = get();
    if (!project) return;

    const scene = project.scenes.find((scene) => scene.id === sceneId);
    if (!scene) return;

    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/generate/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: scene.narration,
          voice: settings.ttsVoice,
          speed: settings.ttsSpeed,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "음성 다시 생성 실패");

      set((state) => ({
        project: state.project
          ? {
              ...state.project,
              scenes: state.project.scenes.map((s) =>
                s.id === sceneId
                  ? {
                      ...s,
                      ttsUrl: data.audioUrl || s.ttsUrl,
                      duration: data.duration || s.duration,
                    }
                  : s,
              ),
            }
          : null,
      }));
    } catch (err: any) {
      console.error(err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateScene: (sceneId, updates) => {
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          scenes: state.project.scenes.map((s) =>
            s.id === sceneId ? { ...s, ...updates } : s,
          ),
        },
      };
    });
  },

  reset: () => {
    set({
      project: null,
      isLoading: false,
      error: null,
      settings: defaultSettings,
    });
  },
}));
