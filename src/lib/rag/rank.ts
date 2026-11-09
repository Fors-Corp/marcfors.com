import type { ChunkRow } from "./types";

/** Prefer CV chunks when distances are close (CV is authoritative for bio facts). */
export function preferCvChunks(rows: ChunkRow[]): ChunkRow[] {
  return [...rows].sort((a, b) => {
    const aCv = a.source_path.startsWith("cv/") ? 0 : 1;
    const bCv = b.source_path.startsWith("cv/") ? 0 : 1;
    if (aCv !== bCv && Math.abs(a.distance - b.distance) < 0.08) {
      return aCv - bCv;
    }
    return a.distance - b.distance;
  });
}
