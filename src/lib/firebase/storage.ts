// src/lib/firebase/storage.ts

import { storage } from './client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadAudio(
  projectId: string,
  sceneId: string,
  audioBuffer: Buffer
): Promise<string> {
  const storageRef = ref(storage, `projects/${projectId}/audio/${sceneId}.mp3`);
  await uploadBytes(storageRef, audioBuffer, { contentType: 'audio/mpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadImage(
  projectId: string,
  sceneId: string,
  imageBuffer: Buffer
): Promise<string> {
  const storageRef = ref(storage, `projects/${projectId}/images/${sceneId}.png`);
  await uploadBytes(storageRef, imageBuffer, { contentType: 'image/png' });
  return getDownloadURL(storageRef);
}

export async function uploadVideo(
  projectId: string,
  videoBuffer: Buffer
): Promise<string> {
  const storageRef = ref(storage, `projects/${projectId}/output.mp4`);
  await uploadBytes(storageRef, videoBuffer, { contentType: 'video/mp4' });
  return getDownloadURL(storageRef);
}

export async function uploadSubtitle(
  projectId: string,
  content: string,
  format: 'srt' | 'vtt'
): Promise<string> {
  const storageRef = ref(storage, `projects/${projectId}/subtitles.${format}`);
  const blob = new Blob([content], { type: 'text/plain' });
  await uploadBytes(storageRef, await blob.arrayBuffer());
  return getDownloadURL(storageRef);
}