# 🍳 FoodFactory

AI-powered short‑form food video generator.
Create engaging TikTok/Reels/Shorts‑style videos from a random Korean food name — complete with AI‑generated storyboard, images, voiceover, and automatic video rendering.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-9cf?logo=firebase)](https://firebase.google.com/)
[![Google Generative AI](https://img.shields.io/badge/Google%20Gemini-AI-4285f4?logo=google)](https://ai.google.dev/)
[![Cloudflare AI](https://img.shields.io/badge/Cloudflare%20AI-FF6600?logo=cloudflare)](https://developers.cloudflare.com/ai/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-6.1-red?logo=ffmpeg)](https://ffmpeg.org/)

---

## 📖 Overview

FoodFactory is a **Next.js 16 (App Router)** project that demonstrates how to chain multiple generative‑AI services to produce a ready‑to‑publish short‑form food video:

1. **Food name generation** – Google Gemini suggests a random Korean dish.
2. **Storyboard creation** – Gemini splits the dish into scenes, writes narration, subtitles, and image prompts.
3. **Image generation** – Cloudflare Workers AI (Flux‑1 Schnell) creates photorealistic food images from the prompts.
4. **Text‑to‑speech** – A local Python script calls QWEN3 TTS (via Hugging Face) to generate high‑quality Korean audio.
5. **Video rendering** – `fluent‑ffmpeg` stitches images, audio, and subtitles into a vertical MP4.
6. **Storage** – Firebase Firestore stores metadata; Firebase Storage holds assets (optional).

The project is split between:
- **Web UI** (`src/app`) – interaction and triggering the pipeline.
- **Worker** (`worker/jobs/videoRenderer.ts`) – a standalone Node.js script that performs the heavy FFmpeg work (can be run on a server, Cloud Function, or cron job).

---

## ✨ Features

- 🎲 Random Korean food name (한식, 중식, 일식, 양식, 동남아식, 멕시코식, 이탤리안, 분식, 디저트, 건강식)
- 📖 AI‑generated storyboard with narration, subtitles, image prompts, and duration per scene
- 🖼️ AI‑generated food images (Cloudflare Flux‑1 Schnell)
- 🔊 Natural Korean TTS (QWEN3 via Hugging Face)
- 🎬 FFmpeg‑based video assembly with subtitle burning
- 💾 Firebase integration for persisting projects and assets
- 🎨 Modern UI with Tailwind CSS, Radix UI dialogs/selects/sliders, Lucide icons
- 🔖 Zustand store for lightweight client‑side state
- 📦 Type‑safe end‑to‑end TypeScript
- 🚀 Easy deployment to Vercel (serverless) or any Node‑hosting

---

## 🛠️ Tech Stack

| Category | Packages / Services |
|----------|----------------------|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, class‑variance‑authority, clsx, tailwind‑merge |
| **UI Components** | Radix UI (dialog, select, slider), Lucide React |
| **State Management** | Zustand |
| **AI / ML** | `@google/generative-ai` (Gemini), `@google-cloud/text-to-speech` (optional), Cloudflare Workers AI (Flux‑1 Schnell), OpenAI (fallback), QWEN3 TTS (local Python) |
| **Media** | `@ffmpeg/util`, `fluent-ffmpeg`, `uuid` |
| **Backend / Storage** | Firebase (Firestore, Storage) |
| **Dev Tools** | ESLint 9, PostCSS 4, Tailwind CSS 4, TypeScript 5 |
| **Worker** | Node.js `fluent-ffmpeg`, `node-fetch` |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20 (recommended)
- pnpm / npm / yarn / bun
- A Google Gemini API key (`GEMINI_API_KEY`)
- A Cloudflare Workers AI account (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`)
- Firebase project (for Firestore & Storage) – optional for asset persistence
- (Optional) Hugging Face token for TTS if you prefer the hosted API; otherwise the local Python script is used.

### 1. Clone the repo

```bash
git clone https://github.com/your-username/foodfactory.git
cd foodfactory
```

### 2. Install dependencies

```bash
# using pnpm (recommended)
pnpm install
# or
npm install
# or
yarn
# or
bun install
```

### 3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

`.env.local` should contain (example):

```dotenv
# Gemini API
GEMINI_API_KEY=your_gemini_key_here

# TTS (Hugging Face – optional if using local Python script)
HUGGINGFACE_API_KEY=your_hf_token_here

# Image generation – Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your_cf_account_id
CLOUDFLARE_API_TOKEN=your_cf_api_token

# Firebase (optional – for persisting projects/assets)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> **Tip:** If you want to use the local Python TTS script, you do **not** need `HUGGINGFACE_API_KEY`.
> Ensure `scripts/generate_tts.py` and its dependencies are installed (see below).

### 4. Prepare the TTS Python script (optional)

The TTS route expects a Python script at `scripts/generate_tts.py` that accepts arguments and returns a JSON with `{ output: "...wav", duration: number }`.

1. Install Python ≥ 3.10.
2. Install required packages (example using `pip`):

   ```bash
   pip install torch torchaudio transformers librosa soundfile
   ```

3. Adjust `process.env.QWEN3_TTS_SCRIPT_PATH` in `.env.local` if your script lives elsewhere.

> The repository currently ships a placeholder; you can replace it with your own QWEN3‑based TTS implementation.

### 5. Run the development server

```bash
pnpm dev   # or npm run dev / yarn dev / bun dev
```

Open <http://localhost:3000> – you should see the FoodFactory UI.

---

## 🎥 How to generate a video

1. Click **“Generate Food Name”** – a random Korean dish name appears.
2. Press **“Create Storyboard”** – the app asks Gemini to split the dish into scenes (you can configure number of scenes and narration tone).
3. Review the storyboard; each scene shows:
   - Narration (to be spoken)
   - Subtitle (on‑screen text)
   - Image prompt (used to generate the picture)
   - Duration (seconds)
4. Click **“Generate Images”** – each prompt is sent to Cloudflare Flux; you’ll see preview thumbnails.
5. Click **“Generate Audio”** – the narration is turned into speech via QWEN3 TTS (or Hugging Face fallback).
6. Finally, press **“Render Video”** – this triggers the backend route which:
   - Downloads images & audio
   - Creates an SRT subtitle file
   - Uses `fluent‑ffmpeg` to produce a vertical MP4 (9:16 or 1:1)
   - Returns a URL to the rendered video (when using Firebase Storage) or a direct blob link.

> Note: In the current demo the `/api/render/video` route returns a placeholder URL. For actual video rendering you need to run the **worker** (see below) or implement a queue system that calls `worker/jobs/videoRenderer.ts`.

---

## ⚙️ Running the Video Renderer Worker

The heavy FFmpeg work is isolated in `worker/jobs/videoRenderer.ts`. You can invoke it directly from Node or integrate it into a job queue (BullMQ, Redis, etc.).

### Simple manual run

```bash
# Build the TypeScript worker first (if needed)
pnpm run build   # or tsc -p worker/tsconfig.json

# Then execute:
node dist/worker/jobs/videoRenderer.js
```

The script expects a JSON payload on stdin (or you can modify it to accept arguments). Example payload:

```json
{
  "projectId": "abc123",
  "scenes": [
    {
      "id": "s1",
      "imageUrl": "http://.../scene1.png",
      "ttsUrl": "http://.../audio1.wav",
      "subtitle": "재료를 준비해주세요",
      "duration": 3
    }
    // …more scenes
  ],
  "settings": {
    "aspectRatio": "9:16",
    "subtitleStyle": "bold-center"
  }
}
```

The worker will output the path to the final MP4 (e.g., `/tmp/abc123/final.mp4`).

### Production deployment

- Deploy the worker as a **Cloud Function** (AWS Lambda, GCP Cloud Run, Vercel Edge Functions with `@vercel/node` etc.) that listens to a Firebase Firestore trigger or a Pub/Sub message.
- Alternatively, run it as a long‑running Node service that pulls jobs from a Redis‑based queue.

Feel free to adapt the worker to your infrastructure.

---

## 📦 Deployment

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import the project in Vercel → **New Project**.
3. Set the environment variables in the Vercel UI (same keys as `.env.local`).
4. Vercel will automatically run `next build` and serve the app.

> The worker is not executed on Vercel serverless functions by default due to FFmpeg binary size. Consider running the worker separately (see above) and having the Next.js API call it via an internal HTTP endpoint or a message queue.

### Docker

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml* ./pnpm-lock.yaml*
COPY --from=builder /app/public ./public
EXPOSE 3000
ENV NODE_ENV=production
CMD ["pnpm", "start"]
```

Build & run:

```bash
docker build -t foodfactory .
docker run -p 3000:3000 --env-file .env.local foodfactory
```

---

## 🔌 API Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/generate/food-name` | Returns a random Korean food name & description (Gemini). |
| `POST` | `/api/generate/storyboard` | Takes `{foodName, description, totalScenes, tone}` → returns array of scene objects (narration, subtitle, imagePrompt, duration). |
| `POST` | `/api/generate/image` | Takes `{prompt, aspectRatio}` → returns a base64‑JPEG image URL (Cloudflare Flux). |
| `POST` | `/api/generate/tts` | Takes `{text, voice, speed, tone}` → returns `{audioUrl, duration}` (local Python TTS or Hugging Face). |
| `POST` | `/api/render/video` | (Demo) Accepts `{projectId, scenes, settings}` and returns a placeholder video URL. Replace with a call to the worker for actual rendering. |

All responses are JSON; errors return `{ error: string }` with appropriate HTTP status.

---

## 🧪 Testing

- Unit tests are not yet configured. You can add Jest or Vitest under `src/__tests__`.
- End‑to‑end tests can be written with Playwright.

---

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Commit your changes (`git commit -m 'Add awesome feature'`).
4. Push to the branch (`git push origin feat/awesome-feature`).
5. Open a Pull Request.

Please ensure your code follows the existing ESLint & TypeScript rules.

---

## 📄 License

This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org) – React framework
- [Google Gemini](https://ai.google.dev/gemini-api) – Generative AI
- [Cloudflare Workers AI](https://developers.cloudflare.com/ai/) – Fast image generation
- [QWEN3 TTS](https://huggingface.co/Qwen/QWEN3) – High‑quality multilingual TTS
- [fluent‑ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg) – Media processing
- [Firebase](https://firebase.google.com/) – Backend services
- [Radix UI](https://www.radix-ui.com/) – Accessible UI primitives
- [Lucide Icons](https://lucide.dev) – Beautiful icons

---

Enjoy creating delicious AI‑generated food videos! 🍜🎥