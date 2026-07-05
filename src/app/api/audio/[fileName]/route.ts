import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const AUDIO_DIR = path.join(os.tmpdir(), "foodfactory-audio");

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ fileName: string }> },
) {
  const { fileName } = await context.params;
  const sanitizedFileName = path.basename(fileName);
  const filePath = path.join(AUDIO_DIR, sanitizedFileName);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: "Audio file not found" },
      { status: 404 },
    );
  }

  const stat = fs.statSync(filePath);
  const data = fs.readFileSync(filePath);

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Content-Length": stat.size.toString(),
      "Cache-Control": "no-store",
    },
  });
}
