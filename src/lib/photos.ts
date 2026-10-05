'use client';

import { useEffect, useState } from 'react';
import { SCHOOLS } from '@/data/schools';
import { useSchoolsStore } from './schools';

/*
 * School photos the admin uploads. Until there is a server they live in this browser's IndexedDB (localStorage is
 * too small for images), the same place the school data itself lives: a photo shows for students on the browser
 * where it was uploaded. A school's `photos` holds references ("ksu-photo:<id>"); plain http(s) links still work.
 */

const DB = 'ksu-photos';
const STORE = 'blobs';
const PREFIX = 'ksu-photo:';
export const MAX_PHOTOS = 5;
const MAX_SIDE = 1600;
const MAX_FILE_MB = 15;

export const isPhotoRef = (v: string) => v.startsWith(PREFIX);

interface Row { id: string; blob: Blob; at: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => { resolve(req.result); db.close(); };
    req.onerror = () => { reject(req.error); db.close(); };
  });
}

/** Scales the image down to at most 1600px on the long side and re-encodes it, so five photos stay a few hundred KB. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Foto tidak bisa diproses'))), 'image/jpeg', 0.82));
}

/** Stores one uploaded image and returns its reference; throws a message fit to show the admin. */
export async function savePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error(`“${file.name}” bukan gambar.`);
  if (file.size > MAX_FILE_MB * 1024 * 1024) throw new Error(`“${file.name}” lebih dari ${MAX_FILE_MB} MB.`);
  let blob: Blob;
  try { blob = await shrink(file); } catch { throw new Error(`“${file.name}” tidak bisa dibuka sebagai gambar.`); }
  const id = crypto.randomUUID();
  await tx('readwrite', s => s.put({ id, blob, at: Date.now() } satisfies Row));
  return PREFIX + id;
}

const urls = new Map<string, string>();

/** The URL to show for a photo reference or link; undefined while it loads or when this browser doesn't hold it. */
export function usePhotoUrl(ref: string | undefined): string | undefined {
  const [loaded, setLoaded] = useState<{ ref: string; url: string } | null>(null);
  useEffect(() => {
    if (!ref || !isPhotoRef(ref) || urls.has(ref)) return;
    let alive = true;
    tx<Row | undefined>('readonly', s => s.get(ref.slice(PREFIX.length))).then(row => {
      if (!row) return;
      const url = URL.createObjectURL(row.blob);
      urls.set(ref, url);
      if (alive) setLoaded({ ref, url });
    }).catch(() => {});
    return () => { alive = false; };
  }, [ref]);
  if (!ref) return undefined;
  if (!isPhotoRef(ref)) return ref;
  return urls.get(ref) ?? (loaded?.ref === ref ? loaded.url : undefined);
}

/**
 * Deletes stored photos no school refers to any more. Photos younger than an hour stay, so an upload that is still
 * waiting in an open editor is not lost.
 */
export async function cleanPhotos() {
  const { overrides, added, drafts } = useSchoolsStore.getState();
  const used = new Set<string>();
  [...SCHOOLS, ...Object.values(overrides), ...added, ...Object.values(drafts)].forEach(s => s?.photos?.forEach(p => used.add(p)));
  const rows = await tx<Row[]>('readonly', s => s.getAll());
  const stale = rows.filter(r => !used.has(PREFIX + r.id) && Date.now() - r.at > 3600_000);
  for (const r of stale) { await tx('readwrite', s => s.delete(r.id)); urls.delete(PREFIX + r.id); }
}
