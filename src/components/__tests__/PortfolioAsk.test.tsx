import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { PortfolioAsk } from "@/components/PortfolioAsk";
import { copy } from "@/data/copy";


function jsonResponse(payload: unknown, init: { ok?: boolean; status?: number } = {}) {
  const body = new TextEncoder().encode(JSON.stringify(payload));
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    arrayBuffer: async () =>
      body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength),
  };
}

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
      vi.fn().mockResolvedValue(jsonResponse({ files: ["about.md"], embedding_model: "local/x" })),
    );
    const { container } = render(<PortfolioAsk strings={strings} />);
    expect(screen.getByRole("heading", { level: 1, name: copy.en.askTitle })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.en.askSamples[0] })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("about.md")).toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps indexed sources collapsed by default and reveals them on demand", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({
            files: ["about.md", "experience.md", "work/embedded-rag.md"],
            embedding_model: "local/x",
          })),
    );
    const { container } = render(<PortfolioAsk strings={strings} />);
    const sources = await waitFor(() => {
      const node = container.querySelector("details.ask-sources");
      expect(node).not.toBeNull();
      return node as HTMLDetailsElement;
    });
    expect(sources.open).toBe(false);
    expect(screen.getByText("3")).toBeInTheDocument();
    await user.click(screen.getByText(copy.en.askSourcesLabel));
    expect(sources.open).toBe(true);
    expect(screen.getByText("work/embedded-rag.md")).toBeVisible();
  });

  it("hides the sources disclosure in the floating widget variant", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ files: ["about.md"], embedding_model: "local/x" })),
    );
    const { container } = render(<PortfolioAsk strings={strings} variant="widget" />);
    expect(container.querySelector("details.ask-sources")).toBeNull();
    expect(screen.queryByText(copy.en.askSourcesLabel)).not.toBeInTheDocument();
  });

  it("shows the localized askError instead of English API machine text", async () => {
    const user = userEvent.setup();
    const es = {
      title: copy.es.askTitle,
      lede: copy.es.askLede,
      placeholder: copy.es.askPlaceholder,
      submit: copy.es.askSubmit,
      busy: copy.es.askBusy,
      empty: copy.es.askEmpty,
      error: copy.es.askError,
      unavailable: copy.es.askUnavailable,
      citations: copy.es.askCitations,
      samplesLabel: copy.es.askSamplesLabel,
      samples: copy.es.askSamples,
      sourcesLabel: copy.es.askSourcesLabel,
      sourcesEmpty: copy.es.askSourcesEmpty,
      sourcesUnavailable: copy.es.askSourcesUnavailable,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rag-sources")) {
          return jsonResponse({ files: ["about.md"], embedding_model: "local/x" });
        }
        return jsonResponse({ error: "request failed" }, { ok: false, status: 500 });
      }),
    );
    render(<PortfolioAsk strings={es} locale="es" />);
    await user.click(screen.getByRole("button", { name: copy.es.askSamples[0] }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.es.askError);
    expect(screen.queryByText("request failed")).not.toBeInTheDocument();
  });

  it("shows the localized unavailable string on a 503 Ask response", async () => {
    const user = userEvent.setup();
    const de = {
      title: copy.de.askTitle,
      lede: copy.de.askLede,
      placeholder: copy.de.askPlaceholder,
      submit: copy.de.askSubmit,
      busy: copy.de.askBusy,
      empty: copy.de.askEmpty,
      error: copy.de.askError,
      unavailable: copy.de.askUnavailable,
      citations: copy.de.askCitations,
      samplesLabel: copy.de.askSamplesLabel,
      samples: copy.de.askSamples,
      sourcesLabel: copy.de.askSourcesLabel,
      sourcesEmpty: copy.de.askSourcesEmpty,
      sourcesUnavailable: copy.de.askSourcesUnavailable,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rag-sources")) {
          return jsonResponse({ files: [], embedding_model: "local/x" });
        }
        return jsonResponse({ error: "DATABASE_URL is not configured" }, { ok: false, status: 503 });
      }),
    );
    render(<PortfolioAsk strings={de} locale="de" variant="widget" />);
    await user.click(screen.getByRole("button", { name: copy.de.askSamples[0] }));
    expect(await screen.findByRole("alert")).toHaveTextContent(copy.de.askUnavailable);
    expect(screen.queryByText("DATABASE_URL is not configured")).not.toBeInTheDocument();
  });

  it("posts a question and shows the answer with citations", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/rag-sources")) {
        return jsonResponse({ files: ["projects.md"], embedding_model: "local/x" });
      }
      expect(init?.method).toBe("POST");
      return jsonResponse({
            answer: "Embedded RAG is classic retrieval-augmented generation.",
            citations: [{ source_path: "work/embedded-rag.md", chunk_index: 0, distance: 0.12 }],
            embedding_model: "local/x",
            chat_model: "claude-sonnet-5-5",
            run_id: null,
          });
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

  it("renders accented Spanish answers from UTF-8 JSON without mojibake", async () => {
    const user = userEvent.setup();
    const answer =
      "Sí, Marc está abierto. Consulta la página; el único correo público.";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/rag-sources")) {
          return jsonResponse({ files: ["about.md"], embedding_model: "local/x" });
        }
        return jsonResponse({
          answer,
          citations: [{ source_path: "about.md", chunk_index: 0, distance: 0.1 }],
          embedding_model: "local/x",
          chat_model: "claude-sonnet-5-5",
          run_id: null,
        });
      }),
    );
    const es = {
      ...strings,
      title: copy.es.askTitle,
      lede: copy.es.askLede,
      placeholder: copy.es.askPlaceholder,
      submit: copy.es.askSubmit,
      busy: copy.es.askBusy,
      empty: copy.es.askEmpty,
      error: copy.es.askError,
      unavailable: copy.es.askUnavailable,
      citations: copy.es.askCitations,
      samplesLabel: copy.es.askSamplesLabel,
      samples: copy.es.askSamples,
      sourcesLabel: copy.es.askSourcesLabel,
      sourcesEmpty: copy.es.askSourcesEmpty,
      sourcesUnavailable: copy.es.askSourcesUnavailable,
    };
    render(<PortfolioAsk strings={es} locale="es" variant="widget" />);
    await user.type(screen.getByPlaceholderText(copy.es.askPlaceholder), "¿Marc acepta remoto?");
    await user.click(screen.getByRole("button", { name: copy.es.askSubmit }));
    expect(await screen.findByText(answer)).toBeInTheDocument();
    expect(screen.queryByText(/Ă|Ã/)).not.toBeInTheDocument();
  });

  it("blurs the composer after send so the mobile keyboard dismisses", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({
            answer: "Madrid.",
            citations: [],
            embedding_model: "local/x",
            chat_model: "claude",
            run_id: null,
          })),
    );
    render(<PortfolioAsk strings={strings} variant="widget" />);
    const input = screen.getByRole("textbox", { name: copy.en.askPlaceholder });
    await user.click(input);
    expect(input).toHaveFocus();
    await user.type(input, "Where does Marc live?");
    await user.click(screen.getByRole("button", { name: copy.en.askSubmit }));
    expect(input).not.toHaveFocus();
    expect(await screen.findByText("Madrid.")).toBeInTheDocument();
  });

  it("renders markdown in assistant answers", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rag-sources")) {
          return jsonResponse({ files: ["about.md"], embedding_model: "local/x" });
        }
        return jsonResponse({
              answer: "Marc works on **agents**.\n\n- **Focus:** LLM tooling (about.md).",
              citations: [{ source_path: "about.md", chunk_index: 0, distance: 0.2 }],
              embedding_model: "local/x",
              chat_model: "claude-sonnet-5-5",
              run_id: null,
            });
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
          return jsonResponse({ files: ["about.md"], embedding_model: "local/x" });
        }
        return jsonResponse({
              answer: "Marc works on agents.",
              citations: [],
              embedding_model: "local/x",
              chat_model: "claude",
              run_id: null,
            });
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
      vi.fn().mockResolvedValue(jsonResponse({ files: [], embedding_model: "local/x" })),
    );
    try {
      render(<PortfolioAsk strings={strings} />);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", behavior: "smooth" });
    } finally {
      vi.restoreAllMocks();
    }
  });
});
