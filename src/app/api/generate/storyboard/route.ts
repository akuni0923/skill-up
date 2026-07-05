// src/app/api/generate/storyboard/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuid } from 'uuid';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const TONE_PROMPTS: Record<string, string> = {
  friendly: '친근하고 따뜻한 말투로',
  professional: '전문적이고 깔끔한 말투로',
  energetic: '에너지 넘치고 신나는 말투로',
  calm: '차분하고 편안한 말투로',
  cute: '귀엽고 발랄한 말투로',
};

export async function POST(req: NextRequest) {
  try {
    const { foodName, description, totalScenes, tone } = await req.json();
    const tonePrompt = TONE_PROMPTS[tone] || TONE_PROMPTS.friendly;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const prompt = `당신은 요리 숏폼 영상 전문 작가입니다.
${tonePrompt} 나레이션을 작성합니다.
각 씬은 짧고 임팩트 있어야 합니다 (한 씬당 2~4문장).
숏폼 특성상 첫 씬에서 시선을 끌어야 합니다.

"${foodName}" (${description}) 레시피를 ${totalScenes}개 씬으로 나눠 숏폼 스토리보드를 만들어주세요.

구성:
- 씬 1: 후킹 (이 음식이 왜 맛있는지, 시선 끌기)
- 씬 2~${totalScenes - 1}: 재료 소개 + 단계별 조리법
- 씬 ${totalScenes}: 완성 + 마무리 멘트

반드시 아래 JSON 형식으로만 응답:
{
  "scenes": [
    {
      "order": 1,
      "narration": "TTS로 읽을 나레이션 (한글, 2~4문장)",
      "subtitle": "화면 자막 (15자 이내, 한글, 임팩트 있게)",
      "imagePrompt": "이미지 생성 프롬프트 (영문, 상세하게, 음식 사진)",
      "duration": 3
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    const scenes = parsed.scenes.map((scene: any, index: number) => ({
      id: uuid(),
      order: index + 1,
      narration: scene.narration,
      subtitle: scene.subtitle,
      imagePrompt: scene.imagePrompt,
      duration: scene.duration || 3,
    }));

    return NextResponse.json({ scenes });
  } catch (error: any) {
    console.error('Storyboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}