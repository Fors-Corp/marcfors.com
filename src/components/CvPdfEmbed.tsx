"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { pageWidthScale } from "@/lib/cvPdfFit";
import { CV_PATH } from "@/lib/site";

const WORKER_SRC = "/pdf.worker.min.mjs";

type Props = {
  title: string;
};

/**
 * Renders every page of the CV PDF into canvases scaled to the container width.
 * Replaces the native <iframe> PDF chrome, which on mobile Safari often opens
 * massively zoomed with the right edge clipped.
 */
export function CvPdfEmbed({ title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const containerEl = containerRef.current;
    const pagesEl = pagesRef.current;
    if (!containerEl || !pagesEl) return;
    const container: HTMLDivElement = containerEl;
    const pagesRoot: HTMLDivElement = pagesEl;

    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let pdfDoc: PDFDocumentProxy | undefined;
    const renderTasks = new Map<number, RenderTask>();
    let paintGeneration = 0;
    const canvases: HTMLCanvasElement[] = [];

    async function boot() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        pdfDoc = await pdfjs.getDocument({ url: CV_PATH }).promise;
        if (cancelled) return;

        const pdfPages: PDFPageProxy[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i += 1) {
          pdfPages.push(await pdfDoc.getPage(i));
          if (cancelled) return;
        }

        pagesRoot.replaceChildren();
        for (let i = 0; i < pdfPages.length; i += 1) {
          const wrap = document.createElement("div");
          wrap.className = "cv-page";
          const canvas = document.createElement("canvas");
          wrap.appendChild(canvas);
          pagesRoot.appendChild(wrap);
          canvases.push(canvas);
        }

        const paint = async () => {
          const generation = ++paintGeneration;
          const width = container.clientWidth;
          // Subtract horizontal padding on .cv-pages so the page fits the
          // scrollport, not the padding box.
          const pagesStyle = getComputedStyle(pagesRoot);
          const padX =
            (Number.parseFloat(pagesStyle.paddingLeft) || 0) +
            (Number.parseFloat(pagesStyle.paddingRight) || 0);
          const drawWidth = Math.max(1, width - padX);
          if (width <= 0) return;

          for (let i = 0; i < pdfPages.length; i += 1) {
            const page = pdfPages[i]!;
            const canvas = canvases[i]!;

            const prior = renderTasks.get(i);
            if (prior) {
              try {
                prior.cancel();
              } catch {
                // Older tasks may already be settled.
              }
              renderTasks.delete(i);
            }

            const base = page.getViewport({ scale: 1 });
            const cssScale = pageWidthScale(drawWidth, base.width);
            const outputScale = window.devicePixelRatio || 1;
            const viewport = page.getViewport({ scale: cssScale * outputScale });

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = `${drawWidth}px`;
            canvas.style.height = `${Math.floor(base.height * cssScale)}px`;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setStatus("error");
              return;
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            const task = page.render({
              canvas,
              canvasContext: ctx,
              viewport,
            });
            renderTasks.set(i, task);
            try {
              await task.promise;
            } catch {
              if (cancelled || generation !== paintGeneration) return;
              setStatus("error");
              return;
            }
            if (cancelled || generation !== paintGeneration) return;
          }

          setStatus("ready");
          container.dataset.cvFit = "page-width";
          container.dataset.cvPages = String(pdfPages.length);
        };

        await paint();
        if (cancelled) return;

        resizeObserver = new ResizeObserver(() => {
          void paint();
        });
        resizeObserver.observe(container);
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void boot();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      for (const task of renderTasks.values()) {
        try {
          task.cancel();
        } catch {
          // ignore
        }
      }
      renderTasks.clear();
      void pdfDoc?.cleanup();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cv-frame cv-frame--canvas"
      data-cv-status={status}
      role="img"
      aria-label={title}
      aria-busy={status === "loading" ? true : undefined}
    >
      <div ref={pagesRef} className="cv-pages" />
    </div>
  );
}
