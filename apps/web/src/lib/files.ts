import type { FileKind } from '@edu/shared';

const EXT_KIND: Record<string, FileKind> = {
  mp4: 'video', webm: 'video', mov: 'video', mkv: 'video', avi: 'video', m4v: 'video',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', svg: 'image', avif: 'image',
  pdf: 'pdf',
  doc: 'document', docx: 'document', txt: 'document', rtf: 'document', odt: 'document', md: 'document',
  ppt: 'presentation', pptx: 'presentation', key: 'presentation', odp: 'presentation',
  xls: 'spreadsheet', xlsx: 'spreadsheet', csv: 'spreadsheet', ods: 'spreadsheet',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  mp3: 'audio', wav: 'audio', ogg: 'audio', m4a: 'audio',
};

export function fileExt(name: string) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export function detectKind(name: string, mime = ''): FileKind {
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'pdf';
  return EXT_KIND[fileExt(name)] ?? 'other';
}

export const KIND_LABEL: Record<FileKind | 'link', string> = {
  video: 'Video',
  image: 'Rasm',
  pdf: 'PDF',
  document: 'Hujjat',
  presentation: 'Taqdimot',
  spreadsheet: 'Jadval',
  archive: 'Arxiv',
  audio: 'Audio',
  other: 'Fayl',
  link: 'Havola',
};

export const ACCEPT_PRESETS = {
  any: undefined,
  submission: '.pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.zip,.rar,.7z,image/*,.py,.js,.ts,.java,.cpp,.c,.sql,.ipynb',
  material: 'video/*,image/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.md',
  image: 'image/*',
} as const;
