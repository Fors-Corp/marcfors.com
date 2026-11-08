import type { AskChatWidgetStrings } from "@/components/AskChatWidget";
import type { PortfolioAskStrings } from "@/components/PortfolioAsk";
import type { UiCopy } from "@/data/copy/types";

export function portfolioAskStrings(t: UiCopy): PortfolioAskStrings {
  return {
    title: t.askTitle,
    lede: t.askLede,
    placeholder: t.askPlaceholder,
    submit: t.askSubmit,
    busy: t.askBusy,
    empty: t.askEmpty,
    error: t.askError,
    unavailable: t.askUnavailable,
    citations: t.askCitations,
    samplesLabel: t.askSamplesLabel,
    samples: t.askSamples,
    sourcesLabel: t.askSourcesLabel,
    sourcesEmpty: t.askSourcesEmpty,
    sourcesUnavailable: t.askSourcesUnavailable,
  };
}

export function askChatWidgetStrings(t: UiCopy): AskChatWidgetStrings {
  return {
    ...portfolioAskStrings(t),
    open: t.askWidgetOpen,
    close: t.askWidgetClose,
    launcher: t.askWidgetLauncher,
  };
}
