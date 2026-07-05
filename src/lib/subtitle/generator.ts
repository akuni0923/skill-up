// src/lib/subtitle/generator.ts

interface SubtitleSegment {
  index: number;
  start: number;   // 초 단위
  end: number;     // 초 단위
  text: string;
}

// SRT 포맷 생성
export function generateSRT(segments: SubtitleSegment[]): string {
  return segments
    .map((seg) => {
      return [
        seg.index,
        `${toSRTTime(seg.start)} --> ${toSRTTime(seg.end)}`,
        seg.text,
        '',
      ].join('\n');
    })
    .join('\n');
}

// VTT 포맷 생성
export function generateVTT(segments: SubtitleSegment[]): string {
  const body = segments
    .map((seg) => {
      return [
        `${toVTTTime(seg.start)} --> ${toVTTTime(seg.end)}`,
        seg.text,
        '',
      ].join('\n');
    })
    .join('\n');

  return `WEBVTT\n\n${body}`;
}

// Scene 배열 → SubtitleSegment 변환
export function scenesToSubtitleSegments(
  scenes: { subtitle: string; duration: number }[]
): SubtitleSegment[] {
  let currentTime = 0;
  return scenes.map((scene, i) => {
    const segment: SubtitleSegment = {
      index: i + 1,
      start: currentTime,
      end: currentTime + scene.duration,
      text: scene.subtitle,
    };
    currentTime += scene.duration;
    return segment;
  });
}

// 시간 포맷 유틸
function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`;
}

function toVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(ms)}`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0');
}