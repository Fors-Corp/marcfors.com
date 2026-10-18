import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { onLCP } from "web-vitals";
import { SignalBoard, type SignalStrings } from "@/components/SignalBoard";
import { copy } from "@/data/copy";
import { getAuditSnapshot } from "@/lib/audit";
import { VITAL_NAMES } from "@/lib/vitals";

const en = copy.en;
const strings: SignalStrings = {
  signalTitle: en.signalTitle,
  signalLede: en.signalLede,
  auditTitle: en.auditTitle,
  auditBody: en.auditBody,
  auditClean: en.auditClean,
  auditHot: en.auditHot,
  obsTitle: en.obsTitle,
  vitalsTitle: en.vitalsTitle,
  vitalGood: en.vitalGood,
  vitalDefs: en.vitalDefs,
  healthLine: en.healthLine,
  healthWaiting: en.healthWaiting,
  controls: en.controls,
};

vi.mock("web-vitals", () => ({
  onLCP: vi.fn(),
  onINP: vi.fn(),
  onCLS: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

const audit = getAuditSnapshot();

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        version: "9.9.9",
        commit: "abcdef1234",
        region: "fra1",
        audit,
      }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SignalBoard", () => {
  it("reserves a meter for every vital before any data arrives", () => {
    render(<SignalBoard audit={audit} strings={strings} />);
    const meters = document.querySelectorAll(".meter");
    expect(meters).toHaveLength(VITAL_NAMES.length);
    // every value cell starts as a pending dash
    expect([...document.querySelectorAll(".meter-value")].every((n) => n.textContent === "—")).toBe(true);
  });

  it("renders the build-time audit snapshot counts", () => {
    render(<SignalBoard audit={audit} strings={strings} />);
    expect(screen.getByText(`critical ${audit.critical}`)).toBeInTheDocument();
    expect(screen.getByText(`high ${audit.high}`)).toBeInTheDocument();
  });

  it("swaps in the live health line once /api/health resolves", async () => {
    render(<SignalBoard audit={audit} strings={strings} />);
    expect(screen.getByText(copy.en.healthWaiting)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/9\.9\.9 · abcdef1 · fra1/)).toBeInTheDocument();
    });
  });

  it("ignores an HTTP error from /api/health instead of rendering its body", async () => {
    const failing = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ error: "down" }) });
    vi.stubGlobal("fetch", failing);
    render(<SignalBoard audit={audit} strings={strings} />);
    await waitFor(() => expect(failing).toHaveBeenCalled());
    expect(screen.getByText(copy.en.healthWaiting)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("undefined");
  });

  it("ignores a health body whose audit lacks the rendered counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ region: "fra1", audit: {} }) }),
    );
    render(<SignalBoard audit={audit} strings={strings} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText(`critical ${audit.critical}`)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("undefined");
  });

  it("swallows a failed vitals beacon instead of leaving an unhandled rejection", async () => {
    // A plain function, not vi.fn: a spy attaches handlers to returned promises
    // to record settled results, which would mark this rejection as handled.
    const urls: string[] = [];
    vi.stubGlobal("fetch", (url: string) => {
      urls.push(url);
      return url === "/api/vitals"
        ? Promise.reject(new TypeError("offline"))
        : Promise.resolve({ ok: false, status: 503, json: async () => ({}) });
    });
    vi.mocked(onLCP).mockImplementationOnce((report) => report({ name: "LCP", value: 900, id: "v1" } as never));
    const unhandled: unknown[] = [];
    const record = (reason: unknown) => unhandled.push(reason);
    process.on("unhandledRejection", record);
    try {
      render(<SignalBoard audit={audit} strings={strings} />);
      await waitFor(() => expect(urls).toContain("/api/vitals"));
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(unhandled).toEqual([]);
    } finally {
      process.off("unhandledRejection", record);
    }
  });

  it("keeps the build snapshot when /api/health fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<SignalBoard audit={audit} strings={strings} />);
    await waitFor(() => expect(screen.getByText(copy.en.healthWaiting)).toBeInTheDocument());
    expect(screen.getByText(`critical ${audit.critical}`)).toBeInTheDocument();
  });
});
