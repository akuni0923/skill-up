// worker/videoRenderer.ts
// 별도 Node.js 서버 또는 Cloud Function에서 실행

import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface RenderJob {
  projectId: string;
  scenes: {
    id: string;
    imageUrl: string;
    ttsUrl: string;
    subtitle: string;
    duration: number;
  }[];
  settings: {
    aspectRatio: '9:16' | '1:1';
    subtitleStyle: string;
  };
}

export async function renderShortformVideo(job: RenderJob): Promise<string> {
  const workDir = path.join('/tmp', job.projectId);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    // 1. 에셋 다운로드
    console.log('📥 에셋 다운로드 중...');
    for (let i = 0; i < job.scenes.length; i++) {
      const scene = job.scenes[i];

      // 이미지 다운로드
      const imgRes = await fetch(scene.imageUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(path.join(workDir, `scene_${i}.png`), imgBuffer);

      // 오디오 다운로드
      if (scene.ttsUrl.startsWith('data:')) {
        const base64Data = scene.ttsUrl.split(',')[1];
        fs.writeFileSync(path.join(workDir, `audio_${i}.mp3`), Buffer.from(base64Data, 'base64'));
      } else {
        const audioRes = await fetch(scene.ttsUrl);
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
        fs.writeFileSync(path.join(workDir, `audio_${i}.mp3`), audioBuffer);
      }
    }

    // 2. SRT 자막 파일 생성
    let srtContent = '';
    let currentTime = 0;
    job.scenes.forEach((scene, i) => {
      const start = formatSrtTime(currentTime);
      const end = formatSrtTime(currentTime + scene.duration);
      srtContent += `${i + 1}\n${start} --> ${end}\n${scene.subtitle}\n\n`;
      currentTime += scene.duration;
    });
    fs.writeFileSync(path.join(workDir, 'subtitles.srt'), srtContent);

    // 3. 각 씬을 개별 영상으로 변환
    console.log('🎬 씬별 영상 생성 중...');
    const sceneVideos: string[] = [];

    for (let i = 0; i < job.scenes.length; i++) {
      const outputPath = path.join(workDir, `clip_${i}.mp4`);
      sceneVideos.push(outputPath);

      await new Promise<void>((resolve, reject) => {
        const [w, h] = job.settings.aspectRatio === '9:16' ? [1080, 1920] : [1080, 1080];

        ffmpeg()
          .input(path.join(workDir, `scene_${i}.png`))
          .loop(job.scenes[i].duration)
          .input(path.join(workDir, `audio_${i}.mp3`))
          .outputOptions([
            `-vf scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:black`,
            '-c:v libx264',
            '-tune stillimage',
            '-c:a aac',
            '-b:a 192k',
            '-pix_fmt yuv420p',
            '-shortest',
            '-movflags +faststart',
          ])
          .output(outputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err))
          .run();
      });
    }

    // 4. 씬 영상들을 합치기
    console.log('🔗 영상 합치는 중...');
    const concatListPath = path.join(workDir, 'concat.txt');
    const concatContent = sceneVideos.map((v) => `file '${v}'`).join('\n');
    fs.writeFileSync(concatListPath, concatContent);

    const mergedPath = path.join(workDir, 'merged.mp4');
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions(['-c copy'])
        .output(mergedPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    // 5. 자막 번인
    console.log('💬 자막 입히는 중...');
    const finalPath = path.join(workDir, 'final.mp4');
    const srtPath = path.join(workDir, 'subtitles.srt');

    await new Promise<void>((resolve, reject) => {
      const subtitleFilter = getSubtitleFilter(job.settings.subtitleStyle, srtPath);

      ffmpeg()
        .input(mergedPath)
        .outputOptions([
          `-vf ${subtitleFilter}`,
          '-c:a copy',
          '-movflags +faststart',
        ])
        .output(finalPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    console.log('✅ 영상 완성!');
    return finalPath;
  } finally {
    // 정리는 필요에 따라
  }
}

function getSubtitleFilter(style: string, srtPath: string): string {
  const escapedPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');

  switch (style) {
    case 'bold-center':
      return `subtitles='${escapedPath}':force_style='FontSize=28,FontName=NanumGothicBold,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=3,Alignment=10,MarginV=100'`;
    case 'bottom':
      return `subtitles='${escapedPath}':force_style='FontSize=22,FontName=NanumGothic,PrimaryColour=&HFFFFFF,BackColour=&H80000000,Outline=0,BorderStyle=4,Alignment=2,MarginV=30'`;
    case 'highlight':
      return `subtitles='${escapedPath}':force_style='FontSize=26,FontName=NanumGothicBold,PrimaryColour=&H000000,BackColour=&H00FFFF00,Outline=0,BorderStyle=4,Alignment=10,MarginV=100'`;
    default:
      return `subtitles='${escapedPath}':force_style='FontSize=24,FontName=NanumGothic,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2,Alignment=2,MarginV=40'`;
  }
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}