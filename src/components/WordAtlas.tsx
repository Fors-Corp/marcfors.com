"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/lib/locale";
import {
  buildAdjacency,
  seedRing,
  settle,
  shouldAnimate,
  stepForces,
  type SimPoint,
} from "@/lib/atlasSim";
import {
  ATLAS_COPY,
  ATLAS_STATS,
  WORD_ATLAS,
  WORDKEEP_GRAPH_URL,
  WORDKEEP_URL,
  type AtlasRelation,
} from "@/data/wordAtlas";

const RELATIONS: AtlasRelation[] = ["syn", "ant", "tr", "rel"];
const LANGS: Array<{ code: string; count: number }> = [
  { code: "EN", count: 30 },
  { code: "ES", count: 9 },
  { code: "FR", count: 9 },
  { code: "DE", count: 8 },
];

/**
 * A frozen snapshot of the Wordkeep Atlas, drawn to a canvas with a tiny
 * self-contained force layout — no graph library. Themed from the atlas CSS
 * variables; links out to the live 3D version.
 */
export function WordAtlas({
  locale,
  variant = "embed",
  overlay,
}: {
  locale: Locale;
  /** `hero` = full-bleed first-viewport atlas; `embed` = case-study figure. */
  variant?: "embed" | "hero";
  /** Drawn over the canvas only (not the legend) — e.g. hero identity block. */
  overlay?: ReactNode;
}) {
  const t = ATLAS_COPY[locale];
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readoutRef = useRef<HTMLDivElement>(null);
  const isHero = variant === "hero";

  useLayoutEffect(() => {
    const wrapNode = wrapRef.current;
    const canvasNode = canvasRef.current;
    if (!wrapNode || !canvasNode) return;
    wrapNode.dataset.atlasEffect = "mounted";
    const context = canvasNode.getContext("2d");
    if (!context) {
      wrapNode.dataset.atlasEffect = "no-2d";
      return; // no 2d context (e.g. jsdom) — the legend + links still stand alone
    }

    // Re-bind with explicit non-null types: the nested draw/loop/resize
    // functions below are closures, and TS does not carry the narrowing from
    // the guards above into function declarations that run later.
    const wrap: HTMLDivElement = wrapNode;
    const canvas: HTMLCanvasElement = canvasNode;
    const ctx: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const N = WORD_ATLAS.nodes.length;
    const edges = WORD_ATLAS.edges;

    // The physics + hit-testing live in src/lib/atlasSim.ts (pure, unit-tested).
    const adj = buildAdjacency(N, edges);
    const pts: SimPoint[] = seedRing(N);

    let W = 1;
    let H = 1;
    let raf = 0;
    let frame = 0; // ticks the running loop has done; caps the idle entrance animation (see shouldAnimate)
    let hoverIdx = -1; // desktop mouse preview, cleared on pointerleave
    let pinIdx = -1; // click/tap selection, persists until cleared — this is what "opens" a word
    let dragIdx = -1;
    const focus = () => (pinIdx >= 0 ? pinIdx : hoverIdx);

    const readColors = () => {
      const c = getComputedStyle(document.documentElement);
      const g = (n: string) => c.getPropertyValue(n).trim() || "#888";
      return {
        node: g("--paper-dim"),
        focus: g("--paper"),
        syn: g("--signal"),
        ant: g("--danger"),
        tr: g("--brass"),
        rel: g("--muted"),
        label: g("--paper"),
        serif: c.getPropertyValue("--serif").trim() || "Georgia, serif",
      };
    };
    let COL = readColors();
    const relColor = (r: AtlasRelation) =>
      r === "syn" ? COL.syn : r === "ant" ? COL.ant : r === "tr" ? COL.tr : COL.rel;
    const relDash = (r: AtlasRelation) => (r === "ant" ? [5, 4] : r === "rel" ? [1.5, 4] : []);

    // Compact (narrow) layout insets the unit square so labels/nodes keep a
    // margin from the canvas edge instead of clipping on portrait phones.
    const mapX = (x: number) => {
      if (W >= 560) return x * W;
      const pad = 0.07;
      return (pad + x * (1 - 2 * pad)) * W;
    };
    const mapY = (y: number) => {
      if (W >= 560) return y * H;
      const pad = 0.09;
      return (pad + y * (1 - 2 * pad)) * H;
    };
    const px = (p: SimPoint) => mapX(p.x);
    const py = (p: SimPoint) => mapY(p.y);
    // Degree rank for sparse mobile labels — hubs stay named, leaves stay dots.
    const degree = adj.map((n) => n.length);
    const degreeOrder = degree
      .map((d, i) => ({ d, i }))
      .sort((a, b) => b.d - a.d || a.i - b.i)
      .map((row) => row.i);
    const hubSet = new Set(degreeOrder.slice(0, Math.min(14, Math.ceil(N * 0.28))));

    function draw() {
      const f = focus();
      const compact = W < 560;
      ctx.clearRect(0, 0, W, H);
      const near = new Set<number>();
      if (f >= 0) {
        near.add(f);
        adj[f].forEach((e) => near.add(e.other));
      }

      ctx.lineCap = "round";
      edges.forEach(([a, b, r]) => {
        const lit = f >= 0 && (a === f || b === f);
        const faded = f >= 0 && !lit;
        ctx.globalAlpha = faded ? 0.06 : compact ? 0.42 : 0.55;
        ctx.strokeStyle = relColor(r);
        ctx.lineWidth = lit ? 1.8 : compact ? 0.9 : 1;
        ctx.setLineDash(relDash(r));
        ctx.beginPath();
        ctx.moveTo(px(pts[a]), py(pts[a]));
        ctx.lineTo(px(pts[b]), py(pts[b]));
        ctx.stroke();
      });
      ctx.setLineDash([]);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const focusR = compact ? 5.5 : 6.5;
      const nodeR = compact ? 2.6 : 3.2;
      const focusFont = compact ? "600 12px" : "600 13px";
      const nodeFont = compact ? "500 9.5px" : "500 11px";
      pts.forEach((p, i) => {
        const isFocus = i === f;
        const faded = f >= 0 && !near.has(i);
        const r = isFocus ? focusR : nodeR;
        ctx.globalAlpha = faded ? 0.18 : 1;
        ctx.beginPath();
        ctx.arc(px(p), py(p), r, 0, Math.PI * 2);
        ctx.fillStyle = isFocus ? COL.focus : COL.node;
        ctx.fill();
        if (i === pinIdx) {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = COL.tr;
          ctx.stroke();
        }
        const showLabel =
          near.has(i) || (!compact && f < 0) || (compact && f < 0 && hubSet.has(i));
        if (showLabel) {
          ctx.globalAlpha = faded ? 0.2 : isFocus ? 1 : compact ? 0.7 : 0.75;
          ctx.fillStyle = isFocus ? COL.label : COL.node;
          ctx.font = `${isFocus ? focusFont : nodeFont} ${COL.serif}`;
          ctx.fillText(WORD_ATLAS.nodes[i].label, px(p), py(p) - r - (compact ? 6 : 8));
        }
      });
      ctx.globalAlpha = 1;
    }

    function loop() {
      frame++;
      stepForces(pts, edges, { dragIdx });
      draw();
      if (shouldAnimate(frame, dragIdx >= 0)) raf = requestAnimationFrame(loop);
      else raf = 0;
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      const nextW = Math.max(wrap.clientWidth, canvas.clientWidth, Math.round(rect.width));
      const nextH = Math.max(wrap.clientHeight, canvas.clientHeight, Math.round(rect.height));
      // Layout can report 0 on the first paint (sticky/full-bleed). Skip until real.
      if (nextW < 2 || nextH < 2) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Avoid redundant buffer resets that clear the frame.
      if (Math.abs(nextW - W) < 0.5 && Math.abs(nextH - H) < 0.5 && canvas.width === Math.round(W * dpr)) {
        return true;
      }
      W = nextW;
      H = nextH;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.dataset.atlasSized = `${Math.round(W)}x${Math.round(H)}`;
      wrap.dataset.atlasEffect = "sized";
      draw();
      return true;
    }

    if (reduce) {
      settle(pts, edges);
    }
    // Observe first so the initial layout callback cannot be missed, then poll briefly.
    const ro = new ResizeObserver(() => {
      if (resize() && !raf && !reduce) raf = requestAnimationFrame(loop);
    });
    ro.observe(wrap);
    window.addEventListener("resize", resize);
    let boots = 0;
    const bootId = window.setInterval(() => {
      boots += 1;
      if (resize() || boots > 40) window.clearInterval(bootId);
    }, 50);
    if (!reduce) {
      loop();
    } else {
      resize();
      draw();
    }

    const onThemeChange = () => {
      COL = readColors();
      draw();
    };
    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onThemeChange);

    function unmapX(mx: number) {
      if (W >= 560) return mx / W;
      const pad = 0.07;
      return (mx / W - pad) / (1 - 2 * pad);
    }
    function unmapY(my: number) {
      if (W >= 560) return my / H;
      const pad = 0.09;
      return (my / H - pad) / (1 - 2 * pad);
    }
    function hit(mx: number, my: number) {
      const radius = W < 560 ? 22 : 20;
      let bd = radius * radius;
      let best = -1;
      for (let i = 0; i < pts.length; i++) {
        const dx = mapX(pts[i].x) - mx;
        const dy = mapY(pts[i].y) - my;
        const d = dx * dx + dy * dy;
        if (d < bd) {
          bd = d;
          best = i;
        }
      }
      return best;
    }
    function localXY(ev: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return { mx: ev.clientX - rect.left, my: ev.clientY - rect.top };
    }

    const readout = readoutRef.current;
    function updateReadout() {
      if (!readout) return;
      if (pinIdx < 0) {
        readout.classList.remove("on");
        readout.replaceChildren();
        return;
      }
      const word = WORD_ATLAS.nodes[pinIdx];
      const head = document.createElement("strong");
      head.textContent = word.label;
      const rest = document.createElement("span");
      rest.textContent =
        " — " +
        adj[pinIdx]
          .map((e) => `${WORD_ATLAS.nodes[e.other].label} (${t.rel[e.rel]})`)
          .join(", ");
      readout.replaceChildren(head, rest);
      readout.classList.add("on");
    }

    const onDown = (ev: PointerEvent) => {
      const { mx, my } = localXY(ev);
      const i = hit(mx, my);
      pinIdx = i;
      updateReadout();
      if (i >= 0) {
        dragIdx = i;
        try {
          canvas.setPointerCapture(ev.pointerId);
        } catch {
          /* ignore */
        }
        ev.preventDefault();
        if (!raf) raf = requestAnimationFrame(loop);
      }
      canvas.style.cursor = i >= 0 ? "pointer" : "default";
      if (!raf) draw();
    };
    const onMove = (ev: PointerEvent) => {
      const { mx, my } = localXY(ev);
      if (dragIdx >= 0) {
        pts[dragIdx].x = Math.min(0.98, Math.max(0.02, unmapX(mx)));
        pts[dragIdx].y = Math.min(0.97, Math.max(0.03, unmapY(my)));
        ev.preventDefault();
        return;
      }
      const i = hit(mx, my);
      if (i !== hoverIdx) {
        hoverIdx = i;
        canvas.style.cursor = i >= 0 ? "pointer" : "default";
        if (!raf) draw();
      }
    };
    const endDrag = (ev: PointerEvent) => {
      if (dragIdx < 0) return;
      dragIdx = -1;
      try {
        canvas.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      if (!raf) draw();
    };
    const onLeave = () => {
      if (hoverIdx !== -1) {
        hoverIdx = -1;
        if (!raf) draw();
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      window.clearInterval(bootId);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      mo.disconnect();
      mq.removeEventListener("change", onThemeChange);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      canvas.removeEventListener("pointerleave", onLeave);
    };
    // Runs once: this sets up the canvas simulation for the component's whole
    // lifetime. `t` only changes if `locale` changes, which remounts the page
    // (a different route under [locale]), so it can't go stale here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <figure className={isHero ? "atlas atlas--hero" : "atlas"}>
      <div className="atlas-plot">
        <div className="atlas-stage" ref={wrapRef}>
          <canvas
            ref={canvasRef}
            className="atlas-canvas"
            role="img"
            aria-label={`Wordkeep Atlas — ${ATLAS_STATS.words} words in ${ATLAS_STATS.languages} languages, ${ATLAS_STATS.links} links`}
          />
          <div className="atlas-readout" ref={readoutRef} aria-live="polite" />
        </div>
        {overlay}
      </div>
      <figcaption className="atlas-legend">
        <span className="atlas-count">{t.hint}</span>
        <span className="atlas-keys">
          {RELATIONS.map((r) => (
            <span className="atlas-key" key={r} data-rel={r}>
              <i aria-hidden="true" />
              {t.rel[r]}
            </span>
          ))}
          {LANGS.map((l) => (
            <span className="atlas-key atlas-lang" key={l.code}>
              {l.code}
              <em>{l.count}</em>
            </span>
          ))}
        </span>
      </figcaption>
      {!isHero ? (
        <div className="links atlas-links">
          <a href={WORDKEEP_GRAPH_URL} target="_blank" rel="noopener noreferrer">
            {t.open}
          </a>
          <a href={WORDKEEP_URL} target="_blank" rel="noopener noreferrer">
            {t.visit}
          </a>
        </div>
      ) : null}
    </figure>
  );
}
