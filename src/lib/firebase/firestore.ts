// src/lib/firebase/firestore.ts
import { db } from './client';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { RecipeProject } from '@/types';

// 프로젝트 저장
export async function saveProject(project: RecipeProject): Promise<void> {
  await setDoc(doc(db, 'projects', project.id), {
    ...project,
    updatedAt: Date.now(),
  });
}

// 프로젝트 불러오기
export async function getProject(projectId: string): Promise<RecipeProject | null> {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? (snap.data() as RecipeProject) : null;
}

// 프로젝트 상태 업데이트
export async function updateProjectStatus(
  projectId: string,
  status: string,
  extra?: Record<string, any>
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    status,
    updatedAt: Date.now(),
    ...extra,
  });
}

// 사용자 프로젝트 목록
export async function getUserProjects(userId: string): Promise<RecipeProject[]> {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as RecipeProject);
}