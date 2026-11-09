"use client";

import dynamic from "next/dynamic";

/**
 * Code-split the canvas atlas off the first homepage JS. A sized stage keeps
 * layout stable while the chunk loads (see `.atlas-stage--loading` in CSS).
 */
export const WordAtlasLazy = dynamic(
  () => import("@/components/WordAtlas").then((mod) => mod.WordAtlas),
  {
    loading: () => <div className="atlas-stage atlas-stage--loading" aria-hidden="true" />,
  },
);
