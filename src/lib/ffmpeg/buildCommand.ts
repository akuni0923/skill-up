// src/lib/ffmpeg/buildCommand.ts

import { Scene, ProjectSettings } from '@/types';

interface FFmpegInput {
  scenes: {
    imagePath: string;
    audioPath: string;
    duration: number;
    subtitle: string;
  }[];
  settings: ProjectSettings;
  outputPath: string;
  srtPath: string;
  workDir: string;
}

// 해상도 계산
export function getResolution(aspectRatio: '9:16' | '1:1'): { width: number; height: number } {
  return aspectRatio === '9:16'
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1080 };
}

// 자막 필터 문자열 생성
export function buildSubtitleFilter(style: string, srtPath: string): string {
  const escaped = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  const baseStyle = {
    'bold-center': `FontSize=28,FontName=Arial Bold,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Alignment=10,MarginV=150`,
    'bottom':      `FontSize=22,FontName=Arial,PrimaryColour=&HFFFFFF,BackColour=&H80000000,BorderStyle=4,Alignment=2,MarginV=40`,
    'highlight':   `FontSize=26,FontName=Arial Bold,PrimaryColour=&H000000,BackColour=&H00FFFF00,BorderStyle=4,Alignment=10,MarginV=150`,
    'typewriter':  `FontSize=24,FontName=Arial,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=60`,
  };

  const styleStr = baseStyle[style as keyof typeof baseStyle] || baseStyle['bottom'];
  return `subtitles='${escaped}':force_style='${styleStr}'`;
}

// concat 파일 내용 생성
export function buildConcatContent(videoPaths: string[]): string {
  return videoPaths.map((p) => `file '${p}'`).join('\n');
}