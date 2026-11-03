import { describe, expect, it } from "vitest";
import {
  IDLE_FRAME_BUDGET,
  buildAdjacency,
  nodeAt,
  seedRing,
  settle,
  shouldAnimate,
  stepForces,
  type SimPoint,
} from "@/lib/atlasSim";
import { WORD_ATLAS } from "@/data/wordAtlas";

describe("seedRing", () => {
  it("places every node on a centred ring, at rest, deterministically", () => {
    const pts = seedRing(8);
    expect(pts).toHaveLength(8);
    for (const p of pts) {
      expect(p.vx).toBe(0);
      expect(p.vy).toBe(0);
      expect(Math.hypot(p.x - 0.5, p.y - 0.5)).toBeCloseTo(0.42, 6);
    }
    // No randomness: a second seed is byte-identical.
    expect(seedRing(8)).toEqual(pts);
    // Every node gets its own spot on the ring.
    expect(new Set(pts.map((p) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`)).size).toBe(8);
  });
});

describe("buildAdjacency", () => {
  it("is undirected: each edge lands in both endpoints with its relation", () => {
    const adj = buildAdjacency(3, [
      [0, 1, "syn"],
      [1, 2, "tr"],
    ]);
    expect(adj).toHaveLength(3);
    expect(adj[0]).toEqual([{ other: 1, rel: "syn" }]);
    expect(adj[1]).toEqual([
      { other: 0, rel: "syn" },
      { other: 2, rel: "tr" },
    ]);
    expect(adj[2]).toEqual([{ other: 1, rel: "tr" }]);
  });

  it("gives an empty bucket to nodes with no edges", () => {
    expect(buildAdjacency(2, [])).toEqual([[], []]);
  });
});

describe("stepForces", () => {
  it("mutates in place and reports non-negative motion", () => {
    const pts = seedRing(6);
    const moved = stepForces(pts, [[0, 3, "syn"]]);
    expect(moved).toBeGreaterThan(0);
    expect(pts.some((p) => p.vx !== 0 || p.vy !== 0)).toBe(true);
  });

  it("keeps a dragged node pinned: velocity zeroed, position untouched", () => {
    const pts = seedRing(5);
    const frozen = { ...pts[2] };
    const moved = stepForces(pts, [[0, 2, "syn"]], { dragIdx: 2 });
    expect(pts[2].vx).toBe(0);
    expect(pts[2].vy).toBe(0);
    expect(pts[2].x).toBe(frozen.x);
    expect(pts[2].y).toBe(frozen.y);
    // Motion is floored while a drag is active so the caller keeps animating.
    expect(moved).toBeGreaterThanOrEqual(1);
  });

  it("drives the ring seed apart and holds every node inside the clamp box", () => {
    const edges = WORD_ATLAS.edges;
    const pts = seedRing(WORD_ATLAS.nodes.length);
    const start = pts.map((p) => ({ x: p.x, y: p.y }));
    let motion = 0;
    for (let i = 0; i < 150; i++) motion = stepForces(pts, edges);
    expect(Number.isFinite(motion)).toBe(true);
    expect(motion).toBeGreaterThanOrEqual(0);
    // The layout has actually moved off the seed ring.
    const shifted = pts.some((p, i) => Math.hypot(p.x - start[i].x, p.y - start[i].y) > 0.05);
    expect(shifted).toBe(true);
    // Positions are clamped every tick regardless of what the velocities do.
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(0.04);
      expect(p.x).toBeLessThanOrEqual(0.97);
      expect(p.y).toBeGreaterThanOrEqual(0.13);
      expect(p.y).toBeLessThanOrEqual(0.94);
    }
  });
});

describe("settle", () => {
  it("is exactly a stepForces loop — reproducible from the deterministic seed", () => {
    const viaSettle = seedRing(WORD_ATLAS.nodes.length);
    const viaLoop = seedRing(WORD_ATLAS.nodes.length);
    settle(viaSettle, WORD_ATLAS.edges, 120);
    for (let i = 0; i < 120; i++) stepForces(viaLoop, WORD_ATLAS.edges);
    expect(viaSettle).toEqual(viaLoop);
  });
});

describe("shouldAnimate", () => {
  it("keeps going while a drag is held, no matter the frame count", () => {
    expect(shouldAnimate(0, true)).toBe(true);
    expect(shouldAnimate(IDLE_FRAME_BUDGET, true)).toBe(true);
    expect(shouldAnimate(IDLE_FRAME_BUDGET * 10, true)).toBe(true);
  });

  it("stops the idle entrance animation at the frame budget", () => {
    expect(shouldAnimate(0, false)).toBe(true);
    expect(shouldAnimate(IDLE_FRAME_BUDGET - 1, false)).toBe(true);
    expect(shouldAnimate(IDLE_FRAME_BUDGET, false)).toBe(false);
    expect(shouldAnimate(IDLE_FRAME_BUDGET + 1, false)).toBe(false);
  });

  it("honours a custom budget", () => {
    expect(shouldAnimate(5, false, 10)).toBe(true);
    expect(shouldAnimate(10, false, 10)).toBe(false);
  });
});

describe("nodeAt", () => {
  const pts: SimPoint[] = [
    { x: 0.5, y: 0.5, vx: 0, vy: 0 }, // → (50, 50) on a 100×100 canvas
    { x: 0.1, y: 0.1, vx: 0, vy: 0 }, // → (10, 10)
  ];

  it("returns the node under the pointer, scaled to canvas pixels", () => {
    expect(nodeAt(50, 50, pts, 100, 100)).toBe(0);
    expect(nodeAt(12, 12, pts, 100, 100)).toBe(1);
  });

  it("returns -1 when nothing is within the hit radius", () => {
    expect(nodeAt(90, 40, pts, 100, 100)).toBe(-1);
  });

  it("honours the hit radius at its edge", () => {
    expect(nodeAt(50, 69, pts, 100, 100)).toBe(0); // 19px away
    expect(nodeAt(50, 71, pts, 100, 100)).toBe(-1); // 21px away
    expect(nodeAt(50, 71, pts, 100, 100, 30)).toBe(0); // widen the radius
  });

  it("picks the nearest node when two are in range", () => {
    const close: SimPoint[] = [
      { x: 0.5, y: 0.5, vx: 0, vy: 0 },
      { x: 0.55, y: 0.5, vx: 0, vy: 0 },
    ];
    expect(nodeAt(52, 50, close, 100, 100)).toBe(0);
    expect(nodeAt(54, 50, close, 100, 100)).toBe(1);
  });
});
