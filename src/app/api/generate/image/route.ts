// src/app/api/generate/image/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, aspectRatio } = await req.json();

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare 키가 .env.local에 설정되지 않았습니다');
    }

    // Flux-1 Schnell 모델 (빠르고 무료)
    const model = '@cf/black-forest-labs/flux-1-schnell';
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const enhancedPrompt = `Professional food photography: ${prompt}. 
Appetizing, high quality, close-up shot, food styling, 
restaurant quality, warm natural lighting, shallow depth of field,
${aspectRatio === '9:16' ? 'vertical portrait composition' : 'square composition'},
no text, no watermarks, photorealistic, delicious looking`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        num_steps: 4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare AI 에러: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const base64Image = data.result?.image;

    if (!base64Image) {
      throw new Error('이미지 데이터를 받지 못했습니다');
    }

    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}