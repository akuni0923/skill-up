// src/app/api/render/video/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { projectId, scenes, settings } = await req.json();

    // === SRT 자막 생성 ===
    let srtContent = '';
    let currentTime = 0;

    scenes.forEach((scene: any, index: number) => {
      const startTime = formatSrtTime(currentTime);
      const endTime = formatSrtTime(currentTime + scene.duration);

      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${scene.subtitle}\n\n`;

      currentTime += scene.duration;
    });

    // === VTT 자막 생성 ===
    let vttContent = 'WEBVTT\n\n';
    currentTime = 0;

    scenes.forEach((scene: any, index: number) => {
      const startTime = formatVttTime(currentTime);
      const endTime = formatVttTime(currentTime + scene.duration);

      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${scene.subtitle}\n\n`;

      currentTime += scene.duration;
    });

    // === FFmpeg 영상 합성 ===
    // 실제 구현에서는 별도 워커에서 처리
    // 여기서는 구조만 보여드립니다

    /*
    const ffmpegCommand = buildFFmpegCommand({
      scenes,
      settings,
      srtContent,
      outputPath: `/tmp/${projectId}.mp4`,
    });
    */

    // 데모: 상태만 반환
    return NextResponse.json({
      videoUrl: `https://storage.example.com/videos/${projectId}.mp4`,
      srtContent,
      vttContent,
      totalDuration: currentTime,
      status: 'completed',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad3(ms)}`;
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad3(ms)}`;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}