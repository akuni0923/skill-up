// src/components/VideoRenderer.tsx

"use client";

import { useState, useRef } from "react";
import { useProjectStore } from "@/store/useProjectStore";

export function VideoRenderer() {
  const { project, settings } = useProjectStore();
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentScene, setCurrentScene] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoMimeType, setVideoMimeType] = useState<string>("video/webm");
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!project) return null;

  const hasAllAssets = project.scenes.every((s) => s.imageUrl && s.ttsUrl);
  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  const log = (msg: string) => {
    setDebugLog((prev) => [...prev, msg]);
    console.log(msg);
  };

  const getSupportedMimeType = (): string => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4;codecs=avc1,mp4a",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        log(`✅ 지원되는 포맷: ${type}`);
        return type;
      }
    }

    log("⚠️ 지원되는 포맷을 찾지 못함. 기본값 사용");
    return "";
  };

  const renderVideo = async () => {
    if (!canvasRef.current) {
      setError("Canvas를 찾을 수 없습니다");
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setError(
        "이 브라우저는 영상 녹화를 지원하지 않습니다. Chrome을 사용해주세요.",
      );
      return;
    }

    setIsRendering(true);
    setError(null);
    setVideoUrl(null);
    setProgress(0);
    setDebugLog([]);

    try {
      log("🎬 렌더링 시작...");

      const canvas = canvasRef.current;
      const [width, height] =
        settings.aspectRatio === "9:16" ? [1080, 1920] : [1080, 1080];
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context를 가져올 수 없습니다");

      log(`📐 캔버스 크기: ${width}x${height}`);

      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error(
          "이 브라우저는 어떤 비디오 포맷도 지원하지 않습니다. Chrome 사용을 권장합니다.",
        );
      }

      const canvasStream = canvas.captureStream(30);
      log(`🎥 비디오 트랙 개수: ${canvasStream.getVideoTracks().length}`);

      const audioContext = new AudioContext();
      await audioContext.resume();
      const destination = audioContext.createMediaStreamDestination();

      const audioBuffers = await Promise.all(
        project.scenes.map(async (scene) => {
          const response = await fetch(scene.ttsUrl!);
          const arrayBuffer = await response.arrayBuffer();
          return await audioContext.decodeAudioData(arrayBuffer);
        }),
      );

      const mixedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...destination.stream.getAudioTracks(),
      ]);
      log(`🔊 오디오 트랙 개수: ${mixedStream.getAudioTracks().length}`);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          log(`📦 데이터 청크 수신: ${e.data.size} bytes`);
        }
      };

      const recordingFinished = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          log(`⏹ 녹화 종료. 총 청크 개수: ${chunks.length}`);
          if (chunks.length === 0) {
            reject(new Error("녹화된 데이터가 없습니다"));
            return;
          }

          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size === 0) {
            reject(new Error("생성된 영상 파일이 비어있습니다"));
            return;
          }

          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setVideoMimeType(mimeType);
          resolve();
        };

        recorder.onerror = (e: any) =>
          reject(
            new Error(`녹화 중 에러: ${e.error?.message || "Unknown error"}`),
          );
      });

      recorder.start(1000);
      log("▶️ 녹화 시작됨");

      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];
        setCurrentScene(i + 1);
        log(`🎞️ 씬 ${i + 1}/${project.scenes.length} 렌더링 중...`);

        const img = await loadImage(scene.imageUrl!);
        log(`  🖼️ 이미지 로드 완료 (${img.width}x${img.height})`);

        const sceneDurationMs = scene.duration * 1000;
        const audioBuffer = audioBuffers[i];
        playSceneAudio(audioContext, destination, audioBuffer, sceneDurationMs);

        const sceneStartTime = Date.now();
        await new Promise<void>((resolve) => {
          const render = () => {
            const elapsed = Date.now() - sceneStartTime;
            if (elapsed >= sceneDurationMs) {
              resolve();
              return;
            }

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, width, height);
            drawImageCover(ctx, img, 0, 0, width, height);

            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, "rgba(0,0,0,0.3)");
            gradient.addColorStop(0.6, "rgba(0,0,0,0)");
            gradient.addColorStop(1, "rgba(0,0,0,0.6)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            drawFoodTag(ctx, project.foodName, width, height);
            drawSubtitle(ctx, scene.subtitle, width, height);
            drawProgressBar(ctx, i + 1, project.scenes.length, width);

            const totalProgress =
              (i * 100 + (elapsed / sceneDurationMs) * 100) /
              project.scenes.length;
            setProgress(Math.round(totalProgress));
            requestAnimationFrame(render);
          };
          render();
        });

        await new Promise((r) => setTimeout(r, 100));
      }

      log("✅ 모든 씬 렌더링 완료. 녹화 종료 중...");
      recorder.stop();
      await recordingFinished;
      audioContext.close();

      setProgress(100);
      log("🎉 영상 생성 완료!");
      setIsRendering(false);
    } catch (err: any) {
      console.error("영상 렌더링 실패:", err);
      log(`❌ 에러 발생: ${err.message}`);
      setError(err.message);
      setIsRendering(false);
    }
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const extension = videoMimeType.includes("mp4") ? "mp4" : "webm";
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${project.foodName}_shortform_${Date.now()}.${extension}`;
    a.click();
  };

  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl p-8 text-white">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        🎬 숏폼 영상 만들기
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{project.scenes.length}</div>
          <div className="text-xs opacity-80">씬</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{totalDuration}초</div>
          <div className="text-xs opacity-80">총 길이</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{settings.aspectRatio}</div>
          <div className="text-xs opacity-80">비율</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{settings.ttsSpeed}x</div>
          <div className="text-xs opacity-80">속도</div>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <canvas
          ref={canvasRef}
          className={`bg-black rounded-2xl shadow-2xl ${
            settings.aspectRatio === "9:16" ? "w-48 h-[340px]" : "w-64 h-64"
          } ${isRendering ? "ring-4 ring-yellow-300 animate-pulse" : ""}`}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/30 border border-red-300 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {isRendering && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>
              씬 {currentScene}/{project.scenes.length} 렌더링 중...
            </span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!hasAllAssets && (
        <div className="mb-4 p-3 bg-yellow-500/30 border border-yellow-300 rounded-xl text-sm">
          ⚠️ 모든 씬에 이미지와 TTS가 준비되어야 합니다.
        </div>
      )}

      {videoUrl && (
        <div className="mb-4 p-4 bg-green-500/20 border-2 border-green-300 rounded-xl">
          <div className="text-center mb-3 font-bold">✅ 영상 완성!</div>
          <video
            src={videoUrl}
            controls
            playsInline
            className="w-full rounded-lg max-h-96 bg-black"
            onError={(e) => {
              console.error("비디오 재생 에러:", e);
              log("❌ 비디오 재생 실패 - 브라우저 호환성 문제일 수 있음");
            }}
          />
          <p className="text-xs text-center mt-2 opacity-80">
            형식: {videoMimeType}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={renderVideo}
          disabled={isRendering || !hasAllAssets}
          className="flex-1 py-4 bg-white text-orange-600 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isRendering
            ? "🎬 만드는 중..."
            : videoUrl
              ? "🔄 다시 만들기"
              : "🎬 숏폼으로 만들기!"}
        </button>

        {videoUrl && (
          <button
            onClick={downloadVideo}
            className="px-6 py-4 bg-white/20 backdrop-blur text-white rounded-2xl font-bold hover:bg-white/30 transition"
          >
            📥 다운로드
          </button>
        )}
      </div>

      {debugLog.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm cursor-pointer opacity-70">
            🔍 디버그 로그 보기
          </summary>
          <div className="mt-2 p-3 bg-black/30 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
            {debugLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </details>
      )}

      <p className="text-xs opacity-70 text-center mt-4">
        💡 Chrome 브라우저 사용을 권장합니다. Safari는 webm 재생을 지원하지
        않습니다.
      </p>
    </div>
  );
}

function playSceneAudio(
  audioContext: AudioContext,
  destination: MediaStreamAudioDestinationNode,
  audioBuffer: AudioBuffer,
  durationMs: number,
) {
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(destination);
  source.start();

  if (audioBuffer.duration * 1000 > durationMs) {
    source.stop(audioContext.currentTime + durationMs / 1000);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawFoodTag(
  ctx: CanvasRenderingContext2D,
  foodName: string,
  width: number,
  height: number,
) {
  const fontSize = Math.round(width * 0.035);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif`;

  const padding = fontSize * 0.6;
  const textWidth = ctx.measureText(foodName).width;
  const tagWidth = textWidth + padding * 2;
  const tagHeight = fontSize * 2;
  const tagX = (width - tagWidth) / 2;
  const tagY = height * 0.05;

  ctx.fillStyle = "rgba(249, 115, 22, 0.9)";
  roundRect(ctx, tagX, tagY, tagWidth, tagHeight, tagHeight / 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(foodName, width / 2, tagY + tagHeight / 2);
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  subtitle: string,
  width: number,
  height: number,
) {
  const fontSize = Math.round(width * 0.06);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", sans-serif`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 20;
  ctx.fillText(subtitle, width / 2, height * 0.9);
}

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  current: number,
  total: number,
  width: number,
) {
  const barWidth = width * 0.8;
  const barHeight = 12;
  const x = (width - barWidth) / 2;
  const y = width * 0.95;
  const progress = current / total;

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  roundRect(ctx, x, y, barWidth, barHeight, barHeight / 2);
  ctx.fill();

  ctx.fillStyle = "rgba(249, 115, 22, 0.95)";
  roundRect(ctx, x, y, barWidth * progress, barHeight, barHeight / 2);
  ctx.fill();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
