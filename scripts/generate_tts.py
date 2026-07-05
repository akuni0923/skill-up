import argparse
import json
import os
from pathlib import Path

import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

try:
    import librosa
except ImportError:
    librosa = None


def parse_args():
    parser = argparse.ArgumentParser(description='Generate TTS audio using Qwen3-TTS')
    parser.add_argument('--text', required=True, help='Text to synthesize')
    parser.add_argument('--output', required=True, help='Output WAV file path')
    parser.add_argument('--speed', type=float, default=1.0, help='Playback speed multiplier')
    parser.add_argument('--speaker', default='Vivian', help='Speaker name')
    parser.add_argument('--instruct', default='밝고 생생한 요리 채널 톤으로 말해줘', help='Voice instruction')
    parser.add_argument('--device', default='cpu', help='PyTorch device to use')
    parser.add_argument('--dtype', default='float32', choices=['float16', 'float32'], help='Tensor dtype')
    return parser.parse_args()


def main():
    args = parse_args()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    model = Qwen3TTSModel.from_pretrained(
        'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice',
        device_map=args.device,
        dtype=getattr(torch, args.dtype),
    )

    wavs, sample_rate = model.generate_custom_voice(
        text=args.text,
        language='Korean',
        speaker=args.speaker,
        instruct=args.instruct,
    )

    audio = wavs[0]
    if args.speed != 1.0:
        if librosa is None:
            raise RuntimeError('librosa가 설치되어 있지 않아 속도 조절을 지원할 수 없습니다.')
        audio = librosa.effects.time_stretch(audio, rate=args.speed)

    sf.write(str(output_path), audio, sample_rate)

    result = {
        'output': str(output_path),
        'duration': len(audio) / sample_rate,
    }
    print(json.dumps(result))


if __name__ == '__main__':
    main()
