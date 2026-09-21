import { del, get, set } from 'idb-keyval';
import { useAuth } from './auth';

// Real File blobs live in IndexedDB (scoped per account); only { n, s } metadata goes in the store.
const k = (key: string) => 'tsprep-file:' + (useAuth.getState().session || '') + ':' + key;

export const saveFile = (key: string, file: File) => set(k(key), file);
export const removeFile = (key: string) => del(k(key));

export const fileSize = (bytes: number) =>
  bytes > 1048576 ? Math.round(bytes / 104857.6) / 10 + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';

export async function downloadFile(key: string, fallbackName: string) {
  const file = await get<File>(k(key));
  if (!file) return false;
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name || fallbackName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
