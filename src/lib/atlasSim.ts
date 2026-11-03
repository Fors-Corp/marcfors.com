import type { AtlasEdge, AtlasRelation } from "@/data/wordAtlas";

/**
 * The Wordkeep Atlas force simulation, lifted out of `WordAtlas.tsx` so it can
 * be reasoned about and unit-tested on its own. Everything here is pure: no
 * DOM, no canvas, no time. Positions are normalised to the unit square (0…1);
 * the component scales them to pixels when it draws and hit-tests.
 */

export type SimPoint = { x: number; y: number; vx: number; vy: number };
export type Neighbor = { other: number; rel: AtlasRelation };

/**
 * Deterministic seed layout: nodes spaced evenly on a ring around the centre.
 * No randomness, so a settled layout is reproducible run to run.
 */
export function seedRing(count: number): SimPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return { x: 0.5 + Math.cos(a) * 0.42, y: 0.5 + Math.sin(a) * 0.42, vx: 0, vy: 0 };
  });
}

/** Undirected adjacency list — one bucket of `{ other, rel }` per node. */
export function buildAdjacency(count: number, edges: readonly AtlasEdge[]): Neighbor[][] {
  const adj: Neighbor[][] = Array.from({ length: count }, () => []);
  for (const [a, b, rel] of edges) {
    adj[a].push({ other: b, rel });
    adj[b].push({ other: a, rel });
  }
  return adj;
}

// Spring rest length per relation: translations sit furthest apart, synonyms
// closest. Antonyms and "related" land in between.
const REST: Record<AtlasRelation, number> = { tr: 0.26, syn: 0.12, rel: 0.2, ant: 0.17 };

export type StepOptions = {
  /** Node held by the pointer: its velocity is zeroed and it isn't integrated. */
  dragIdx?: number;
};

/**
 * Advance the simulation one tick, mutating `pts` in place: all-pairs repulsion
 * + a weak pull to centre, then per-edge springs, then a clamped position
 * update. Returns the total unclamped motion this tick, which the caller uses
 * to decide when the layout has come to rest.
 */
export function stepForces(
  pts: SimPoint[],
  edges: readonly AtlasEdge[],
  { dragIdx = -1 }: StepOptions = {},
): number {
  const N = pts.length;
  let moved = 0;

  for (let i = 0; i < N; i++) {
    const a = pts[i];
    let fx = 0;
    let fy = 0;
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const b = pts[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = dx * dx + dy * dy || 0.0001;
      const rep = 0.0012 / d2;
      fx += dx * rep;
      fy += dy * rep;
    }
    fx += (0.5 - a.x) * 0.014;
    fy += (0.5 - a.y) * 0.014;
    a.vx = (a.vx + fx) * 0.82;
    a.vy = (a.vy + fy) * 0.82;
  }

  for (const [ai, bi, r] of edges) {
    const a = pts[ai];
    const b = pts[bi];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const k = ((d - REST[r]) / d) * (r === "syn" ? 0.06 : 0.035);
    a.vx += dx * k;
    a.vy += dy * k;
    b.vx -= dx * k;
    b.vy -= dy * k;
  }

  for (let i = 0; i < N; i++) {
    const a = pts[i];
    if (i === dragIdx) {
      // Position is driven by the pointer directly; other nodes still feel it
      // through the loops above.
      a.vx = 0;
      a.vy = 0;
      continue;
    }
    // Extra headroom at the top: labels draw above their node, so a node
    // clamped too close to y=0 gets its own label clipped by the canvas edge.
    a.x = Math.min(0.97, Math.max(0.04, a.x + a.vx));
    a.y = Math.min(0.94, Math.max(0.13, a.y + a.vy));
    moved += Math.abs(a.vx) + Math.abs(a.vy);
  }

  if (dragIdx >= 0) moved = Math.max(moved, 1); // keep the sim awake while dragging
  return moved;
}

// This layout never comes to rest — see the module doc comment on
// `shouldAnimate` — so both the reduced-motion snapshot and the full
// animation's idle budget stop after the same fixed number of ticks rather
// than waiting for a "moved" value that won't reliably drop below threshold.
export const IDLE_FRAME_BUDGET = 260;

/**
 * Run the sim to a settled-enough layout in one shot. Used for the
 * reduced-motion path, where the component skips the animation and draws the
 * result directly.
 */
export function settle(pts: SimPoint[], edges: readonly AtlasEdge[], ticks = IDLE_FRAME_BUDGET): void {
  for (let i = 0; i < ticks; i++) stepForces(pts, edges);
}

/**
 * Whether the animate loop should schedule another frame. The all-pairs
 * repulsion in `stepForces` doesn't damp out — left running, `moved` keeps
 * oscillating (and can spike) indefinitely instead of settling near zero, so
 * an idle loop that waits for rest never stops. A held drag always continues
 * (the pointer is actively driving a node); otherwise the loop gets the same
 * `IDLE_FRAME_BUDGET` ticks as the reduced-motion snapshot and then goes
 * idle, matching what reduced-motion users see as "the" layout.
 */
export function shouldAnimate(frame: number, dragging: boolean, budget = IDLE_FRAME_BUDGET): boolean {
  return dragging || frame < budget;
}

/**
 * Index of the node whose pixel position is within `hit` px of (`mx`, `my`) in
 * a `W`×`H` canvas, or -1. The radius is generous by default — a fingertip,
 * not just a cursor.
 */
export function nodeAt(
  mx: number,
  my: number,
  pts: readonly SimPoint[],
  W: number,
  H: number,
  hit = 20,
): number {
  let bd = hit * hit;
  let best = -1;
  for (let i = 0; i < pts.length; i++) {
    const dx = pts[i].x * W - mx;
    const dy = pts[i].y * H - my;
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}
