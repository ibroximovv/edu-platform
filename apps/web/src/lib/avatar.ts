import { createAvatar } from '@dicebear/core';
import * as toonHead from '@dicebear/toon-head';

const cache = new Map<string, string>();
const BG = ['ede9fe', 'fce7f3', 'e0f2fe', 'dcfce7', 'fef3c7', 'ffe4e6', 'e0e7ff', 'ccfbf1'];

/** Deterministic, locally generated 3D-ish cartoon avatar (no network). */
export function generatedAvatar(seed: string) {
  let uri = cache.get(seed);
  if (!uri) {
    uri = createAvatar(toonHead, { seed, backgroundColor: BG, backgroundType: ['solid'] }).toDataUri();
    cache.set(seed, uri);
  }
  return uri;
}
