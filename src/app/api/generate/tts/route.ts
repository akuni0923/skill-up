import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const AUDIO_DIR = path.join(os.tmpdir(), 'foodfactory-audio');
const SCRIPT_PATH = process.env.QWEN3_TTS_SCRIPT_PATH || path.join(process.cwd(), 'scripts', 'generate_tts.py');
const PYTHON_CMD = process.env.QWEN3_PYTHON_CMD || 'python3';

const INSTRUCT_MAP: Record<string, string> = {
  friendly: '밝고 생생한 요리 채널 톤으로 말해줘',
  professional: '전문적인 요리 진행자처럼 차분하고 신뢰감 있게 말해줘',
  energetic: '활기차고 에너지 넘치게 말해줘',
  calm: '부드럽고 차분한 목소리로 전달해줘',
  cute: '귀엽고 발랄한 톤으로 말해줘',
};

async function ensureAudioDir() {
  try {
    await access(AUDIO_DIR, fs.constants.F_OK);
  } catch {
    await mkdir(AUDIO_DIR, { recursive: true });
  }
}

function runPythonGenerateTts(args: string[]) {
  return new Promise<{ output: string; duration: number }>((resolve, reject) => {
    const child = spawn(PYTHON_CMD, [SCRIPT_PATH, ...args], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`TTS 스크립트 실패 (code=${code}): ${stderr}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (error) {
        reject(new Error(`TTS 스크립트 출력 파싱 실패: ${error instanceof Error ? error.message : String(error)}\n${stdout}\n${stderr}`));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const { text, voice, speed, tone } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: '텍스트가 비어있습니다' }, { status: 400 });
    }

    const clampedSpeed = Math.max(0.5, Math.min(2.0, speed || 1.0));
    const instruct = INSTRUCT_MAP[tone] || INSTRUCT_MAP.friendly;

    await ensureAudioDir();

    const fileName = `tts-${Date.now()}-${crypto.randomUUID()}.wav`;
    const outputPath = path.join(AUDIO_DIR, fileName);

    const pythonArgs = [
      '--text', text,
      '--output', outputPath,
      '--speed', String(clampedSpeed),
      '--speaker', 'Vivian',
      '--instruct', instruct,
      '--device', process.env.QWEN3_TTS_DEVICE || 'cpu',
    ];

    const result = await runPythonGenerateTts(pythonArgs);

    return NextResponse.json({
      audioUrl: `/api/audio/${fileName}`,
      duration: result.duration,
      speed: clampedSpeed,
      voice,
      tone,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    return NextResponse.json({ error: error.message || 'TTS 생성 중 오류가 발생했습니다' }, { status: 500 });
  }
}
