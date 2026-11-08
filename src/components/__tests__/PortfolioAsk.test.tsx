import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { PortfolioAsk } from "@/components/PortfolioAsk";
import { copy } from "@/data/copy";

const strings = {
  title: copy.en.askTitle,
  lede: copy.en.askLede,
  placeholder: copy.en.askPlaceholder,
  submit: copy.en.askSubmit,
  busy: copy.en.askBusy,
  empty: copy.en.askEmpty,
  error: copy.en.askError,
  unavailable: copy.en.askUnavailable,
  citations: copy.en.askCitations,
  samplesLabel: copy.en.askSamplesLabel,
  samples: copy.en.askSamples,
  sourcesLabel: copy.en.askSourcesLabel,
  sourcesEmpty: copy.en.askSourcesEmpty,
  sourcesUnavailable: copy.en.askSourcesUnavailable,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("PortfolioAsk", () => {
  it("renders sample prompts and has no serious a11y violations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ files: ["about.md"], embedding_model: "local/x" }),
      }),
    );
    const { container } = render(<PortfolioAsk strings={strings} />);
    expect(screen.getByRole("heading", { level: 1, name: copy.en.askTitle })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.en.askSamples[0] })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("about.md")).toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });

  it("posts a question and shows the answer with citations", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/rag-sources")) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ files: ["projects.md"], embedding_model: "local/x" }),
        };
      }
      expect(init?.method).toBe("POST");
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            answer: "Embedded RAG is classic retrieval-augmented generation.",
            citations: [{ source_path: "work/embedded-rag.md", chunk_index: 0, distance: 0.12 }],
            embedding_model: "local/x",
            chat_model: "claude-sonnet-5-5",
            run_id: null,
          }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PortfolioAsk strings={strings} locale="es" />);
    await user.type(screen.getByPlaceholderText(copy.en.askPlaceholder), "What is Embedded RAG?");
    await user.click(screen.getByRole("button", { name: copy.en.askSubmit }));
    expect(
      await screen.findByText("Embedded RAG is classic retrieval-augmented generation."),
    ).toBeInTheDocument();
    expect(screen.getByText("work/embedded-rag.md")).toBeInTheDocument();
    const askCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/api/ask"));
    expect(JSON.parse(String(askCall?.[1]?.body))).toEqual({
      question: "What is Embedded RAG?",
      locale: "es",
    });
  });

  it("renders markdown in assistant answers", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rag-sources")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ files: ["about.md"], embedding_model: "local/x" }),
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              answer: "Marc works on **agents**.\n\n- **Focus:** LLM tooling (about.md).",
              citations: [{ source_path: "about.md", chunk_index: 0, distance: 0.2 }],
              embedding_model: "local/x",
              chat_model: "claude-sonnet-5-5",
              run_id: null,
            }),
        };
      }),
    );
    render(<PortfolioAsk strings={strings} />);
    await user.type(screen.getByPlaceholderText(copy.en.askPlaceholder), "Who is Marc?");
    await user.click(screen.getByRole("button", { name: copy.en.askSubmit }));
    expect(await screen.findByText("agents")).toBeInTheDocument();
    expect(screen.getByText("agents").tagName).toBe("STRONG");
    expect(screen.getByText("Focus:")).toBeInTheDocument();
    expect(screen.getByText("Focus:").closest("li")).not.toBeNull();
  });

  it("scrolls the thread without smooth motion when reduced motion is requested", async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = () => {};
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rag-sources")) {
          return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ files: ["about.md"], embedding_model: "local/x" }),
          };
        }
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              answer: "Marc works on agents.",
              citations: [],
              embedding_model: "local/x",
              chat_model: "claude",
              run_id: null,
            }),
        };
      }),
    );
    try {
      render(<PortfolioAsk strings={strings} />);
      await user.click(screen.getByRole("button", { name: copy.en.askSamples[0] }));
      await screen.findByText("Marc works on agents.");
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "auto" });
      expect(
        scrollIntoView.mock.calls.every((call) => {
          const options = call[0];
          return typeof options === "object" && options !== null && options.behavior === "auto";
        }),
      ).toBe(true);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("smooth-scrolls the thread when reduced motion is not requested", async () => {
    Element.prototype.scrollIntoView = () => {};
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ files: [], embedding_model: "local/x" }),
      }),
    );
    try {
      render(<PortfolioAsk strings={strings} />);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
    } finally {
      vi.restoreAllMocks();
    }
  });
});
