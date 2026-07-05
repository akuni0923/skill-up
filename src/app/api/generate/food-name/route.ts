// src/app/api/generate/food-name/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const FOOD_CATEGORIES = [
  '한식', '중식', '일식', '양식', '동남아식',
  '멕시코식', '이탈리안', '분식', '디저트', '건강식',
];

export async function POST() {
  try {
    const randomCategory = FOOD_CATEGORIES[Math.floor(Math.random() * FOOD_CATEGORIES.length)];

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 1.2,
      },
    });

    const prompt = `당신은 요리 전문가입니다.
"${randomCategory}" 카테고리에서 숏폼 영상으로 만들기 좋은 요리 하나를 랜덤으로 추천해주세요.

반드시 아래 JSON 형식으로만 응답:
{
  "foodName": "요리 이름 (한글)",
  "description": "이 요리에 대한 간단한 설명 (1~2문장, 한글)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);

    return NextResponse.json({
      foodName: parsed.foodName,
      description: parsed.description,
      category: randomCategory,
    });
  } catch (error: any) {
    console.error('Food name generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}